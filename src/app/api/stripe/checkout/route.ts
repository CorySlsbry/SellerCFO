/**
 * Stripe Checkout Endpoint
 * POST /api/stripe/checkout
 * Creates a Stripe checkout session for subscription
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { createClient } from "@/lib/supabase/server";
import { stripeService } from "@/lib/stripe";
import type { ApiResponse } from "@/types";

interface CheckoutRequest {
  plan: "basic" | "pro" | "enterprise";
}

interface CheckoutResponse {
  url: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: CheckoutRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Validate plan
    if (!body.plan || !["basic", "pro", "enterprise"].includes(body.plan)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Invalid plan" },
        { status: 400 }
      );
    }

    // Ensure user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Checkout auth error:", userError?.message);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: `Unauthorized: ${userError?.message || 'No user session'}` },
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
      console.error("Checkout profile error:", profileError?.message, "user:", user.id);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: `Profile not found: ${profileError?.message || 'No organization_id'}` },
        { status: 400 }
      );
    }

    // Get organization
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

    let customerId = (org as any).stripe_customer_id;

    // Create or retrieve Stripe customer
    if (!customerId) {
      try {
        const customer = await stripeService.createCustomer(
          user.email || "",
          (org as any).name,
          (org as any).id
        );
        customerId = customer.id;

          // Update organization with customer ID
        await (supabase as any)
          .from("organizations")
          .update({
            stripe_customer_id: customerId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", (org as any).id);
      } catch (error) {
        console.error("Failed to create Stripe customer:", error);
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: "Failed to create checkout session" },
          { status: 500 }
        );
      }
    }

    // Create checkout session
    try {
      console.log("Creating checkout:", { customerId, plan: body.plan, orgId: (org as any).id });
      const session = await stripeService.createCheckoutSession(
        customerId,
        body.plan,
        (org as any).id
      );

      if (!session.url) {
        throw new Error("No checkout URL returned");
      }

      return NextResponse.json<ApiResponse<CheckoutResponse>>(
        {
          success: true,
          data: {
            url: session.url,
          },
        },
        { status: 200 }
      );
    } catch (error: any) {
      console.error("Failed to create checkout session:", error?.message || error);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: `Checkout failed: ${error?.message || 'Unknown stripe error'}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error?.message || error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
