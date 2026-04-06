/**
 * GET /api/booking/debug?key=salisbury
 * GET /api/booking/debug?key=salisbury&test_slots=2026-03-31
 *
 * Diagnostic endpoint. If test_slots param is provided, simulates the
 * full slots route logic with verbose intermediate output.
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CALENDAR_ID = 'cory.salisbury@gmail.com';
const TIMEZONE = 'America/Denver';
const SLOT_MINUTES = 30;
const BLOCK_MINUTES = 60;
const START_HOUR = 11;
const END_HOUR = 14;

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
  const utcHour = date.getUTCHours();
  const localStr = date.toLocaleString('en-US', { timeZone: TIMEZONE, hour: 'numeric', hour12: false });
  const localHour = parseInt(localStr, 10);
  const diff = localHour - utcHour;
  const sign = diff <= 0 ? '-' : '+';
  const absDiff = Math.abs(diff);
  return `${sign}${String(absDiff).padStart(2, '0')}:00`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('key') !== 'salisbury') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;

  const results: Record<string, unknown> = {};

  results.envVars = {
    GOOGLE_CALENDAR_CLIENT_ID: clientId ? `${clientId.substring(0, 12)}...` : 'MISSING',
    GOOGLE_CALENDAR_CLIENT_SECRET: clientSecret ? `${clientSecret.substring(0, 8)}...` : 'MISSING',
    GOOGLE_CALENDAR_REFRESH_TOKEN: refreshToken ? `${refreshToken.substring(0, 10)}...` : 'MISSING',
    GHL_API_KEY: process.env.GHL_API_KEY ? 'SET' : 'MISSING',
    GHL_LOCATION_ID: process.env.GHL_LOCATION_ID ? 'SET' : 'MISSING',
  };

  if (!clientId || !clientSecret || !refreshToken) {
    results.error = 'Missing Google Calendar credentials.';
    return NextResponse.json(results);
  }

  // Get access token
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
  results.tokenRefresh = {
    status: tokenRes.status,
    hasAccessToken: !!tokenData.access_token,
    scope: tokenData.scope || null,
    error: tokenData.error || null,
  };

  if (!tokenData.access_token) return NextResponse.json(results);
  const accessToken = tokenData.access_token;

  // If test_slots param provided, simulate the full slots route
  const testDate = searchParams.get('test_slots');
  if (testDate) {
    const offset = getMountainOffset(testDate);
    results.slotsSimulation = { dateStr: testDate, offset };

    // Generate slots
    const slots: { start: string; end: string; label: string }[] = [];
    for (let hour = START_HOUR; hour < END_HOUR; hour++) {
      for (let min = 0; min < 60; min += SLOT_MINUTES) {
        const endMin = min + SLOT_MINUTES;
        const endHour = hour + Math.floor(endMin / 60);
        const endMinRem = endMin % 60;
        if (endHour > END_HOUR || (endHour === END_HOUR && endMinRem > 0)) continue;
        const startDT = `${testDate}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`;
        const endDT = `${testDate}T${String(endHour).padStart(2, '0')}:${String(endMinRem).padStart(2, '0')}:00`;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const label = `${displayHour}:${String(min).padStart(2, '0')} ${ampm}`;
        slots.push({ start: startDT, end: endDT, label });
      }
    }
    (results.slotsSimulation as Record<string, unknown>).allSlots = slots.map(s => s.label);

    // Free/busy query
    const timeMin = `${testDate}T${String(START_HOUR).padStart(2, '0')}:00:00${offset}`;
    const bufferHours = Math.ceil(BLOCK_MINUTES / 60);
    const timeMax = `${testDate}T${String(END_HOUR + bufferHours).padStart(2, '0')}:00:00${offset}`;

    (results.slotsSimulation as Record<string, unknown>).freeBusyQuery = { timeMin, timeMax };

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
    const busyPeriods = fbData?.calendars?.[CALENDAR_ID]?.busy || [];
    (results.slotsSimulation as Record<string, unknown>).rawBusyPeriods = busyPeriods;
    (results.slotsSimulation as Record<string, unknown>).calendarErrors = fbData?.calendars?.[CALENDAR_ID]?.errors || null;

    // Now trace overlap check for each slot
    const slotAnalysis = slots.map(slot => {
      const slotStartWithOffset = `${slot.start}${offset}`;
      const slotStartMs = new Date(slotStartWithOffset).getTime();
      const slotBlockEndMs = slotStartMs + BLOCK_MINUTES * 60 * 1000;

      const overlaps = busyPeriods.map((busy: { start: string; end: string }) => {
        const busyStartMs = new Date(busy.start).getTime();
        const busyEndMs = new Date(busy.end).getTime();
        const overlapping = slotStartMs < busyEndMs && slotBlockEndMs > busyStartMs;
        return {
          busyStart: busy.start,
          busyEnd: busy.end,
          busyStartMs,
          busyEndMs,
          slotStartMs,
          slotBlockEndMs,
          slotStartLtBusyEnd: slotStartMs < busyEndMs,
          slotBlockEndGtBusyStart: slotBlockEndMs > busyStartMs,
          overlapping,
        };
      });

      const isBusy = overlaps.some((o: { overlapping: boolean }) => o.overlapping);

      return {
        label: slot.label,
        slotStart: slot.start,
        slotStartWithOffset: slotStartWithOffset,
        slotStartMs,
        slotBlockEndMs,
        slotBlockEndUTC: new Date(slotBlockEndMs).toISOString(),
        isBusy,
        overlaps,
      };
    });

    (results.slotsSimulation as Record<string, unknown>).slotAnalysis = slotAnalysis;

    const availableSlots = slotAnalysis.filter(s => !s.isBusy).map(s => s.label);
    const blockedSlots = slotAnalysis.filter(s => s.isBusy).map(s => s.label);
    (results.slotsSimulation as Record<string, unknown>).availableSlots = availableSlots;
    (results.slotsSimulation as Record<string, unknown>).blockedSlots = blockedSlots;

    return NextResponse.json(results, { status: 200 });
  }

  // Default: basic credential check
  const fbRes = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      timeMin: new Date().toISOString(),
      timeMax: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      timeZone: TIMEZONE,
      items: [{ id: CALENDAR_ID }],
    }),
  });
  const fbData = await fbRes.json();
  results.freeBusy = {
    status: fbRes.status,
    busyPeriods: fbData?.calendars?.[CALENDAR_ID]?.busy || [],
    calendarErrors: fbData?.calendars?.[CALENDAR_ID]?.errors || null,
  };

  return NextResponse.json(results, { status: 200 });
}
