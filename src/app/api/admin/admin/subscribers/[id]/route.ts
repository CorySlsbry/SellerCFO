/**
 * Admin Subscriber Details Endpoint
 * GET /api/admin/subscribers/[id]
 * Returns detailed info for a single organization
 */

import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const orgId = params.id;

    // Get organization details
    const { data: organization, error: orgError } = await (supabase as any)
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get all users in organization
    const { data: profiles } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    // Get all integration connections
    const { data: integrations } = await (supabase as any)
      .from('integration_connections')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    // Get recent error logs (last 50, unresolved first)
    const { data: errorLogs } = await (supabase as any)
      .from('error_logs')
      .select('*')
      .eq('organization_id', orgId)
      .order('resolved', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(50);

    // Get recent sync jobs (last 20)
    const { data: syncJobs } = await (supabase as any)
      .from('sync_jobs')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(20);

    // Get counts of normalized data
    const { count: projectCount } = await (supabase as any)
      .from('normalized_projects')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId);

    const { count: contactCount } = await (supabase as any)
      .from('normalized_contacts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId);

    const { count: dealCount } = await (supabase as any)
      .from('normalized_deals')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId);

    return NextResponse.json({
      organization,
      profiles: profiles || [],
      integrations: integrations || [],
      error_logs: errorLogs || [],
      sync_jobs: syncJobs || [],
      stats: {
        normalized_projects_count: projectCount || 0,
        normalized_contacts_count: contactCount || 0,
        normalized_deals_count: dealCount || 0,
      },
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
