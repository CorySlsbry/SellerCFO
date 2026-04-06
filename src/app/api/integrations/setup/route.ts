/**
 * API Key Integration Setup Endpoint
 * POST /api/integrations/setup
 * For providers that use API key auth (athenahealth, Kareo, Open Dental)
 */

import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { getConnector, validateConnection } from '@/lib/integrations';
import type { IntegrationProvider, IntegrationConnection } from '@/types/integrations';

const API_KEY_PROVIDERS: IntegrationProvider[] = ['athenahealth', 'kareo', 'opendental'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, api_key, tenant_id, account_name } = body as {
      provider: IntegrationProvider;
      api_key: string;
      tenant_id?: string;
      account_name?: string;
    };

    if (!provider || !API_KEY_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        { error: `Invalid provider for API key setup: ${provider}` },
        { status: 400 }
      );
    }

    if (!api_key) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

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

    // Create a temporary connection to validate
    const tempConnection: IntegrationConnection = {
      id: 'temp',
      organization_id: profile.organization_id,
      provider,
      status: 'pending',
      access_token: provider === 'opendental' ? null : null,
      refresh_token: null,
      token_expires_at: null,
      api_key,
      external_account_id: tenant_id || null,
      external_account_name: account_name || null,
      config: { tenant_id },
      last_sync_at: null,
      last_sync_status: 'idle',
      last_sync_error: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // For Open Dental, we need to get an access token using client credentials
    if (provider === 'opendental') {
      try {
        const connector = getConnector(provider);
        const tokenResult = await connector.getAccessToken();
        tempConnection.access_token = tokenResult.access_token;
        tempConnection.token_expires_at = new Date(
          Date.now() + (tokenResult.expires_in || 900) * 1000
        ).toISOString();
      } catch (error) {
        return NextResponse.json(
          { error: 'Failed to authenticate with Open Dental. Check your client credentials.' },
          { status: 400 }
        );
      }
    }

    // Validate the connection
    const isValid = await validateConnection(provider, tempConnection);
    if (!isValid) {
      return NextResponse.json(
        { error: `Could not validate ${provider} connection. Please check your credentials.` },
        { status: 400 }
      );
    }

    // Store the validated connection
    const { error: upsertError } = await (supabase as any)
      .from('integration_connections')
      .upsert({
        organization_id: profile.organization_id,
        provider,
        status: 'connected',
        access_token: tempConnection.access_token,
        refresh_token: null,
        token_expires_at: tempConnection.token_expires_at,
        api_key,
        external_account_id: tenant_id || null,
        external_account_name: account_name || null,
        config: { tenant_id },
        last_sync_status: 'idle',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'organization_id,provider',
      });

    if (upsertError) {
      console.error('Failed to store integration:', upsertError);
      return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `${provider} connected successfully`,
    });

  } catch (error) {
    console.error('Integration Setup Error:', error);
    return NextResponse.json(
      { error: 'Failed to set up integration' },
      { status: 500 }
    );
  }
}
