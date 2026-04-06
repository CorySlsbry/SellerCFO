/**
 * Generic Integration OAuth Callback
 * GET /api/integrations/callback?code=xxx&state=xxx
 * Handles OAuth callbacks for all providers
 */

import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { exchangeCode } from '@/lib/integrations';
import { logError, logSuccess } from '@/lib/error-logger';
import type { IntegrationProvider } from '@/types/integrations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing required OAuth parameters' },
        { status: 400 }
      );
    }

    // Verify state
    const storedState = request.cookies.get('integration_oauth_state')?.value;
    if (!storedState || storedState !== state) {
      return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
    }

    // Decode state to get provider and org info
    let stateData: { provider: IntegrationProvider; orgId: string };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    } catch {
      return NextResponse.json({ error: 'Invalid state encoding' }, { status: 400 });
    }

    const { provider, orgId } = stateData;

    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Exchange code for tokens
    const tokenResult = await exchangeCode(provider, code, {
      // Pass any extra params from the callback
      realmId: searchParams.get('realmId') || '',
      instance_url: searchParams.get('instance_url') || '',
    });

    const expiresAt = tokenResult.expires_in
      ? new Date(Date.now() + tokenResult.expires_in * 1000).toISOString()
      : null;

    // Upsert integration connection record
    const { error: upsertError } = await (supabase as any)
      .from('integration_connections')
      .upsert({
        organization_id: orgId,
        provider,
        status: 'connected',
        access_token: tokenResult.access_token,
        refresh_token: tokenResult.refresh_token || null,
        token_expires_at: expiresAt,
        external_account_id: tokenResult.extra?.instance_url || tokenResult.extra?.company_id || null,
        config: {
          instance_url: tokenResult.extra?.instance_url,
          scope: tokenResult.scope,
          ...tokenResult.extra,
        },
        last_sync_status: 'idle',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'organization_id,provider',
      });

    if (upsertError) {
      console.error('Failed to store integration:', upsertError);
      await logError({
        organizationId: orgId,
        errorType: 'oauth_callback',
        severity: 'error',
        title: `Failed to store ${provider} connection`,
        message: upsertError.message,
        provider,
      });
      return NextResponse.json(
        { error: 'Failed to store connection' },
        { status: 500 }
      );
    }

    await logSuccess({
      organizationId: orgId,
      errorType: 'oauth_callback',
      title: `${provider} connected successfully`,
      provider,
    });

    // Redirect to integrations page with success
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?connected=${provider}`
    );
    response.cookies.delete('integration_oauth_state');
    return response;

  } catch (error) {
    console.error('Integration Callback Error:', error);
    await logError({
      errorType: 'oauth_callback',
      severity: 'error',
      title: 'Integration OAuth callback failed',
      message: error instanceof Error ? error.message : String(error),
    });
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=connection_failed`
    );
    response.cookies.delete('integration_oauth_state');
    return response;
  }
}
