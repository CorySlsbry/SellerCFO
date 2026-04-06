import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const { event, page, referrer, utm_source, utm_medium, utm_campaign } = await request.json();

    await supabase.from('page_analytics').insert({
      event: event || 'page_view',
      page: page || '/',
      referrer: referrer || null,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      user_agent: request.headers.get('user-agent') || null,
      ip_hash: null, // We don't store IPs — just a placeholder for session grouping if needed later
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Analytics track error:', error);
    return NextResponse.json({ ok: true }); // Always 200 — don't break UX for analytics
  }
}
