/**
 * Get Current Subscription Info Endpoint
 * GET /api/stripe/subscription
 * Returns the current subscription details for the authenticated user's organization.
 * Auto-syncs plan from Stripe if a mismatch is detected (e.g. missing env vars during webhook).
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripeService } from "@/lib/stripe";
import { getPlanName, getPlanPrice } from "@/lib/plan-features";
import type { ApiResponse } from "@/types";

interface SubscriptionInfo {
  plan: 'basic' | 'pro' | 'enterprise';
  planName: string;
  price: number;
  status: string;
  includesAiToolkit: boolean;
  organizationName: string | null;
  userEmail: string | null;
  userFullName: string | null;
  trialEndsAt: string | null;
  trialDaysRemaining: number | null;
}

export async function GET(request: NextRequest) {
  try {
    // Ensure user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single() as any;

    if (profileError || !profile?.organization_id) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Organization not found" },
        { status: 400 }
      );
    }

    // Get organization with subscription details
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", (profile as any).organization_id)
      .single() as any;

    if (orgError || !org) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Organization not found" },
        { status: 400 }
      );
    }

    // Get user profile info (full_name)
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single() as any;

    let plan: 'basic' | 'pro' | 'enterprise' = (org as any).plan || 'basic';
    let status = (org as any).subscription_status || 'trialing';
    let trialEndsAt: string | null = null;

    // ────────────────────────────────────────────────────────────
    // AUTO-SYNC: Verify the DB plan matches Stripe.
    // Layer 1: Use stored stripe_subscription_id
    // Layer 2: Use stored stripe_customer_id to find subscription
    // Layer 3: Look up Stripe customer by user email
    // ────────────────────────────────────────────────────────────
    let stripeSubId = (org as any).stripe_subscription_id;
    let stripeCustomerId = (org as any).stripe_customer_id;

    // If we don't have a subscription ID, try to find one via customer
    if (!stripeSubId) {
      try {
        // Layer 2: lookup by stored customer ID
        if (stripeCustomerId) {
          console.log(`[subscription-sync] No sub ID, looking up by customer ${stripeCustomerId}`);
          const subs = await stripeService.getCustomerSubscriptions(stripeCustomerId);
          if (subs.length > 0) {
            stripeSubId = subs[0].id;
          }
        }

        // Layer 3: lookup by user email
        if (!stripeSubId && user.email) {
          console.log(`[subscription-sync] No sub ID or customer, looking up by email ${user.email}`);
          const customer = await stripeService.findCustomerByEmail(user.email);
          if (customer) {
            stripeCustomerId = customer.id;
            const subs = await stripeService.getCustomerSubscriptions(customer.id);
            if (subs.length > 0) {
              stripeSubId = subs[0].id;
            }
          }
        }
      } catch (lookupError) {
        console.error("[subscription-sync] Stripe lookup failed:", lookupError);
      }
    }

    if (stripeSubId) {
      try {
        const stripeSub = await stripeService.getSubscription(stripeSubId);
        const stripePlan = stripeService.getPlanFromSubscription(stripeSub);
        const stripeStatus = stripeService.mapSubscriptionStatus(stripeSub.status);

        // If Stripe says a different plan, trust Stripe and update the DB
        if (stripePlan !== plan || stripeStatus !== status || !(org as any).stripe_subscription_id) {
          console.log(`[subscription-sync] Mismatch detected for org ${(profile as any).organization_id}: DB=${plan}/${status} Stripe=${stripePlan}/${stripeStatus}. Syncing...`);
          plan = stripePlan;
          status = stripeStatus;

          // Update DB using admin client (no RLS restrictions)
          const adminSupabase = createAdminClient();
          const updatePayload: Record<string, any> = {
            plan: stripePlan,
            subscription_status: stripeStatus,
            stripe_subscription_id: stripeSubId,
            updated_at: new Date().toISOString(),
          };

          // Also backfill customer ID if we discovered it
          if (stripeCustomerId && !(org as any).stripe_customer_id) {
            updatePayload.stripe_customer_id = stripeCustomerId;
          }

          if (stripeSub.trial_end) {
            updatePayload.trial_ends_at = new Date(stripeSub.trial_end * 1000).toISOString();
            trialEndsAt = updatePayload.trial_ends_at;
          }

          await (adminSupabase
            .from("organizations") as any)
            .update(updatePayload)
            .eq("id", (profile as any).organization_id);

          console.log(`[subscription-sync] Updated org ${(profile as any).organization_id} to plan=${stripePlan}, status=${stripeStatus}, sub=${stripeSubId}`);
        }
      } catch (syncError) {
        // Non-fatal — if Stripe call fails, serve what we have in DB
        console.error("[subscription-sync] Failed to sync from Stripe:", syncError);
      }
    }

    const planName = getPlanName(plan);
    const price = getPlanPrice(plan);
    const includesAiToolkit = plan === 'pro' || plan === 'enterprise';

    // Calculate trial info
    let trialDaysRemaining: number | null = null;

    if (status === 'trialing') {
      // Use trial_ends_at if available (set by webhook or sync above),
      // otherwise calculate from created_at + 14 days
      if (!trialEndsAt && (org as any).trial_ends_at) {
        trialEndsAt = (org as any).trial_ends_at;
      } else if (!trialEndsAt && (org as any).created_at) {
        const createdDate = new Date((org as any).created_at);
        const trialEnd = new Date(createdDate.getTime() + 14 * 24 * 60 * 60 * 1000);
        trialEndsAt = trialEnd.toISOString();
      }

      if (trialEndsAt) {
        const now = new Date();
        const endDate = new Date(trialEndsAt);
        const msRemaining = endDate.getTime() - now.getTime();
        trialDaysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
      }
    }

    const subscriptionInfo: SubscriptionInfo = {
      plan,
      planName,
      price,
      status,
      includesAiToolkit,
      organizationName: (org as any).name || null,
      userEmail: user.email || null,
      userFullName: userProfile?.full_name || null,
      trialEndsAt,
      trialDaysRemaining,
    };

    return NextResponse.json<ApiResponse<SubscriptionInfo>>(
      {
        success: true,
        data: subscriptionInfo,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Subscription info error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
