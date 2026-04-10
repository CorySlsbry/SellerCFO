/**
 * API Key Integration Setup Endpoint
 * POST /api/integrations/setup
 *
 * For providers that don't use a standard OAuth redirect flow:
 *   - woocommerce: per-store consumer key/secret + store URL
 *   - walmart:     BYO (per-seller) client_id + client_secret generated in
 *                  Walmart Seller Center. No platform-level env vars.
 */

import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { getConnector, validateConnection } from '@/lib/integrations';
import type { IntegrationProvider, IntegrationConnection } from '@/types/integrations';
import { walmartConnector } from '@/lib/integrations/walmart';

const API_KEY_PROVIDERS: IntegrationProvider[] = ['woocommerce', 'walmart'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      provider,
      api_key,
      tenant_id,
      account_name,
      // Walmart BYO fields
      client_id,
      client_secret,
      seller_id,
    } = body as {
      provider: IntegrationProvider;
      api_key?: string;
      tenant_id?: string;
      account_name?: string;
      client_id?: string;
      client_secret?: string;
      seller_id?: string;
    };

    if (!provider || !API_KEY_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        { error: `Invalid provider for API key setup: ${provider}` },
        { status: 400 }
      );
    }

    // Walmart needs client_id + client_secret. Other API-key providers need api_key.
    if (provider === 'walmart') {
      if (!client_id || !client_secret) {
        return NextResponse.json(
          { error: 'Walmart requires client_id and client_secret from your Seller Center.' },
          { status: 400 }
        );
      }
    } else if (!api_key) {
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

    // Build a temporary connection for validation. For walmart, the BYO
    // credentials live in `config` (not api_key) and we mint a fresh access
    // token immediately using the user-supplied client_id/secret.
    const tempConfig: Record<string, any> =
      provider === 'walmart'
        ? { client_id, client_secret, seller_id: seller_id || null }
        : { tenant_id, store_url: tenant_id };

    const tempConnection: IntegrationConnection = {
      id: 'temp',
      organization_id: profile.organization_id,
      provider,
      status: 'pending',
      access_token: null,
      refresh_token: null,
      token_expires_at: null,
      api_key: provider === 'walmart' ? null : (api_key || null),
      external_account_id: provider === 'walmart' ? (seller_id || null) : (tenant_id || null),
      external_account_name: account_name || null,
      config: tempConfig,
      last_sync_at: null,
      last_sync_status: 'idle',
      last_sync_error: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // For Walmart, mint the access token up front using BYO creds
    if (provider === 'walmart') {
      try {
        const tokenResult = await walmartConnector.getAccessToken(client_id!, client_secret!);
        tempConnection.access_token = tokenResult.access_token;
        tempConnection.token_expires_at = new Date(
          Date.now() + (tokenResult.expires_in || 900) * 1000
        ).toISOString();
      } catch (error) {
        console.error('Walmart token exchange failed:', error);
        return NextResponse.json(
          { error: 'Failed to authenticate with Walmart. Check your Client ID and Client Secret.' },
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

    // Persist
    const upsertPayload: Record<string, any> = {
      organization_id: profile.organization_id,
      provider,
      status: 'connected',
      access_token: tempConnection.access_token,
      refresh_token: null,
      token_expires_at: tempConnection.token_expires_at,
      api_key: tempConnection.api_key,
      external_account_id: tempConnection.external_account_id,
      external_account_name: tempConnection.external_account_name,
      config: tempConfig,
      last_sync_status: 'idle',
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await (supabase as any)
      .from('integration_connections')
      .upsert(upsertPayload, { onConflict: 'organization_id,provider' });

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
