/**
 * QBO Data Endpoint
 * GET /api/qbo/data?clientCompanyId=xxx
 * Returns the latest dashboard snapshot for a specific client company
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { createClient } from "@/lib/supabase/server";
import type { ApiResponse, DashboardData } from "@/types";

const EMPTY_DATA: DashboardData = {
  revenue: 0,
  expenses: 0,
  profit: 0,
  cash_balance: 0,
  accounts_receivable: 0,
  accounts_payable: 0,
  jobs: [],
  invoices: [],
  cash_flow: [],
  metrics: [],
  last_updated: new Date().toISOString(),
};

export async function GET(request: NextRequest) {
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

    const orgId = profile.organization_id;
    const clientCompanyId = request.nextUrl.searchParams.get("clientCompanyId");
    const locationId = request.nextUrl.searchParams.get("locationId");

    // Build query for latest snapshot
    let query = supabase
      .from("dashboard_snapshots")
      .select("*")
      .eq("organization_id", orgId)
      .order("pulled_at", { ascending: false })
      .limit(1);

    if (clientCompanyId) {
      query = query.eq("client_company_id", clientCompanyId);
    }

    if (locationId) {
      query = (query as any).eq("location_id", locationId);
    }

    const { data: snapshot, error: snapshotError } = await (query as any).single();

    if (snapshotError || !snapshot) {
      return NextResponse.json<ApiResponse<DashboardData>>(
        {
          success: true,
          data: EMPTY_DATA,
          message: "No data available. Please sync QuickBooks data.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json<ApiResponse<DashboardData>>(
      {
        success: true,
        data: snapshot.data as DashboardData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("QBO Data Error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
