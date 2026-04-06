/**
 * Generic Integration Connect Endpoint
 * GET /api/integrations/connect?provider=nextgen
 * Initiates OAuth flow for any supported provider
 */

import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { getAuthUrl } from '@/lib/integrations';
import type { IntegrationProvider } from '@/types/integrations';
import crypto from 'crypto';

const OAUTH_PROVIDERS: IntegrationProvider[] = ['nextgen', 'salesforce', 'hubspot'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') as IntegrationProvider;

    // QuickBooks has its own dedicated OAuth flow at /api/qbo/connect
    if (provider === 'quickbooks') {
      return NextResponse.redirect(new URL('/api/qbo/connect', request.url));
    }

    if (!provider || !OAUTH_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        { error: `Invalid or non-OAuth provider: ${provider}` },
        { status: 400 }
      );
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

    // Generate state with provider and org info encoded
    const statePayload = JSON.stringify({
      provider,
      orgId: profile.organization_id,
      nonce: crypto.randomBytes(16).toString('hex'),
    });
    const state = Buffer.from(statePayload).toString('base64url');

    // Get the OAuth URL for this provider
    const authUrl = getAuthUrl(provider, state, profile.organization_id);

    // Store state in cookie
    const response = NextResponse.redirect(authUrl);
    response.cookies.set(`integration_oauth_state`, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
    });

    return response;
  } catch (error) {
    console.error('Integration Connect Error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate connection' },
      { status: 500 }
    );
  }
}
