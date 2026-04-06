/**
 * GET /api/booking/slots?date=2026-03-31
 *
 * Returns available 30-minute booking slots for a given date.
 *
 * Business hours: Mon–Fri 11 AM – 2 PM Mountain Time
 * Slot duration: 30 minutes
 * Calendar block: 60 minutes (30 min call + 30 min buffer)
 *
 * Performs a free/busy check against Google Calendar to exclude booked times.
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const TIMEZONE = 'America/Denver';
const SLOT_MINUTES = 30;
const BLOCK_MINUTES = 60;
const START_HOUR = 11;
const END_HOUR = 14;
const CALENDAR_ID = 'cory.salisbury@gmail.com';

interface Slot {
  start: string;
  end: string;
  label: string;
}

/**
 * Get the current UTC offset for America/Denver (handles MST/MDT automatically).
 * Returns a string like "-06:00" or "-07:00".
 */
function getMountainOffset(dateStr: string): string {
  // Create a date in the target timezone and extract the offset
  const date = new Date(`${dateStr}T12:00:00Z`);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    timeZoneName: 'shortOffset',
  });
  const parts = formatter.formatToParts(date);
  const tzPart = parts.find(p => p.type === 'timeZoneName');
  // tzPart.value is like "GMT-6" or "GMT-7"
  if (tzPart?.value) {
    const match = tzPart.value.match(/GMT([+-])(\d+)/);
    if (match) {
      const sign = match[1];
      const hours = match[2].padStart(2, '0');
      return `${sign}${hours}:00`;
    }
  }
  // Fallback: compute offset by comparing UTC and local representations
  const utcHour = date.getUTCHours();
  const localStr = date.toLocaleString('en-US', { timeZone: TIMEZONE, hour: 'numeric', hour12: false });
  const localHour = parseInt(localStr, 10);
  const diff = localHour - utcHour;
  const sign = diff <= 0 ? '-' : '+';
  const absDiff = Math.abs(diff);
  return `${sign}${String(absDiff).padStart(2, '0')}:00`;
}

/**
 * Generate all potential slots for a given date
 */
function generateSlots(dateStr: string): Slot[] {
  const slots: Slot[] = [];

  for (let hour = START_HOUR; hour < END_HOUR; hour++) {
    for (let min = 0; min < 60; min += SLOT_MINUTES) {
      const endMin = min + SLOT_MINUTES;
      const endHour = hour + Math.floor(endMin / 60);
      const endMinRem = endMin % 60;
      if (endHour > END_HOUR || (endHour === END_HOUR && endMinRem > 0)) continue;

      const startDT = `${dateStr}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`;
      const endDT = `${dateStr}T${String(endHour).padStart(2, '0')}:${String(endMinRem).padStart(2, '0')}:00`;

      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const label = `${displayHour}:${String(min).padStart(2, '0')} ${ampm}`;

      slots.push({ start: startDT, end: endDT, label });
    }
  }

  return slots;
}

/**
 * Get an OAuth2 access token from the refresh token
 */
async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.warn('[booking/slots] Google Calendar credentials not configured');
    return null;
  }

  try {
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
      console.error('[booking/slots] Token refresh failed:', tokenData.error || tokenData);
      return null;
    }

    return tokenData.access_token;
  } catch (err) {
    console.error('[booking/slots] Token refresh error:', err);
    return null;
  }
}

/**
 * Call Google Calendar free/busy API to check busy times
 */
async function getBusyPeriods(dateStr: string): Promise<{ start: string; end: string }[]> {
  const accessToken = await getAccessToken();
  if (!accessToken) return [];

  try {
    const offset = getMountainOffset(dateStr);
    const timeMin = `${dateStr}T${String(START_HOUR).padStart(2, '0')}:00:00${offset}`;
    const bufferHours = Math.ceil(BLOCK_MINUTES / 60);
    const timeMax = `${dateStr}T${String(END_HOUR + bufferHours).padStart(2, '0')}:00:00${offset}`;

    console.log(`[booking/slots] Free/busy query: ${timeMin} → ${timeMax}`);

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
      console.error('[booking/slots] Free/busy API error:', JSON.stringify(fbData.error));
      return [];
    }

    const calendarData = fbData?.calendars?.[CALENDAR_ID];
    if (calendarData?.errors?.length) {
      console.error('[booking/slots] Calendar errors:', JSON.stringify(calendarData.errors));
      return [];
    }

    const busy = calendarData?.busy || [];
    console.log(`[booking/slots] Found ${busy.length} busy periods for ${dateStr}`);
    return busy;
  } catch (err) {
    console.error('[booking/slots] Google Calendar free/busy check failed:', err);
    return [];
  }
}

/**
 * Check if a slot overlaps any busy period.
 * Uses BLOCK_MINUTES (1 hour) to account for the 30-min buffer.
 */
function isSlotBusy(slot: Slot, busyPeriods: { start: string; end: string }[], offset: string): boolean {
  for (const busy of busyPeriods) {
    const busyStart = new Date(busy.start).getTime();
    const busyEnd = new Date(busy.end).getTime();
    // Slot times with correct dynamic timezone offset
    const slotStart = new Date(`${slot.start}${offset}`).getTime();
    const slotBlockEnd = slotStart + BLOCK_MINUTES * 60 * 1000;

    if (slotStart < busyEnd && slotBlockEnd > busyStart) {
      return true;
    }
  }
  return false;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get('date');

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json({ error: 'Invalid date. Use YYYY-MM-DD.' }, { status: 400 });
  }

  // Check if date is a weekday
  const date = new Date(`${dateStr}T12:00:00`);
  const day = date.getDay();
  if (day === 0 || day === 6) {
    return NextResponse.json({ slots: [] });
  }

  // Check if date is in the past
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
  if (dateStr < todayStr) {
    return NextResponse.json({ slots: [] });
  }

  // Generate all possible slots
  let allSlots = generateSlots(dateStr);

  // Filter out past slots if today
  if (dateStr === todayStr) {
    const nowMT = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
    const nowHour = nowMT.getHours();
    const nowMin = nowMT.getMinutes();
    allSlots = allSlots.filter(slot => {
      const [h, m] = slot.start.split('T')[1].split(':').map(Number);
      return h > nowHour + 1 || (h === nowHour + 1 && m >= nowMin);
    });
  }

  // Check Google Calendar for busy periods
  const busyPeriods = await getBusyPeriods(dateStr);
  if (busyPeriods.length > 0) {
    const offset = getMountainOffset(dateStr);
    allSlots = allSlots.filter(slot => !isSlotBusy(slot, busyPeriods, offset));
  }

  return NextResponse.json({ slots: allSlots });
}
