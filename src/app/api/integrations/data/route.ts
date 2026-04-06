/**
 * Integrated Data Endpoint
 * GET /api/integrations/data
 * Returns all normalized data from connected integrations for the dashboard
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

    const orgId = profile.organization_id;
    const locationId = request.nextUrl.searchParams.get('locationId');

    // Build per-table queries, optionally scoped to a location
    let projectsQuery = (supabase as any).from('normalized_projects').select('*').eq('organization_id', orgId).order('name');
    let contactsQuery = (supabase as any).from('normalized_contacts').select('*').eq('organization_id', orgId).order('last_name');
    let dealsQuery    = (supabase as any).from('normalized_deals').select('*').eq('organization_id', orgId).order('amount', { ascending: false });

    if (locationId) {
      projectsQuery = projectsQuery.eq('location_id', locationId);
      contactsQuery = contactsQuery.eq('location_id', locationId);
      dealsQuery    = dealsQuery.eq('location_id', locationId);
    }

    // Fetch all normalized data in parallel
    const [
      { data: projects },
      { data: contacts },
      { data: deals },
      { data: connections },
    ] = await Promise.all([
      projectsQuery,
      contactsQuery,
      dealsQuery,
      (supabase as any).from('integration_connections').select('provider, status, last_sync_at').eq('organization_id', orgId).eq('status', 'connected'),
    ]);

    // Calculate aggregate metrics
    const totalContractValue = (projects || []).reduce((sum: number, p: any) => sum + (p.contract_amount || 0), 0);
    const totalActualCost = (projects || []).reduce((sum: number, p: any) => sum + (p.actual_cost || 0), 0);
    const totalAR = (projects || []).reduce((sum: number, p: any) => sum + Math.max(0, (p.billings_to_date || 0) - (p.actual_cost || 0)), 0);
    const totalRetainageReceivable = (projects || []).reduce((sum: number, p: any) => sum + (p.retainage_receivable || 0), 0);
    const totalRetainagePayable = (projects || []).reduce((sum: number, p: any) => sum + (p.retainage_payable || 0), 0);
    const totalPipeline = (deals || []).reduce((sum: number, d: any) => sum + (d.amount || 0), 0);
    const totalWeightedPipeline = (deals || []).reduce((sum: number, d: any) => sum + (d.weighted_amount || 0), 0);

    // Group data by source
    const projectsBySource: Record<string, any[]> = {};
    for (const p of (projects || [])) {
      if (!projectsBySource[p.source]) projectsBySource[p.source] = [];
      projectsBySource[p.source].push(p);
    }

    const dealsByStage: Record<string, { count: number; amount: number }> = {};
    for (const d of (deals || [])) {
      const stage = d.stage || 'Unknown';
      if (!dealsByStage[stage]) dealsByStage[stage] = { count: 0, amount: 0 };
      dealsByStage[stage].count++;
      dealsByStage[stage].amount += d.amount || 0;
    }

    return NextResponse.json({
      projects: projects || [],
      contacts: contacts || [],
      deals: deals || [],
      connectedSources: (connections || []).map((c: any) => c.provider),
      metrics: {
        totalContractValue,
        totalActualCost,
        totalAR,
        totalRetainageReceivable,
        totalRetainagePayable,
        totalPipeline,
        totalWeightedPipeline,
        projectCount: (projects || []).length,
        contactCount: (contacts || []).length,
        dealCount: (deals || []).length,
        activeProjectCount: (projects || []).filter((p: any) => p.status === 'active').length,
      },
      projectsBySource,
      dealsByStage,
    });
  } catch (error) {
    console.error('Integration Data Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
