/**
 * Server-side Signup Endpoint
 * POST /api/auth/signup
 * Creates user with auto-confirmed email, org, and profile in one transaction
 * Uses service role key to bypass email confirmation and RLS
 * Also creates a GHL contact and enrolls in the SellerCFO Onboarding Drip workflow
 */

import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail } from "@/lib/email";

const GHL_ONBOARDING_WORKFLOW_ID = 'dca41be4-9ab1-45ec-b099-976217cf86c4';

/**
 * Create/upsert a GHL contact tagged "medicalcfo-signup" and enroll in the
 * SellerCFO Onboarding Drip workflow. Non-blocking — failures are logged
 * but never break the signup flow.
 */
async function pushToGHLOnboarding(email: string, fullName: string, companyName: string): Promise<void> {
  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID || 'd6snrvwPYgsUbjfj6Dox';

  if (!apiKey) {
    console.warn('[signup] GHL_API_KEY not set — skipping GHL onboarding enrollment');
    return;
  }

  try {
    // Step 1: Create or upsert the contact
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const contactRes = await fetch('https://services.leadconnectorhq.com/contacts/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      body: JSON.stringify({
        locationId,
        email,
        firstName,
        lastName,
        companyName,
        tags: ['medicalcfo-signup'],
        source: 'SellerCFO App Signup',
      }),
    });

    const contactData = await contactRes.json();
    const contactId = contactData?.contact?.id;

    if (!contactId) {
      console.error('[signup] GHL contact creation returned no ID:', contactData);
      return;
    }

    console.log(`[signup] GHL contact created/updated: ${contactId}`);

    // Step 2: Enroll in the SellerCFO Onboarding Drip workflow
    const enrollRes = await fetch(
      `https://services.leadconnectorhq.com/contacts/${contactId}/workflow/${GHL_ONBOARDING_WORKFLOW_ID}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28',
        },
        body: JSON.stringify({ eventStartTime: new Date().toISOString() }),
      }
    );

    if (enrollRes.ok) {
      console.log(`[signup] Contact ${contactId} enrolled in SellerCFO Onboarding Drip`);
    } else {
      const enrollData = await enrollRes.text();
      console.error(`[signup] Workflow enrollment failed (${enrollRes.status}):`, enrollData);
    }
  } catch (err) {
    console.error('[signup] GHL onboarding push threw:', err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, companyName } = await request.json();

    // Validate inputs
    if (!email || !password || !fullName || !companyName) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Step 1: Create auth user with auto-confirmed email
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Skip email confirmation entirely
        user_metadata: {
          full_name: fullName,
          company_name: companyName,
        },
      });

    if (authError) {
      // Handle duplicate email
      if (authError.message.includes("already been registered")) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please sign in." },
          { status: 409 }
        );
      }
      console.error("Auth create error:", authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // Step 2: Create organization (service role bypasses RLS)
    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const { data: orgData, error: orgError } = await (supabase
      .from("organizations") as any)
      .insert({
        name: companyName,
        slug,
      })
      .select("id")
      .single();

    if (orgError) {
      // Rollback: delete the auth user since org creation failed
      await supabase.auth.admin.deleteUser(userId);
      console.error("Org create error:", orgError);
      return NextResponse.json(
        { error: "Failed to create organization: " + orgError.message },
        { status: 500 }
      );
    }

    // Step 3: Create or update profile linked to the organization
    // Use upsert because a database trigger may have auto-created the profile
    const { error: profileError } = await (supabase
      .from("profiles") as any)
      .upsert(
        {
          id: userId,
          email,
          full_name: fullName,
          organization_id: orgData?.id,
          role: "owner",
        },
        { onConflict: "id" }
      );

    if (profileError) {
      // Rollback: delete org and auth user
      await supabase.from("organizations").delete().eq("id", orgData?.id);
      await supabase.auth.admin.deleteUser(userId);
      console.error("Profile create error:", profileError);
      return NextResponse.json(
        { error: "Failed to create profile: " + profileError.message },
        { status: 500 }
      );
    }

    // Send welcome email + create GHL contact + enroll in onboarding (non-blocking)
    sendWelcomeEmail(email, fullName).catch(() => {});
    pushToGHLOnboarding(email, fullName, companyName).catch(() => {});

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: authData.user.email,
      },
    });
  } catch (err) {
    console.error("Unexpected signup error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
