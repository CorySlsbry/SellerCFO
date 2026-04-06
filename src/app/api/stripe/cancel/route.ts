/**
 * Stripe Cancel Subscription Endpoint
 * POST /api/stripe/cancel
 * Cancels the user's subscription at end of billing period
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { createClient } from "@/lib/supabase/server";
import { stripeService } from "@/lib/stripe";
import type { ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
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
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single() as any;

    if (!profile?.organization_id) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Organization not found" },
        { status: 400 }
      );
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", profile.organization_id)
      .single() as any;

    if (!org?.stripe_customer_id) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "No billing account found" },
        { status: 400 }
      );
    }

    // Get active subscriptions
    const subscriptions = await stripeService.getCustomerSubscriptions(org.stripe_customer_id);
    const activeSub = subscriptions.find(
      (s) => s.status === "active" || s.status === "trialing"
    );

    if (!activeSub) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "No active subscription found" },
        { status: 400 }
      );
    }

    // Cancel at end of period (not immediate)
    await stripeService.cancelSubscription(activeSub.id, false);

    return NextResponse.json<ApiResponse<{ message: string }>>(
      {
        success: true,
        data: { message: "Subscription will cancel at end of billing period" },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Cancel Subscription Error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
