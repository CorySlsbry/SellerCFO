/**
 * Admin Subscribers Endpoint
 * GET /api/admin/subscribers
 * Returns all organizations with their subscription info and stats
 */

import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface SubscriberRow {
  id: string;
  name: string;
  slug: string;
  plan: 'basic' | 'pro' | 'enterprise';
  subscription_status: 'trialing' | 'active' | 'past_due' | 'canceled';
  stripe_customer_id: string | null;
  created_at: string;
  user_count: number;
  integration_count: number;
  unresolved_error_count: number;
  last_sync: string | null;
}

async function verifyAdminAccess(supabase: any, userId: string): Promise<boolean> {
  try {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const plan = searchParams.get('plan');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'created_at';
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc';

    // Use admin client to bypass RLS and see ALL organizations
    const adminSupabase = createAdminClient();

    // Build base query
    let query = (adminSupabase as any)
      .from('organizations')
      .select(
        `
        id,
        name,
        slug,
        plan,
        subscription_status,
        stripe_customer_id,
        created_at
      `
      );

    // Apply filters
    if (status) {
      query = query.eq('subscription_status', status);
    }
    if (plan) {
      query = query.eq('plan', plan);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    // Order and execute
    const { data: organizations, error } = await query.order(sort, {
      ascending: order === 'asc',
    });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscribers' },
        { status: 500 }
      );
    }

    // Get aggregated data for each organization
    const subscribers: SubscriberRow[] = await Promise.all(
      (organizations || []).map(async (org: any) => {
        // Count users (use admin client to see all profiles)
        const { count: userCount } = await (adminSupabase as any)
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', org.id);

        // Get integrations and last sync
        const { data: integrations } = await (adminSupabase as any)
          .from('integration_connections')
          .select('last_sync_at')
          .eq('organization_id', org.id);

        const lastSync =
          integrations && integrations.length > 0
            ? integrations.reduce((latest: string | null, ic: any) => {
                if (!ic.last_sync_at) return latest;
                if (!latest) return ic.last_sync_at;
                return new Date(ic.last_sync_at) > new Date(latest)
                  ? ic.last_sync_at
                  : latest;
              }, null)
            : null;

        // Count unresolved errors
        const { count: errorCount } = await (adminSupabase as any)
          .from('error_logs')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .eq('resolved', false);

        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          plan: org.plan,
          subscription_status: org.subscription_status,
          stripe_customer_id: org.stripe_customer_id,
          created_at: org.created_at,
          user_count: userCount || 0,
          integration_count: integrations?.length || 0,
          unresolved_error_count: errorCount || 0,
          last_sync: lastSync,
        };
      })
    );

    return NextResponse.json({ subscribers });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
