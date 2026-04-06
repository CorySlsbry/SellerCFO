/**
 * Reports Generation Endpoint
 * POST /api/reports/generate
 * Generates financial reports from QuickBooks data
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { createClient } from "@/lib/supabase/server";
import { qboClient } from "@/lib/qbo";
import type { ApiResponse } from "@/types";

interface GenerateReportRequest {
  reportType: string;
  startDate: string;
  endDate: string;
  clientCompanyId?: string;
}

/**
 * Checks if token needs refreshing
 */
function isTokenExpired(expiresAt: string): boolean {
  const expiration = new Date(expiresAt);
  const now = new Date();
  return expiration.getTime() - now.getTime() < 5 * 60 * 1000;
}

/**
 * Extracts numeric value from QBO data
 */
function extractAmount(value: string | number | undefined): number {
  if (value === undefined || value === null || value === "") return 0;
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? 0 : num;
}

/**
 * Extracts rows from a QBO Reports API section.
 * The Reports API returns nested Rows > Row arrays with ColData.
 */
function extractSectionRows(section: any): Array<{ name: string; amount: number }> {
  const items: Array<{ name: string; amount: number }> = [];

  if (section?.Rows?.Row) {
    for (const row of section.Rows.Row) {
      if (row.type === "Data" && row.ColData) {
        const name = row.ColData[0]?.value || "Unknown";
        const amount = extractAmount(row.ColData[1]?.value);
        items.push({ name, amount });
      } else if (row.type === "Section" && row.Header?.ColData) {
        // Sub-section — recurse and also grab the summary
        const subItems = extractSectionRows(row);
        items.push(...subItems);
      }
    }
  }

  return items;
}

/**
 * Gets the total from a section's Summary row
 */
function getSectionTotal(section: any): number {
  if (section?.Summary?.ColData) {
    return extractAmount(section.Summary.ColData[1]?.value);
  }
  return 0;
}

/**
 * Transforms P&L data from QBO Reports API into report format
 * Reports API returns: { Header, Columns, Rows: { Row: [...sections] } }
 */
function transformPLReport(qboData: any): any {
  const revenues: Array<{ category: string; amount: number }> = [];
  const expenses: Array<{ category: string; amount: number }> = [];
  let totalRevenue = 0;
  let totalExpenses = 0;

  const rows = qboData?.Rows?.Row || [];

  for (const section of rows) {
    const group = (section.group || section.Header?.ColData?.[0]?.value || "").toLowerCase();

    // Skip "net" summary rows (NetOperatingIncome, NetIncome, NetOtherIncome)
    // These are computed totals, not actual income/expense sections
    if (group.startsWith("net")) continue;

    if (group.includes("income") || group.includes("revenue")) {
      const items = extractSectionRows(section);
      for (const item of items) {
        revenues.push({ category: item.name, amount: Math.abs(item.amount) });
      }
      totalRevenue += Math.abs(getSectionTotal(section));
    } else if (group.includes("expense") || group.includes("cost")) {
      const items = extractSectionRows(section);
      for (const item of items) {
        expenses.push({ category: item.name, amount: Math.abs(item.amount) });
      }
      totalExpenses += Math.abs(getSectionTotal(section));
    }
  }

  // If no sections matched, try to get totals from the report summary
  if (revenues.length === 0 && expenses.length === 0) {
    // Fallback: walk all rows looking for any data
    for (const section of rows) {
      if (section.Summary?.ColData) {
        const name = section.Summary.ColData[0]?.value || "Unknown";
        const amount = extractAmount(section.Summary.ColData[1]?.value);
        if (amount > 0) {
          expenses.push({ category: name, amount });
          totalExpenses += amount;
        }
      }
    }
  }

  return {
    revenues: revenues.length > 0 ? revenues : [{ category: "No revenue data", amount: 0 }],
    expenses: expenses.length > 0 ? expenses : [{ category: "No expense data", amount: 0 }],
    totalRevenue,
    totalExpenses,
    netIncome: totalRevenue - totalExpenses,
  };
}

/**
 * Transforms Balance Sheet data from QBO Reports API into report format
 */
function transformBalanceSheetReport(qboData: any): any {
  const assets: Array<{ category: string; amount: number; subcategories: any[] }> = [];
  const liabilities: Array<{ category: string; amount: number; subcategories: any[] }> = [];
  const equity: Array<{ category: string; amount: number; subcategories: any[] }> = [];
  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;

  const rows = qboData?.Rows?.Row || [];

  for (const section of rows) {
    const group = (section.group || section.Header?.ColData?.[0]?.value || "").toLowerCase();
    const sectionTotal = Math.abs(getSectionTotal(section));
    const items = extractSectionRows(section);
    const subcategories = items.map((i) => ({ name: i.name, amount: Math.abs(i.amount) }));

    if (group.includes("asset")) {
      assets.push({ category: section.Header?.ColData?.[0]?.value || "Assets", amount: sectionTotal, subcategories });
      totalAssets += sectionTotal;
    } else if (group.includes("liabilit")) {
      liabilities.push({ category: section.Header?.ColData?.[0]?.value || "Liabilities", amount: sectionTotal, subcategories });
      totalLiabilities += sectionTotal;
    } else if (group.includes("equity")) {
      equity.push({ category: section.Header?.ColData?.[0]?.value || "Equity", amount: sectionTotal, subcategories });
      totalEquity += sectionTotal;
    }
  }

  return {
    assets: assets.length > 0 ? assets : [{ category: "No asset data", amount: 0, subcategories: [] }],
    liabilities: liabilities.length > 0 ? liabilities : [{ category: "No liability data", amount: 0, subcategories: [] }],
    equity: equity.length > 0 ? equity : [{ category: "No equity data", amount: 0, subcategories: [] }],
    totalAssets,
    totalLiabilities,
    totalEquity,
  };
}

/**
 * Calculates days old from due date
 */
function calculateDaysOld(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Classifies aging status based on days
 */
function getAgingStatus(daysOld: number): "Current" | "Overdue" | "Past Due" {
  if (daysOld <= 30) return "Current";
  if (daysOld <= 60) return "Overdue";
  return "Past Due";
}

/**
 * Transforms invoices into AR Aging report
 */
function transformARAgingReport(invoices: any[]): any {
  const arData = [];

  if (invoices?.QueryResponse?.Invoice) {
    for (const inv of invoices.QueryResponse.Invoice) {
      if (inv.Balance && inv.Balance > 0) {
        const daysOld = calculateDaysOld(inv.DueDate);
        arData.push({
          customer: inv.CustomerRef?.name || "Unknown",
          invoice: inv.DocNumber,
          amount: inv.Balance,
          days: daysOld,
          status: getAgingStatus(daysOld),
        });
      }
    }
  }

  return arData.length > 0 ? arData : [];
}

/**
 * Transforms bills into AP Aging report
 */
function transformAPAgingReport(bills: any[]): any {
  const apData = [];

  if (bills?.QueryResponse?.Bill) {
    for (const bill of bills.QueryResponse.Bill) {
      if (bill.Balance && bill.Balance > 0) {
        const daysOld = calculateDaysOld(bill.DueDate);
        apData.push({
          vendor: bill.VendorRef?.name || "Unknown",
          invoiceNum: bill.DocNumber,
          amount: bill.Balance,
          days: daysOld,
          status: getAgingStatus(daysOld),
        });
      }
    }
  }

  return apData.length > 0 ? apData : [];
}

/**
 * Generates Cash Flow report from P&L and Balance Sheet
 * Shows full revenue and expense breakdown under Operating Activities
 * Uses indirect method: starts with Net Income, then shows components
 */
function transformCashFlowReport(plData: any, bsData: any): any {
  const pl = transformPLReport(plData);
  const bs = transformBalanceSheetReport(bsData);

  // Build operating activities with revenue and expense line items
  const operating: Array<{ item: string; amount: number }> = [];

  // Revenue items (positive = cash in)
  for (const rev of pl.revenues) {
    if (rev.amount > 0) {
      operating.push({ item: rev.category, amount: rev.amount });
    }
  }

  // Expense items (negative = cash out)
  for (const exp of pl.expenses) {
    if (exp.amount > 0) {
      operating.push({ item: exp.category, amount: -exp.amount });
    }
  }

  // If no line items, add summary
  if (operating.length === 0) {
    operating.push({ item: "Net Income", amount: pl.netIncome });
  }

  const operatingTotal = pl.totalRevenue - pl.totalExpenses;

  // Investing: look for fixed asset changes in the balance sheet
  const investing: Array<{ item: string; amount: number }> = [];
  for (const asset of bs.assets) {
    const cat = asset.category.toLowerCase();
    if (cat.includes("fixed") || cat.includes("property") || cat.includes("equipment") || cat.includes("vehicle")) {
      investing.push({ item: asset.category, amount: -asset.amount });
    }
  }
  if (investing.length === 0) {
    investing.push({ item: "No investing activity", amount: 0 });
  }
  const investingTotal = investing.reduce((sum, i) => sum + i.amount, 0);

  // Financing: look for loan/debt changes in liabilities and equity distributions
  const financing: Array<{ item: string; amount: number }> = [];
  for (const liab of bs.liabilities) {
    const cat = liab.category.toLowerCase();
    if (cat.includes("loan") || cat.includes("note") || cat.includes("debt") || cat.includes("line of credit")) {
      financing.push({ item: liab.category, amount: liab.amount });
    }
  }
  for (const eq of bs.equity) {
    const cat = eq.category.toLowerCase();
    if (cat.includes("distribution") || cat.includes("draw") || cat.includes("dividend")) {
      financing.push({ item: eq.category, amount: -eq.amount });
    }
  }
  if (financing.length === 0) {
    financing.push({ item: "No financing activity", amount: 0 });
  }
  const financingTotal = financing.reduce((sum, i) => sum + i.amount, 0);

  return {
    operating,
    investing,
    financing,
    operatingTotal,
    investingTotal,
    financingTotal,
    netCashFlow: operatingTotal + investingTotal + financingTotal,
    // Include summary totals for the header cards
    totalRevenue: pl.totalRevenue,
    totalExpenses: pl.totalExpenses,
  };
}

/**
 * Generates Tax Summary from P&L data
 */
function transformTaxReport(plData: any): any {
  const pl = transformPLReport(plData);
  const taxableIncome = Math.max(0, pl.netIncome);
  const totalExpenses = pl.totalExpenses;

  // Build deductions from P&L expense categories
  const deductions = pl.expenses
    .filter((e: any) => e.amount > 0)
    .map((e: any) => ({ item: e.category, amount: e.amount }));
  const totalDeductions = deductions.reduce((sum: number, d: any) => sum + d.amount, 0);
  const adjustedIncome = Math.max(0, taxableIncome - totalDeductions);

  const federalRate = 0.22;
  const stateRate = 0.0485; // Utah state tax rate
  const seRate = 0.153;
  const totalEstimatedTax = Math.max(0, adjustedIncome * (federalRate + stateRate + seRate));

  return {
    taxableIncome,
    deductions: deductions.length > 0 ? deductions : [{ item: "No deductions found", amount: 0 }],
    totalDeductions,
    adjustedIncome,
    estimatedFederalTax: Math.max(0, adjustedIncome * federalRate),
    estimatedStateTax: Math.max(0, adjustedIncome * stateRate),
    estimatedSelfEmploymentTax: Math.max(0, adjustedIncome * seRate),
    totalEstimatedTax,
    quarterlyPayments: [
      { quarter: "Q1", amount: totalEstimatedTax / 4 },
      { quarter: "Q2", amount: totalEstimatedTax / 4 },
      { quarter: "Q3", amount: totalEstimatedTax / 4 },
      { quarter: "Q4", amount: totalEstimatedTax / 4 },
    ],
  };
}

/**
 * Generates Budget vs Actual from P&L expenses
 * Note: Budget data requires manual setup. Shows actuals from P&L with zero budgets.
 */
function transformBudgetActualReport(plData: any): any {
  const pl = transformPLReport(plData);

  return pl.expenses
    .filter((e: any) => e.amount > 0)
    .map((e: any) => ({
      category: e.category,
      budget: 0,
      actual: e.amount,
      variance: -e.amount,
      variancePercent: 0,
    }));
}

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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single() as any;

    if (profileError || !(profile as any)?.organization_id) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Organization not found" },
        { status: 400 }
      );
    }

    const orgId = (profile as any).organization_id;

    const body = (await request.json()) as GenerateReportRequest;
    const { reportType, startDate, endDate, clientCompanyId } = body;

    // Get QBO credentials from client_companies table (multi-client support)
    let clientCompany: any = null;
    let clientError: any = null;

    if (clientCompanyId) {
      const result = await (supabase as any)
        .from("client_companies")
        .select("*")
        .eq("organization_id", orgId)
        .eq("id", clientCompanyId)
        .eq("is_active", true)
        .single();
      clientCompany = result.data;
      clientError = result.error;
    } else {
      // Fallback: first active client
      const result = await (supabase as any)
        .from("client_companies")
        .select("*")
        .eq("organization_id", orgId)
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();
      clientCompany = result.data;
      clientError = result.error;
    }

    if (clientError || !clientCompany) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "No client company found. Connect a QBO company first." },
        { status: 400 }
      );
    }

    if (!clientCompany.qbo_realm_id || !clientCompany.qbo_access_token) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "QuickBooks not connected for this client. Please connect QuickBooks first." },
        { status: 400 }
      );
    }

    let accessToken = clientCompany.qbo_access_token;
    const realmId = clientCompany.qbo_realm_id;

    // Refresh token if expired
    if (clientCompany.qbo_token_expires_at && isTokenExpired(clientCompany.qbo_token_expires_at)) {
      if (!clientCompany.qbo_refresh_token) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: "Cannot refresh QuickBooks token — reconnect QBO" },
          { status: 400 }
        );
      }

      try {
        const tokenResponse = await qboClient.refreshToken(clientCompany.qbo_refresh_token);
        accessToken = tokenResponse.access_token;

        const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);
        await (supabase as any)
          .from("client_companies")
          .update({
            qbo_access_token: tokenResponse.access_token,
            qbo_refresh_token: tokenResponse.refresh_token,
            qbo_token_expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", clientCompany.id);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: "Failed to refresh QuickBooks token" },
          { status: 400 }
        );
      }
    }

    let reportData: any = {};

    try {
      switch (reportType) {
        case "pl": {
          const plData = await qboClient.getProfitAndLoss(
            accessToken,
            realmId,
            startDate,
            endDate
          );
          reportData = transformPLReport(plData);
          break;
        }

        case "balance-sheet": {
          const bsData = await qboClient.getBalanceSheet(accessToken, realmId);
          reportData = transformBalanceSheetReport(bsData);
          break;
        }

        case "cash-flow": {
          const plData = await qboClient.getProfitAndLoss(
            accessToken,
            realmId,
            startDate,
            endDate
          );
          const bsData = await qboClient.getBalanceSheet(accessToken, realmId);
          reportData = transformCashFlowReport(plData, bsData);
          break;
        }

        case "ar-aging": {
          const invoices = await qboClient.getInvoices(accessToken, realmId);
          reportData = transformARAgingReport(invoices);
          break;
        }

        case "ap-aging": {
          const bills = await qboClient.getBills(accessToken, realmId);
          reportData = transformAPAgingReport(bills);
          break;
        }

        case "job-costing": {
          reportData = [];
          break;
        }

        case "claims-pending": {
          reportData = [];
          break;
        }

        case "tax": {
          const plData = await qboClient.getProfitAndLoss(
            accessToken,
            realmId,
            startDate,
            endDate
          );
          reportData = transformTaxReport(plData);
          break;
        }

        case "patient balance": {
          reportData = [];
          break;
        }

        case "budget-actual": {
          const plData = await qboClient.getProfitAndLoss(
            accessToken,
            realmId,
            startDate,
            endDate
          );
          reportData = transformBudgetActualReport(plData);
          break;
        }

        default:
          return NextResponse.json<ApiResponse<null>>(
            { success: false, error: "Invalid report type" },
            { status: 400 }
          );
      }
    } catch (qboError: any) {
      const errMsg = qboError?.message || String(qboError);
      console.error("QBO API error:", errMsg, "| Report:", reportType, "| Realm:", realmId);
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: `Failed to fetch QuickBooks data: ${errMsg}` },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<any>>(
      {
        success: true,
        data: reportData,
        message: `${reportType} report generated successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Report Generation Error:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
