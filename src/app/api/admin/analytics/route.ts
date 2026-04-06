import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 1000;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Fetches ALL rows from a Supabase table matching the query,
 * paginating past the default 1000-row limit.
 */
async function fetchAllRows(
  table: string,
  columns: string,
  sinceISO: string
): Promise<any[]> {
  const supabase = getSupabase();
  const allRows: any[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .gte('created_at', sinceISO)
      .order('created_at', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error(`Error fetching ${table} at offset ${offset}:`, error);
      break;
    }

    if (data && data.length > 0) {
      allRows.push(...data);
      offset += data.length;
      // If we got fewer rows than the page size, we've reached the end
      hasMore = data.length === PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }

  return allRows;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceISO = since.toISOString();

    // 1. Page views — paginate to get ALL rows (no 1000-row cap)
    const rawViews = await fetchAllRows('page_analytics', 'created_at, page, event, referrer, utm_source', sinceISO);

    // 2. Signups (new profiles created) — also paginate
    const rawSignups = await fetchAllRows('profiles', 'created_at', sinceISO);

    // 3. Current subscription counts
    const { data: orgs } = await getSupabase()
      .from('organizations')
      .select('plan, subscription_status, created_at');

    // Aggregate page views by day
    const viewsByDay: Record<string, { views: number; unique_pages: Set<string>; signups: number }> = {};

    const initDay = (day: string) => {
      if (!viewsByDay[day]) viewsByDay[day] = { views: 0, unique_pages: new Set(), signups: 0 };
    };

    // Fill in all days in range
    for (let d = new Date(since); d <= new Date(); d.setDate(d.getDate() + 1)) {
      initDay(d.toISOString().split('T')[0]);
    }

    (rawViews || []).forEach((v: any) => {
      const day = v.created_at?.split('T')[0];
      if (day) {
        initDay(day);
        viewsByDay[day].views++;
        viewsByDay[day].unique_pages.add(v.page);
      }
    });

    (rawSignups || []).forEach((s: any) => {
      const day = s.created_at?.split('T')[0];
      if (day) {
        initDay(day);
        viewsByDay[day].signups++;
      }
    });

    const dailyData = Object.entries(viewsByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        views: data.views,
        unique_pages: data.unique_pages.size,
        signups: data.signups,
      }));

    // Aggregate by page
    const pageBreakdown: Record<string, number> = {};
    (rawViews || []).forEach((v: any) => {
      const pg = v.page || '/';
      pageBreakdown[pg] = (pageBreakdown[pg] || 0) + 1;
    });

    const topPages = Object.entries(pageBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([page, count]) => ({ page, count }));

    // Aggregate by event type
    const eventBreakdown: Record<string, number> = {};
    (rawViews || []).forEach((v: any) => {
      const ev = v.event || 'page_view';
      eventBreakdown[ev] = (eventBreakdown[ev] || 0) + 1;
    });

    // Aggregate by referrer
    const referrerBreakdown: Record<string, number> = {};
    (rawViews || []).forEach((v: any) => {
      const ref = v.referrer || 'Direct';
      referrerBreakdown[ref] = (referrerBreakdown[ref] || 0) + 1;
    });

    const topReferrers = Object.entries(referrerBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([referrer, count]) => ({ referrer, count }));

    // UTM source breakdown
    const utmBreakdown: Record<string, number> = {};
    (rawViews || []).filter((v: any) => v.utm_source).forEach((v: any) => {
      utmBreakdown[v.utm_source] = (utmBreakdown[v.utm_source] || 0) + 1;
    });

    // Summary stats
    const totalViews = (rawViews || []).length;
    const totalSignups = (rawSignups || []).length;
    const totalPageViews = (rawViews || []).filter((v: any) => v.event === 'page_view').length;
    const landingViews = (rawViews || []).filter((v: any) => v.page === '/').length;
    const signupPageViews = (rawViews || []).filter((v: any) => v.page === '/signup' || v.event === 'signup_start').length;
    const conversionRate = landingViews > 0 ? ((totalSignups / landingViews) * 100).toFixed(2) : '0';

    const activeSubscriptions = (orgs || []).filter((o: any) => o.subscription_status === 'active').length;
    const totalOrgs = (orgs || []).length;

    return NextResponse.json({
      summary: {
        total_views: totalViews,
        total_page_views: totalPageViews,
        landing_page_views: landingViews,
        signup_page_views: signupPageViews,
        total_signups: totalSignups,
        conversion_rate: parseFloat(conversionRate),
        active_subscriptions: activeSubscriptions,
        total_organizations: totalOrgs,
      },
      daily: dailyData,
      top_pages: topPages,
      top_referrers: topReferrers,
      events: eventBreakdown,
      utm_sources: utmBreakdown,
      period_days: days,
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
