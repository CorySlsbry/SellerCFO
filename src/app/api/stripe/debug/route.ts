/**
 * GET /api/stripe/debug?key=salisbury
 *
 * Diagnostic endpoint for Stripe integration.
 * Checks env vars, tests Stripe connection, and queries recent signups.
 * Protected by ?key=salisbury query param.
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('key') !== 'salisbury') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  // ── 1. Check all Stripe env vars ──────────────────────────
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripePriceEssential = process.env.STRIPE_PRICE_ID_ESSENTIAL;
  const stripePricePro = process.env.STRIPE_PRICE_ID_PRO;
  const stripePriceEnterprise = process.env.STRIPE_PRICE_ID_ENTERPRISE;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  results.envVars = {
    STRIPE_SECRET_KEY: stripeSecretKey ? `${stripeSecretKey.substring(0, 7)}...${stripeSecretKey.substring(stripeSecretKey.length - 4)}` : 'MISSING',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: stripePublishableKey ? `${stripePublishableKey.substring(0, 7)}...${stripePublishableKey.substring(stripePublishableKey.length - 4)}` : 'MISSING',
    STRIPE_WEBHOOK_SECRET: stripeWebhookSecret ? `${stripeWebhookSecret.substring(0, 6)}...${stripeWebhookSecret.substring(stripeWebhookSecret.length - 4)}` : 'MISSING',
    STRIPE_PRICE_ID_ESSENTIAL: stripePriceEssential || 'MISSING (fallback: amount-based matching)',
    STRIPE_PRICE_ID_PRO: stripePricePro || 'MISSING (fallback: amount-based matching)',
    STRIPE_PRICE_ID_ENTERPRISE: stripePriceEnterprise || 'MISSING (fallback: amount-based matching)',
    NEXT_PUBLIC_APP_URL: appUrl || 'MISSING',
  };

  // Flag critical issues
  const criticalIssues: string[] = [];
  if (!stripeSecretKey) criticalIssues.push('STRIPE_SECRET_KEY is missing — Stripe API calls will fail');
  if (!stripePublishableKey) criticalIssues.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing — frontend cannot initialize Stripe');
  if (!stripeWebhookSecret) criticalIssues.push('STRIPE_WEBHOOK_SECRET is missing — webhook signature verification will fail (using empty string fallback)');
  if (!appUrl) criticalIssues.push('NEXT_PUBLIC_APP_URL is missing — checkout success/cancel URLs will be undefined');
  if (appUrl && appUrl.includes('toolkit.salisburybookkeeping.com')) {
    criticalIssues.push(`NEXT_PUBLIC_APP_URL points to toolkit.salisburybookkeeping.com (no DNS) — should be https://topmedicalcfo.com`);
  }

  results.criticalIssues = criticalIssues.length > 0 ? criticalIssues : 'None — all critical vars are set';

  // ── 2. Test Stripe API connection ─────────────────────────
  if (stripeSecretKey) {
    try {
      const res = await fetch('https://api.stripe.com/v1/customers?limit=1', {
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
        },
      });
      const data = await res.json();
      results.stripeApiTest = {
        status: res.status,
        connected: res.ok,
        hasCustomers: data.data?.length > 0,
        error: data.error?.message || null,
      };
    } catch (err: any) {
      results.stripeApiTest = {
        connected: false,
        error: err.message,
      };
    }

    // Check recent checkout sessions (last 7 days)
    try {
      const sevenDaysAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
      const res = await fetch(`https://api.stripe.com/v1/checkout/sessions?limit=10&created[gte]=${sevenDaysAgo}`, {
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
        },
      });
      const data = await res.json();
      results.recentCheckoutSessions = {
        count: data.data?.length || 0,
        sessions: (data.data || []).map((s: any) => ({
          id: s.id,
          status: s.status,
          customer_email: s.customer_details?.email || s.customer_email || null,
          payment_status: s.payment_status,
          created: new Date(s.created * 1000).toISOString(),
          metadata: s.metadata,
          subscription: s.subscription,
        })),
      };
    } catch (err: any) {
      results.recentCheckoutSessions = { error: err.message };
    }

    // Check recent subscriptions
    try {
      const sevenDaysAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
      const res = await fetch(`https://api.stripe.com/v1/subscriptions?limit=10&created[gte]=${sevenDaysAgo}`, {
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
        },
      });
      const data = await res.json();
      results.recentSubscriptions = {
        count: data.data?.length || 0,
        subscriptions: (data.data || []).map((s: any) => ({
          id: s.id,
          status: s.status,
          customer: s.customer,
          created: new Date(s.created * 1000).toISOString(),
          trial_end: s.trial_end ? new Date(s.trial_end * 1000).toISOString() : null,
          metadata: s.metadata,
          plan_amount: s.items?.data?.[0]?.price?.unit_amount,
          plan_interval: s.items?.data?.[0]?.price?.recurring?.interval,
        })),
      };
    } catch (err: any) {
      results.recentSubscriptions = { error: err.message };
    }

    // Check recent webhook events
    try {
      const threeDaysAgo = Math.floor((Date.now() - 3 * 24 * 60 * 60 * 1000) / 1000);
      const res = await fetch(`https://api.stripe.com/v1/events?limit=20&created[gte]=${threeDaysAgo}`, {
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
        },
      });
      const data = await res.json();
      results.recentEvents = {
        count: data.data?.length || 0,
        events: (data.data || []).map((e: any) => ({
          id: e.id,
          type: e.type,
          created: new Date(e.created * 1000).toISOString(),
        })),
      };
    } catch (err: any) {
      results.recentEvents = { error: err.message };
    }

    // Check webhook endpoints configured in Stripe
    try {
      const res = await fetch('https://api.stripe.com/v1/webhook_endpoints?limit=10', {
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
        },
      });
      const data = await res.json();
      results.webhookEndpoints = {
        count: data.data?.length || 0,
        endpoints: (data.data || []).map((ep: any) => ({
          id: ep.id,
          url: ep.url,
          status: ep.status,
          enabled_events: ep.enabled_events,
          created: new Date(ep.created * 1000).toISOString(),
        })),
      };
    } catch (err: any) {
      results.webhookEndpoints = { error: err.message };
    }
  } else {
    results.stripeApiTest = { skipped: true, reason: 'No STRIPE_SECRET_KEY' };
  }

  // ── 3. Check Supabase for recent signups ──────────────────
  try {
    const supabase = createAdminClient();

    // Get organizations created since March 28, 2026
    const { data: recentOrgs, error: orgsError } = await (supabase
      .from('organizations') as any)
      .select('id, name, slug, subscription_status, plan, stripe_customer_id, stripe_subscription_id, created_at, updated_at')
      .gte('created_at', '2026-03-28T00:00:00Z')
      .order('created_at', { ascending: false })
      .limit(20);

    results.recentOrganizations = {
      sinceMarch28: recentOrgs?.length || 0,
      error: orgsError?.message || null,
      orgs: recentOrgs || [],
    };

    // Get profiles (users) created since March 28
    const { data: recentProfiles, error: profilesError } = await (supabase
      .from('profiles') as any)
      .select('id, email, full_name, organization_id, role, created_at')
      .gte('created_at', '2026-03-28T00:00:00Z')
      .order('created_at', { ascending: false })
      .limit(20);

    results.recentProfiles = {
      sinceMarch28: recentProfiles?.length || 0,
      error: profilesError?.message || null,
      profiles: recentProfiles || [],
    };

    // Get ALL organizations to check overall state
    const { data: allOrgs, error: allOrgsError } = await (supabase
      .from('organizations') as any)
      .select('id, name, subscription_status, plan, stripe_customer_id, stripe_subscription_id, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    results.allOrganizations = {
      total: allOrgs?.length || 0,
      error: allOrgsError?.message || null,
      orgs: allOrgs || [],
    };

  } catch (err: any) {
    results.supabase = {
      error: err.message,
      hint: 'Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
    };
  }

  return NextResponse.json(results, { status: 200 });
}
