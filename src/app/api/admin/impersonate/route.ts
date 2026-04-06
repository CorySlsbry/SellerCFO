/**
 * Admin Impersonate Endpoint
 * GET /api/admin/impersonate?org_id=xxx
 * Returns full dashboard data for an organization and logs the action
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

    // Get org_id from query parameters
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org_id');

    if (!orgId) {
      return NextResponse.json(
        { error: 'Missing required parameter: org_id' },
        { status: 400 }
      );
    }

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

    // Get all integration connections
    const { data: integrations } = await (supabase as any)
      .from('integration_connections')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    // Get all normalized projects
    const { data: projects } = await (supabase as any)
      .from('normalized_projects')
      .select('*')
      .eq('organization_id', orgId)
      .order('last_synced', { ascending: false });

    // Get all normalized contacts
    const { data: contacts } = await (supabase as any)
      .from('normalized_contacts')
      .select('*')
      .eq('organization_id', orgId)
      .order('last_synced', { ascending: false });

    // Get all normalized deals
    const { data: deals } = await (supabase as any)
      .from('normalized_deals')
      .select('*')
      .eq('organization_id', orgId)
      .order('last_synced', { ascending: false });

    // Get recent sync jobs
    const { data: syncJobs } = await (supabase as any)
      .from('sync_jobs')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(20);

    // Check QBO connection status
    const qboConnected =
      !!organization.qbo_realm_id &&
      !!organization.qbo_access_token &&
      (!organization.qbo_token_expires_at ||
        new Date(organization.qbo_token_expires_at) > new Date());

    // Log this impersonation action
    const { error: auditError } = await (supabase as any)
      .from('admin_audit_log')
      .insert({
        admin_id: user.id,
        action: 'impersonate',
        target_organization_id: orgId,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        details: {
          user_agent: request.headers.get('user-agent') || 'unknown',
        },
      });

    if (auditError) {
      console.error('Failed to log impersonate action:', auditError);
      // Don't fail the request if audit logging fails, just log the error
    }

    // Strip sensitive fields from organization before returning
    const {
      qbo_access_token,
      qbo_refresh_token,
      ...safeOrganization
    } = organization;

    return NextResponse.json({
      organization: safeOrganization,
      integrations: integrations || [],
      normalized_projects: projects || [],
      normalized_contacts: contacts || [],
      normalized_deals: deals || [],
      recent_sync_jobs: syncJobs || [],
      qbo_connection_status: {
        connected: qboConnected,
        realm_id: qboConnected ? organization.qbo_realm_id : null,
        expires_at: qboConnected ? organization.qbo_token_expires_at : null,
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
