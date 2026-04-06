/**
 * Stripe Billing Portal Endpoint
 * POST /api/stripe/portal
 * Creates a Stripe billing portal session
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { createClient } from "@/lib/supabase/server";
import { stripeService } from "@/lib/stripe";
import type { ApiResponse } from "@/types";

interface PortalResponse {
  url: string;
}

export async function POST(request: NextRequest) {
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

    if (!(org as any).stripe_customer_id) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "No Stripe customer found" },
        { status: 400 }
      );
    }

    try {
      // Create portal session scoped to the CFO Dashboard subscription
      const session = await stripeService.createPortalSession(
        (org as any).stripe_customer_id,
        (org as any).stripe_subscription_id
      );

      if (!session.url) {
        throw new Error("No portal URL returned");
      }

      return NextResponse.json<ApiResponse<PortalResponse>>(
        {
          success: true,
          data: {
            url: session.url,
          },
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("Failed to create portal session:", error);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Failed to create billing portal session" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Stripe Portal Error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
