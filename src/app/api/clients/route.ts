/**
 * Client Companies API
 * GET  /api/clients — list all client companies for the user's org
 * POST /api/clients — add a new client company
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single() as any;

    if (!profile?.organization_id) {
      return NextResponse.json({ success: false, error: "No organization" }, { status: 400 });
    }

    const { data: clients, error } = await supabase
      .from("client_companies")
      .select("id, name, qbo_realm_id, is_active, created_at")
      .eq("organization_id", profile.organization_id)
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching clients:", error);
      return NextResponse.json({ success: false, error: "Failed to fetch clients" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: clients || [] });
  } catch (error) {
    console.error("Clients API Error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single() as any;

    if (!profile?.organization_id) {
      return NextResponse.json({ success: false, error: "No organization" }, { status: 400 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
    }

    const { data: client, error } = await (supabase as any)
      .from("client_companies")
      .insert({
        organization_id: profile.organization_id,
        name,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating client:", error);
      return NextResponse.json({ success: false, error: "Failed to create client" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: client }, { status: 201 });
  } catch (error) {
    console.error("Clients API Error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
