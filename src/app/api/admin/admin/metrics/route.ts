/**
 * Admin Metrics Endpoint
 * GET /api/admin/metrics
 * Returns platform metrics and trending data
 */

import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';

async function verifyAdminAccess(supabase: any, userId: string): Promise<boolean> {
  try {
    // Use the is_platform_admin() RPC function (SECURITY DEFINER, bypasses RLS)
    const { data, error } = await supabase.rpc('is_platform_admin');
    if (error) {
      console.error('is_platform_admin RPC error:', error);
      return false;
    }
    return data === true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin access
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await verifyAdminAccess(supabase, user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get total organizations
    const { count: totalOrgs } = await (supabase as any)
      .from('organizations')
      .select('id', { count: 'exact', head: true });

    // Get active subscriptions
    const { count: activeSubs } = await (supabase as any)
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .in('subscription_status', ['active', 'trialing']);

    // Calculate MRR (sum of subscription values based on plan)
    const { data: orgsByPlan } = await (supabase as any)
      .from('organizations')
      .select('plan, subscription_status')
      .in('subscription_status', ['active', 'trialing']);

    const planPricing: Record<string, number> = {
      basic: 299,
      pro: 499,
      enterprise: 699,
    };

    const mrr = (orgsByPlan || []).reduce((total: number, org: any) => {
      return total + (planPricing[org.plan] || 0);
    }, 0);

    // Get unresolved errors count
    const { count: unresolvedErrors } = await (supabase as any)
      .from('error_logs')
      .select('id', { count: 'exact', head: true })
      .eq('resolved', false);

    // Get today's syncs and failures
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDayISO = startOfDay.toISOString();

    const { data: todaysSyncJobs } = await (supabase as any)
      .from('sync_jobs')
      .select('status')
      .gte('created_at', startOfDayISO);

    const syncCount = todaysSyncJobs?.length || 0;
    const failureCount = (todaysSyncJobs || []).filter(
      (job: any) => job.status === 'failed' || job.status === 'error'
    ).length;

    // Get last 30 days of platform metrics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    const { data: historicalMetrics } = await (supabase as any)
      .from('platform_metrics')
      .select('*')
      .gte('metric_date', thirtyDaysAgoISO)
      .order('metric_date', { ascending: false });

    return NextResponse.json({
      current_stats: {
        total_organizations: totalOrgs || 0,
        active_subscriptions: activeSubs || 0,
        mrr: Math.round(mrr * 100) / 100,
        total_errors_unresolved: unresolvedErrors || 0,
        syncs_today: syncCount,
        failures_today: failureCount,
        timestamp: new Date().toISOString(),
      },
      historical_metrics: historicalMetrics || [],
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
