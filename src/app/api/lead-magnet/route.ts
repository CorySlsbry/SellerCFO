/**
 * Lead Magnet Capture API
 * POST /api/lead-magnet
 *
 * Captures email + name, stores where possible (Supabase, GHL),
 * and always returns the PDF download URL — never blocks the user.
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const downloadUrl = 'https://assets.cdn.filesafe.space/d6snrvwPYgsUbjfj6Dox/media/69cabaf3db6d4f5d3e7554df.pdf';

  try {
    const { email, firstName, source } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Enter a valid email.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = firstName?.trim() || null;

    // ── Supabase: try lead_captures, fall back to page_analytics ──
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Try the lead_captures table first
      await supabase.from('lead_captures').insert({
        email: cleanEmail,
        first_name: cleanName,
        source: source || 'ai-prompts-lead-magnet',
        captured_at: new Date().toISOString(),
      });

      // Also log as analytics event (always works)
      await supabase.from('page_analytics').insert({
        event: 'lead_magnet_capture',
        page: '/',
        referrer: null,
        utm_source: source || 'landing-page',
        utm_medium: 'lead-magnet',
        utm_campaign: 'ai-prompts',
        user_agent: request.headers.get('user-agent') || null,
        ip_hash: null,
      });
    } catch (e) {
      console.warn('Supabase lead capture warning (non-blocking):', e);
    }

    // ── GHL: create contact if API key is set ──
    try {
      const ghlKey = process.env.GHL_API_KEY;
      if (ghlKey) {
        const ghlLocationId = process.env.GHL_LOCATION_ID || 'd6snrvwPYgsUbjfj6Dox';
        await fetch('https://services.leadconnectorhq.com/contacts/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ghlKey}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28',
          },
          body: JSON.stringify({
            locationId: ghlLocationId,
            email: cleanEmail,
            firstName: cleanName || undefined,
            tags: ['medicalcfo-lead-magnet'],
            source: 'MedicalCFO Lead Magnet',
          }),
        });
      }
    } catch (e) {
      console.warn('GHL contact creation warning (non-blocking):', e);
    }

    // ── Always return success + download URL ──
    return NextResponse.json({ ok: true, downloadUrl });
  } catch (error) {
    console.error('Lead magnet error:', error);
    // Even on error, give them the PDF — don't punish the user
    return NextResponse.json({ ok: true, downloadUrl });
  }
}
