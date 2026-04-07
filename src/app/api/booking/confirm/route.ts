/**
 * POST /api/booking/confirm
 *
 * Confirms a booking:
 * 1. Checks Google Calendar free/busy to reject double-bookings
 * 2. Creates a Google Calendar event on cory.salisbury@gmail.com
 *    with Google Meet link — sends invite emails to attendees
 * 3. Creates/updates a GHL contact tagged "scope-call-booked"
 * 4. Returns confirmation with calendar + GHL status
 *
 * Body: { name, email, company?, start, end }
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const TIMEZONE = 'America/Denver';
const CALENDAR_ID = 'cory.salisbury@gmail.com';
const OWNER_EMAIL = 'cory.salisbury@gmail.com';
const BLOCK_MINUTES = 60; // 30 min call + 30 min buffer

interface BookingPayload {
  name: string;
  email: string;
  company?: string;
  start: string; // e.g. "2026-04-02T11:00:00"
  end: string;
}

/**
 * Get the current UTC offset for America/Denver (handles MST/MDT automatically).
 */
function getMountainOffset(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00Z`);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    timeZoneName: 'shortOffset',
  });
  const parts = formatter.formatToParts(date);
  const tzPart = parts.find(p => p.type === 'timeZoneName');
  if (tzPart?.value) {
    const match = tzPart.value.match(/GMT([+-])(\d+)/);
    if (match) {
      const sign = match[1];
      const hours = match[2].padStart(2, '0');
      return `${sign}${hours}:00`;
    }
  }
  return '-07:00'; // Safe fallback (MST)
}

/**
 * Get an OAuth2 access token from the refresh token
 */
async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.error('[booking/confirm] Missing Google Calendar env vars:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasRefreshToken: !!refreshToken,
    });
    return null;
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    console.error('[booking/confirm] Token refresh failed:', {
      status: tokenRes.status,
      error: tokenData.error,
      description: tokenData.error_description,
    });
    return null;
  }

  return tokenData.access_token;
}

/**
 * Check if the requested time slot conflicts with existing events.
 * Returns true if the slot is available, false if there's a conflict.
 */
async function checkAvailability(accessToken: string, payload: BookingPayload): Promise<{ available: boolean; error?: string }> {
  try {
    const datePart = payload.start.split('T')[0];
    const offset = getMountainOffset(datePart);

    // Check the full block (slot + buffer)
    const [startH, startM] = payload.start.split('T')[1].split(':').map(Number);
    const totalMinutes = startH * 60 + startM + BLOCK_MINUTES;
    const endH = Math.floor(totalMinutes / 60);
    const endM = totalMinutes % 60;

    const timeMin = `${payload.start}${offset}`;
    const timeMax = `${datePart}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00${offset}`;

    const fbRes = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timeMin,
        timeMax,
        timeZone: TIMEZONE,
        items: [{ id: CALENDAR_ID }],
      }),
    });
    const fbData = await fbRes.json();

    if (fbData.error) {
      console.error('[booking/confirm] Free/busy check error:', fbData.error);
      // Don't block booking if free/busy check fails — allow it through
      return { available: true };
    }

    const busy = fbData?.calendars?.[CALENDAR_ID]?.busy || [];
    console.log(`[booking/confirm] Conflict check for ${timeMin} → ${timeMax}: ${busy.length} conflicts`);

    if (busy.length > 0) {
      return { available: false, error: 'This time slot is no longer available. Please choose a different time.' };
    }

    return { available: true };
  } catch (err) {
    console.error('[booking/confirm] Availability check threw:', err);
    // Don't block booking on error
    return { available: true };
  }
}

/**
 * Create a Google Calendar event via OAuth2.
 *
 * IMPORTANT: Do NOT add the calendar owner (CALENDAR_ID) as an attendee.
 * Adding the owner as attendee sets their responseStatus to "needsAction",
 * which causes the free/busy API to NOT report the event as busy — breaking
 * availability checks for future bookings.
 */
async function createCalendarEvent(accessToken: string, payload: BookingPayload): Promise<{ success: boolean; eventId?: string; meetLink?: string; error?: string }> {
  try {
    const companyStr = payload.company ? ` (${payload.company})` : '';

    // Calculate block end time (30 min call + 30 min buffer = 60 min total)
    const [datePart, timePart] = payload.start.split('T');
    const [startH, startM] = timePart.split(':').map(Number);
    const totalMinutes = startH * 60 + startM + BLOCK_MINUTES;
    const endH = Math.floor(totalMinutes / 60);
    const endM = totalMinutes % 60;
    const blockEnd = `${datePart}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;

    const eventBody = {
      summary: `SellerCFO Scope Call — ${payload.name}${companyStr}`,
      description: [
        `Scope call booked via sellercfo.vercel.app`,
        ``,
        `Name: ${payload.name}`,
        `Email: ${payload.email}`,
        payload.company ? `Brand: ${payload.company}` : null,
        ``,
        `30-minute scope call + 30-minute buffer.`,
        `Review their sales channels and show what SellerCFO can do for their e-commerce profitability.`,
      ].filter(Boolean).join('\n'),
      start: {
        dateTime: payload.start,
        timeZone: TIMEZONE,
      },
      end: {
        dateTime: blockEnd,
        timeZone: TIMEZONE,
      },
      // ONLY external attendees — NOT the calendar owner.
      // Adding the calendar owner as attendee to their own calendar causes
      // responseStatus=needsAction which breaks free/busy checks.
      attendees: [
        { email: payload.email, displayName: payload.name }, // prospect only
      ],
      conferenceData: {
        createRequest: {
          conferenceSolutionKey: { type: 'hangoutsMeet' },
          requestId: `sellercfo-${Date.now()}`,
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'email', minutes: 60 },
        ],
      },
      guestsCanSeeOtherGuests: false,
    };

    console.log('[booking/confirm] Creating calendar event:', {
      summary: eventBody.summary,
      start: eventBody.start,
      end: eventBody.end,
      attendees: eventBody.attendees.map(a => a.email),
    });

    const eventRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?sendUpdates=all&conferenceDataVersion=1`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventBody),
      }
    );

    const eventData = await eventRes.json();

    if (!eventRes.ok || !eventData.id) {
      console.error('[booking/confirm] Event creation failed:', {
        status: eventRes.status,
        error: eventData.error,
        message: eventData.error?.message,
        errors: eventData.error?.errors,
      });
      return { success: false, error: eventData.error?.message || `HTTP ${eventRes.status}` };
    }

    console.log('[booking/confirm] Event created successfully:', {
      eventId: eventData.id,
      htmlLink: eventData.htmlLink,
      meetLink: eventData.hangoutLink,
      attendees: eventData.attendees?.length,
    });

    return {
      success: true,
      eventId: eventData.id,
      meetLink: eventData.hangoutLink || undefined,
    };
  } catch (err) {
    console.error('[booking/confirm] Calendar event creation threw:', err);
    return { success: false, error: 'Calendar API error' };
  }
}

/**
 * Create/update a GHL contact tagged for the scope call workflow
 */
async function pushToGHL(payload: BookingPayload): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;

  if (!apiKey || !locationId) {
    console.warn('[booking/confirm] GHL credentials not configured — skipping contact push');
    return { success: false, error: 'GHL not configured' };
  }

  try {
    const [firstName, ...lastParts] = payload.name.split(' ');
    const lastName = lastParts.join(' ') || '';

    const res = await fetch('https://services.leadconnectorhq.com/contacts/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Version: '2021-07-28',
      },
      body: JSON.stringify({
        locationId,
        firstName,
        lastName,
        email: payload.email,
        companyName: payload.company || undefined,
        tags: ['scope-call-booked', 'sellercfo-landing'],
        source: 'SellerCFO Website',
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[booking/confirm] GHL push failed:', { status: res.status, data });
      return { success: false, error: `GHL HTTP ${res.status}` };
    }

    console.log(`[booking/confirm] GHL contact created/updated: ${data?.contact?.id || 'unknown'}`);
    return { success: true };
  } catch (err) {
    console.error('[booking/confirm] GHL push threw:', err);
    return { success: false, error: 'GHL API error' };
  }
}

/**
 * Send a confirmation email to the person who booked the call via Resend.
 */
async function sendConfirmationEmail(payload: BookingPayload, meetLink?: string): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[booking/confirm] RESEND_API_KEY not set — skipping confirmation email');
    return { success: false, error: 'Resend not configured' };
  }

  try {
    const resend = new Resend(apiKey);
    const startDate = new Date(payload.start);
    const dateStr = startDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: TIMEZONE,
    });
    const timeStr = startDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: TIMEZONE,
      timeZoneName: 'short',
    });

    const meetSection = meetLink
      ? `<p style="margin:16px 0"><a href="${meetLink}" style="display:inline-block;padding:12px 24px;background:#8b5cf6;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Join Google Meet</a></p>`
      : '';

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'SellerCFO <onboarding@resend.dev>',
      to: [payload.email],
      replyTo: OWNER_EMAIL,
      subject: `You're confirmed — SellerCFO Scope Call on ${dateStr}`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e">
          <div style="padding:32px 24px;background:linear-gradient(135deg,#0a0a1a,#1a1a2e);border-radius:12px 12px 0 0">
            <h1 style="margin:0;color:#8b5cf6;font-size:24px">SellerCFO</h1>
          </div>
          <div style="padding:24px;background:#fff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
            <h2 style="margin:0 0 16px;font-size:20px;color:#1a1a2e">You're all set, ${payload.name.split(' ')[0]}!</h2>
            <p style="margin:0 0 16px;color:#475569;line-height:1.6">Your 30-minute scope call is confirmed:</p>
            <div style="padding:16px;background:#f8fafc;border-radius:8px;margin:0 0 16px">
              <p style="margin:0 0 8px"><strong>Date:</strong> ${dateStr}</p>
              <p style="margin:0 0 8px"><strong>Time:</strong> ${timeStr}</p>
              <p style="margin:0"><strong>Duration:</strong> 30 minutes</p>
            </div>
            ${meetSection}
            <p style="margin:16px 0 0;color:#475569;line-height:1.6">We'll review your sales channels and show you exactly where you're leaving money on the table. Come prepared with any questions about your e-commerce profitability.</p>
            <p style="margin:16px 0 0;color:#475569;line-height:1.6">Need to reschedule? Just reply to this email.</p>
            <p style="margin:24px 0 0;color:#475569">— Cory Salisbury<br/>SellerCFO</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('[booking/confirm] Resend email failed:', error);
      return { success: false, error: error.message };
    }

    console.log('[booking/confirm] Confirmation email sent:', data?.id);
    return { success: true };
  } catch (err) {
    console.error('[booking/confirm] Confirmation email threw:', err);
    return { success: false, error: 'Email send error' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: BookingPayload = await request.json();

    // Validate
    if (!body.name || !body.email || !body.start || !body.end) {
      return NextResponse.json({ ok: false, error: 'Missing required fields.' }, { status: 400 });
    }
    if (!body.email.includes('@')) {
      return NextResponse.json({ ok: false, error: 'Invalid email.' }, { status: 400 });
    }

    // Get access token first (needed for both conflict check and event creation)
    let accessToken: string | null;
    try {
      accessToken = await getAccessToken();
    } catch {
      accessToken = null;
    }

    // Server-side conflict check: reject double-bookings
    if (accessToken) {
      const availability = await checkAvailability(accessToken, body);
      if (!availability.available) {
        return NextResponse.json({
          ok: false,
          error: availability.error || 'Time slot is no longer available.',
        }, { status: 409 });
      }
    }

    // Create calendar event and push to GHL in parallel
    const [calResult, ghlResult] = await Promise.all([
      accessToken
        ? createCalendarEvent(accessToken, body)
        : Promise.resolve({ success: false as const, error: 'Calendar not configured', meetLink: undefined }),
      pushToGHL(body),
    ]);

    // Send confirmation email to the requester (includes Meet link if available)
    const emailResult = await sendConfirmationEmail(body, calResult.meetLink);

    console.log('[booking/confirm] Results:', {
      calendar: calResult.success ? 'OK' : calResult.error,
      ghl: ghlResult.success ? 'OK' : ghlResult.error,
      email: emailResult.success ? 'OK' : emailResult.error,
    });

    return NextResponse.json({
      ok: true,
      calendarEvent: calResult.success,
      calendarError: calResult.success ? undefined : calResult.error,
      meetLink: calResult.meetLink,
      ghlContact: ghlResult.success,
      confirmationEmail: emailResult.success,
    });
  } catch (err) {
    console.error('[booking/confirm] Error:', err);
    return NextResponse.json({ ok: false, error: 'Booking failed.' }, { status: 500 });
  }
}
