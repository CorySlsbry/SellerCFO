/**
 * Integration Status Endpoint
 * GET /api/integrations/status
 * Returns all integration connections and their status for the current org
 */

import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single() as any;

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
    }

    // Get all integration connections for this org
    const { data: connections, error } = await (supabase as any)
      .from('integration_connections')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
    }

    // Get recent sync jobs
    const { data: syncJobs } = await (supabase as any)
      .from('sync_jobs')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Get counts of synced data
    const { count: projectCount } = await (supabase as any)
      .from('normalized_projects')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id);

    const { count: contactCount } = await (supabase as any)
      .from('normalized_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id);

    const { count: dealCount } = await (supabase as any)
      .from('normalized_deals')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id);

    return NextResponse.json({
      connections: connections || [],
      recentSyncs: syncJobs || [],
      dataCounts: {
        projects: projectCount || 0,
        contacts: contactCount || 0,
        deals: dealCount || 0,
      },
    });
  } catch (error) {
    console.error('Integration Status Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/integrations/status
 * Disconnect an integration
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single() as any;

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
    }

    // Update status to disconnected and clear credentials
    const { error } = await (supabase as any)
      .from('integration_connections')
      .update({
        status: 'disconnected',
        access_token: null,
        refresh_token: null,
        api_key: null,
        token_expires_at: null,
        last_sync_status: 'idle',
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', profile.organization_id)
      .eq('provider', provider);

    if (error) {
      return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `${provider} disconnected successfully`,
    });
  } catch (error) {
    console.error('Integration Disconnect Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
