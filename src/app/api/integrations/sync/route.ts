/**
 * Integration Sync Endpoint
 * POST /api/integrations/sync
 * Triggers a data sync for one or all connected integrations
 *
 * Body: { provider?: "nextgen" | "all" }
 */

import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { syncIntegration, syncAllIntegrations, refreshToken, getConnector } from '@/lib/integrations';
import { logError, logSuccess } from '@/lib/error-logger';
import type { IntegrationProvider, IntegrationConnection } from '@/types/integrations';
import {
  syncDiscoveredLocations,
  extractCityStateLocations,
  type LocationSource,
} from '@/lib/location-sync';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider } = body as { provider?: IntegrationProvider | 'all' };

    // Auth check
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

    // Fetch connected integrations
    let query = (supabase as any)
      .from('integration_connections')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .eq('status', 'connected');

    if (provider && provider !== 'all') {
      query = query.eq('provider', provider);
    }

    const { data: connections, error: connError } = await query;

    if (connError || !connections?.length) {
      return NextResponse.json(
        { error: 'No connected integrations found' },
        { status: 404 }
      );
    }

    // Refresh tokens if needed before syncing
    const refreshedConnections: IntegrationConnection[] = [];
    for (const conn of connections) {
      let refreshedConn = conn;

      // Check if OAuth token needs refresh
      if (conn.refresh_token && conn.token_expires_at) {
        const expiresAt = new Date(conn.token_expires_at).getTime();
        const buffer = 5 * 60 * 1000; // 5 min buffer

        if (Date.now() >= expiresAt - buffer) {
          try {
            const newTokens = await refreshToken(conn.provider, conn.refresh_token);

            // Update stored tokens
            await (supabase as any)
              .from('integration_connections')
              .update({
                access_token: newTokens.access_token,
                refresh_token: newTokens.refresh_token || conn.refresh_token,
                token_expires_at: newTokens.expires_in
                  ? new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
                  : conn.token_expires_at,
                updated_at: new Date().toISOString(),
              })
              .eq('id', conn.id);

            refreshedConn = {
              ...conn,
              access_token: newTokens.access_token,
              refresh_token: newTokens.refresh_token || conn.refresh_token,
            };
          } catch (error) {
            console.error(`Token refresh failed for ${conn.provider}:`, error);
            await logError({
              organizationId: profile.organization_id,
              errorType: 'token_refresh',
              severity: 'error',
              title: `Token refresh failed for ${conn.provider}`,
              message: error instanceof Error ? error.message : String(error),
              provider: conn.provider,
              metadata: { connectionId: conn.id },
            });
            // Mark as error
            await (supabase as any)
              .from('integration_connections')
              .update({
                status: 'error',
                last_sync_error: 'Token refresh failed',
                updated_at: new Date().toISOString(),
              })
              .eq('id', conn.id);
            continue;
          }
        }
      }

      // For Open Dental (client credentials), get a fresh token each sync
      if (conn.provider === 'opendental') {
        try {
          const connector = getConnector('opendental');
          const tokenResult = await connector.getAccessToken();
          refreshedConn = {
            ...conn,
            access_token: tokenResult.access_token,
          };
        } catch (error) {
          console.error('Open Dental token fetch failed:', error);
          continue;
        }
      }

      refreshedConnections.push(refreshedConn);
    }

    // Mark integrations as syncing
    for (const conn of refreshedConnections) {
      await (supabase as any)
        .from('integration_connections')
        .update({ last_sync_status: 'syncing', updated_at: new Date().toISOString() })
        .eq('id', conn.id);
    }

    // Run syncs
    const results = await syncAllIntegrations(refreshedConnections);

    // Process results — store normalized data and update sync status
    for (const result of results) {
      const conn = refreshedConnections.find(c => c.provider === result.provider);
      if (!conn) continue;

      // Create sync job log
      await (supabase as any)
        .from('sync_jobs')
        .insert({
          organization_id: profile.organization_id,
          integration_id: conn.id,
          provider: result.provider,
          status: result.success ? 'completed' : 'failed',
          started_at: new Date(Date.now() - result.duration).toISOString(),
          completed_at: new Date().toISOString(),
          records_synced: result.recordsTotal,
          error_message: result.error || null,
          sync_type: 'full',
          metadata: {
            projects: result.projects.length,
            contacts: result.contacts.length,
            deals: result.deals.length,
            activities: result.activities.length,
          },
        });

      // location_id comes from the connection — null means org-wide (unscoped)
      const connLocationId: string | null = conn.location_id ?? null;

      // Upsert normalized projects
      for (const project of result.projects) {
        await (supabase as any)
          .from('normalized_projects')
          .upsert({
            organization_id: profile.organization_id,
            location_id: connLocationId,
            source: project.source,
            external_id: project.external_id,
            name: project.name,
            customer_name: project.customer_name,
            address: project.address,
            status: project.status,
            project_type: project.project_type,
            start_date: project.start_date,
            estimated_completion: project.estimated_completion,
            contract_amount: project.contract_amount,
            estimated_cost: project.estimated_cost,
            actual_cost: project.actual_cost,
            percent_complete: project.percent_complete,
            change_orders_amount: project.change_orders_amount,
            budget_remaining: project.budget_remaining,
            profit_margin: project.profit_margin,
            costs_to_date: project.costs_to_date,
            billings_to_date: project.billings_to_date,
            earned_revenue: project.earned_revenue,
            over_under_billing: project.over_under_billing,
            retainage_receivable: project.retainage_receivable,
            retainage_payable: project.retainage_payable,
            last_synced: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'organization_id,source,external_id',
          });
      }

      // Upsert normalized contacts
      for (const contact of result.contacts) {
        await (supabase as any)
          .from('normalized_contacts')
          .upsert({
            organization_id: profile.organization_id,
            location_id: connLocationId,
            source: contact.source,
            external_id: contact.external_id,
            first_name: contact.first_name,
            last_name: contact.last_name,
            email: contact.email,
            phone: contact.phone,
            company: contact.company,
            title: contact.title,
            contact_type: contact.type,
            tags: contact.tags,
            last_synced: new Date().toISOString(),
          }, {
            onConflict: 'organization_id,source,external_id',
          });
      }

      // Upsert normalized deals
      for (const deal of result.deals) {
        await (supabase as any)
          .from('normalized_deals')
          .upsert({
            organization_id: profile.organization_id,
            location_id: connLocationId,
            source: deal.source,
            external_id: deal.external_id,
            name: deal.name,
            contact_name: deal.contact_name,
            company_name: deal.company_name,
            amount: deal.amount,
            stage: deal.stage,
            probability: deal.probability,
            weighted_amount: deal.weighted_amount,
            expected_close_date: deal.expected_close_date,
            created_date: deal.created_date,
            last_activity_date: deal.last_activity_date,
            deal_type: deal.deal_type,
            source_campaign: deal.source_campaign,
            notes: deal.notes,
            last_synced: new Date().toISOString(),
          }, {
            onConflict: 'organization_id,source,external_id',
          });
      }

      // Update connection sync status
      await (supabase as any)
        .from('integration_connections')
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: result.success ? 'completed' : 'failed',
          last_sync_error: result.error || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conn.id);

      // Log to error_logs for admin visibility
      if (result.success) {
        await logSuccess({
          organizationId: profile.organization_id,
          errorType: 'integration_sync',
          title: `${result.provider} sync completed — ${result.recordsTotal} records`,
          provider: result.provider,
          metadata: { duration: result.duration, projects: result.projects.length, contacts: result.contacts.length, deals: result.deals.length },
        });
      } else {
        await logError({
          organizationId: profile.organization_id,
          errorType: 'integration_sync',
          severity: 'error',
          title: `${result.provider} sync failed`,
          message: result.error,
          provider: result.provider,
          metadata: { duration: result.duration },
        });
      }
    }

    // ── Auto-discover locations from synced data ──
    try {
      for (const result of results) {
        if (!result.success) continue;

        const source = result.provider as LocationSource;

        // Extract locations from project addresses (Shopify, Amazon)
        if (result.projects.length > 0 && (source === 'nextgen' || source === 'athenahealth')) {
          const projectRecords = result.projects.map((p: any) => {
            // Parse composite address "123 Main, Denver, CO, 80202" into parts
            const parts = (p.address || '').split(',').map((s: string) => s.trim());
            return {
              address: parts.length >= 1 ? parts[0] : undefined,
              city: parts.length >= 2 ? parts[parts.length - 3] || parts[1] : undefined,
              state: parts.length >= 3 ? parts[parts.length - 2] || parts[2] : undefined,
              zip: parts.length >= 4 ? parts[parts.length - 1] : undefined,
            };
          });
          const locations = extractCityStateLocations(source, projectRecords);
          if (locations.length > 0) {
            const locationMap = await syncDiscoveredLocations(supabase as any, profile.organization_id, locations);
            console.log(`[integration-sync] Discovered ${locations.length} locations from ${source} projects`);

            // Auto-tag projects with their discovered location_id
            for (const project of result.projects) {
              const parts = (project.address || '').split(',').map((s: string) => s.trim());
              const city = (parts.length >= 2 ? parts[parts.length - 3] || parts[1] : '') || '';
              const state = (parts.length >= 3 ? parts[parts.length - 2] || parts[2] : '') || '';
              const key = `${source}:${city.toLowerCase()}:${state.toLowerCase()}`;
              const locId = locationMap.get(key);
              if (locId) {
                await (supabase as any)
                  .from('normalized_projects')
                  .update({ location_id: locId })
                  .eq('organization_id', profile.organization_id)
                  .eq('source', project.source)
                  .eq('external_id', project.external_id);
              }
            }
          }
        }

        // Future: extract locations from e-commerce order shipping data
      }
    } catch (locErr: any) {
      // Non-fatal — don't block the sync response
      console.error('[integration-sync] Location discovery failed (non-fatal):', locErr?.message);
    }

    return NextResponse.json({
      success: true,
      results: results.map(r => ({
        provider: r.provider,
        success: r.success,
        recordsTotal: r.recordsTotal,
        duration: r.duration,
        error: r.error,
      })),
    });

  } catch (error) {
    console.error('Integration Sync Error:', error);
    return NextResponse.json(
      { error: 'Failed to sync integrations' },
      { status: 500 }
    );
  }
}
