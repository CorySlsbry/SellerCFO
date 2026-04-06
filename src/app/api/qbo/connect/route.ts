/**
 * QBO OAuth Connect Endpoint
 * GET /api/qbo/connect
 * Initiates the QuickBooks Online OAuth flow
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { createClient } from "@/lib/supabase/server";
import { qboClient } from "@/lib/qbo";
import crypto from "crypto";

/**
 * Generates a random state parameter for OAuth
 */
function generateState(): string {
  return crypto.randomBytes(32).toString("hex");
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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single() as any;

    if (profileError || !(profile as any)?.organization_id) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 }
      );
    }

    // Generate state parameter
    const state = generateState();

    // Create response with state stored in cookie
    const authUrl = qboClient.getAuthUrl(state);
    const response = NextResponse.redirect(authUrl);

    // Store state in HTTP-only cookie for verification in callback
    response.cookies.set("qbo_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
    });

    return response;
  } catch (error) {
    console.error("QBO Connect Error:", error);
    return NextResponse.json(
      { error: "Failed to initiate QBO connection" },
      { status: 500 }
    );
  }
}
