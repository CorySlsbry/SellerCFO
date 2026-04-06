/**
 * Delete Account Endpoint
 * POST /api/auth/delete-account
 * Cancels subscription immediately and deletes the user account
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { createClient } from "@/lib/supabase/server";
import { stripeService } from "@/lib/stripe";
import { createClient as createAdminClient } from "@supabase/supabase-js";
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

    if (profile?.organization_id) {
      const { data: org } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", profile.organization_id)
        .single() as any;

      // Cancel any active Stripe subscriptions immediately
      if (org?.stripe_customer_id) {
        try {
          const subscriptions = await stripeService.getCustomerSubscriptions(org.stripe_customer_id);
          for (const sub of subscriptions) {
            if (sub.status === "active" || sub.status === "trialing") {
              await stripeService.cancelSubscription(sub.id, true);
            }
          }
        } catch (err) {
          console.error("Failed to cancel subscriptions during account deletion:", err);
          // Continue with deletion even if Stripe fails
        }
      }
    }

    // Delete user via admin client (requires service role key)
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("Failed to delete user:", deleteError);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Failed to delete account. Please contact support." },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<{ message: string }>>(
      {
        success: true,
        data: { message: "Account deleted successfully" },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete Account Error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
