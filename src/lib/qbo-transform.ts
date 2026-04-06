/**
 * QBO API response transformation utilities
 * Converts raw QBO data into dashboard-ready formats
 *
 * QBO Reports API returns data in this structure:
 * { Header: {...}, Rows: { Row: [ { type: "Section", group: "Income",
 *     Header: { ColData: [{value: "Income"}, ...] },
 *     Rows: { Row: [ { ColData: [{value: "Services"}, {value: "5000.00"}] } ] },
 *     Summary: { ColData: [{value: "Total Income"}, {value: "5000.00"}] }
 * } ] } }
 */

import type {
  DashboardData,
  Invoice,
  CashFlowData,
  JobData,
  FinancialMetric,
} from "@/types";

/**
 * QBO Reports API response shape
 */
interface QBOReportRow {
  type?: string;
  group?: string;
  Header?: { ColData: Array<{ value: string }> };
  Rows?: { Row: QBOReportRow[] };
  Summary?: { ColData: Array<{ value: string }> };
  ColData?: Array<{ value: string }>;
}

interface QBOReportData {
  Header?: Record<string, any>;
  Rows?: { Row?: QBOReportRow[] };
  // Legacy fallback for old format
  groupOf?: Array<{
    groupName: string;
    summary?: { totalAmt: string };
  }>;
}

type ProfitAndLossData = QBOReportData;
type BalanceSheetData = QBOReportData;

interface InvoiceData {
  Id: string;
  DocNumber: string;
  CustomerRef?: {
    value: string;
    name: string;
  };
  TxnDate: string;
  DueDate: string;
  TotalAmt: number;
  Balance: number;
  EmailStatus?: string;
  PrintStatus?: string;
}

/**
 * Monthly P&L report structure (with summarize_column_by=Month)
 * Columns array has month titles; each Row's ColData has values per column
 */
interface QBOMonthlyReportData {
  Header?: Record<string, any>;
  Columns?: {
    Column?: Array<{
      ColTitle: string;
      ColType: string;
      MetaData?: Array<{ Name: string; Value: string }>;
    }>;
  };
  Rows?: { Row?: QBOReportRow[] };
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
 * Normalizes QBO Rows structure — the API sometimes returns Rows as an array
 * directly or as { Row: [...] }
 */
function getRows(data: any): QBOReportRow[] {
  if (!data?.Rows) return [];
  // Standard format: { Rows: { Row: [...] } }
  if (data.Rows.Row && Array.isArray(data.Rows.Row)) return data.Rows.Row;
  // Flattened format: { Rows: [...] }
  if (Array.isArray(data.Rows)) return data.Rows;
  return [];
}

/**
 * Gets ColData array from Summary — handles both { ColData: [...] } and direct array
 */
function getSummaryColData(row: QBOReportRow): Array<{ value: string }> {
  if (!row.Summary) return [];
  if ((row.Summary as any).ColData) return (row.Summary as any).ColData;
  if (Array.isArray(row.Summary)) return row.Summary as any;
  return [];
}

/**
 * Gets ColData array from Header — handles both { ColData: [...] } and direct array
 */
function getHeaderColData(row: QBOReportRow): Array<{ value: string }> {
  if (!row.Header) return [];
  if ((row.Header as any).ColData) return (row.Header as any).ColData;
  if (Array.isArray(row.Header)) return row.Header as any;
  return [];
}

/**
 * Extracts the summary total from a QBO Report section row
 */
function getSectionTotal(row: QBOReportRow): number {
  const summaryData = getSummaryColData(row);
  if (summaryData.length >= 2) {
    return extractAmount(summaryData[summaryData.length - 1].value);
  }
  // Fallback: single-row sections may have ColData directly
  if (row.ColData && row.ColData.length >= 2) {
    return extractAmount(row.ColData[row.ColData.length - 1].value);
  }
  return 0;
}

/**
 * Transforms QBO Profit & Loss data
 * Handles both new Reports API format (Rows>Row>ColData) and legacy groupOf format
 */
export function transformProfitAndLoss(
  qboData: ProfitAndLossData
): {
  revenue: number;
  expenses: number;
  profit: number;
  monthlyData: Array<{ month: string; revenue: number; expenses: number }>;
} {
  let revenue = 0;
  let expenses = 0;

  // Parse Rows (handles both { Row: [...] } and direct array formats)
  const rows = getRows(qboData);
  if (rows.length > 0) {
    for (const row of rows) {
      const group = (row.group || "").toLowerCase();
      const headerData = getHeaderColData(row);
      const headerLabel = (headerData[0]?.value || "").toLowerCase();
      const label = group || headerLabel;

      // Skip "net" summary rows (NetOperatingIncome, NetIncome, NetOtherIncome)
      // These are computed totals, not actual income/expense sections
      if (label.startsWith("net")) continue;

      if (label.includes("income") || label.includes("revenue")) {
        revenue += getSectionTotal(row);
      } else if (
        label.includes("expense") ||
        label.includes("cost of goods") ||
        label.includes("cogs")
      ) {
        expenses += getSectionTotal(row);
      }
    }
  }
  // Legacy fallback
  else if (qboData.groupOf) {
    for (const group of qboData.groupOf) {
      if (
        group.groupName?.toLowerCase().includes("income") ||
        group.groupName?.toLowerCase().includes("revenue")
      ) {
        revenue += extractAmount(group.summary?.totalAmt);
      } else if (
        group.groupName?.toLowerCase().includes("expense") ||
        group.groupName?.toLowerCase().includes("cost")
      ) {
        expenses += extractAmount(group.summary?.totalAmt);
      }
    }
  }

  const profit = revenue - expenses;

  return {
    revenue: Math.max(0, revenue),
    expenses: Math.max(0, expenses),
    profit,
    monthlyData: [],
  };
}

/**
 * Transforms QBO Balance Sheet data
 * Handles both new Reports API format (Rows>Row>ColData) and legacy groupOf format
 */
export function transformBalanceSheet(
  qboData: BalanceSheetData
): {
  cashBalance: number;
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
} {
  let cashBalance = 0;
  let totalAssets = 0;
  let totalLiabilities = 0;
  let equity = 0;

  // Parse Rows (handles both formats)
  const bsRows = getRows(qboData);
  if (bsRows.length > 0) {
    for (const row of bsRows) {
      const group = (row.group || "").toLowerCase();
      const headerData = getHeaderColData(row);
      const headerLabel = (headerData[0]?.value || "").toLowerCase();
      const label = group || headerLabel;
      const amount = getSectionTotal(row);

      if (label.includes("asset")) {
        totalAssets += amount;
        // Look inside sub-rows for bank/cash accounts
        const subRows = row.Rows?.Row || (Array.isArray(row.Rows) ? row.Rows : []);
        for (const subRow of subRows) {
          const subGroup = ((subRow as QBOReportRow).group || "").toLowerCase();
          const subHeaderData = getHeaderColData(subRow as QBOReportRow);
          const subHeader = (subHeaderData[0]?.value || "").toLowerCase();
          const subLabel = subGroup || subHeader;
          if (
            subLabel.includes("bank") ||
            subLabel.includes("cash") ||
            subLabel.includes("checking") ||
            subLabel.includes("savings")
          ) {
            cashBalance += getSectionTotal(subRow as QBOReportRow);
          }
        }
        // If no sub-rows matched cash, check if the whole asset section is cash-like
        if (cashBalance === 0 && (label.includes("bank") || label.includes("cash"))) {
          cashBalance = amount;
        }
      } else if (label.includes("liabilit")) {
        totalLiabilities += amount;
      } else if (label.includes("equity")) {
        equity += amount;
      }
    }
  }
  // Legacy fallback
  else if (qboData.groupOf) {
    for (const group of qboData.groupOf) {
      const groupName = group.groupName?.toLowerCase() || "";
      const amount = extractAmount(group.summary?.totalAmt);

      if (groupName.includes("asset")) {
        totalAssets += amount;
        if (groupName.includes("cash") || groupName.includes("bank")) {
          cashBalance += amount;
        }
      } else if (groupName.includes("liability")) {
        totalLiabilities += amount;
      } else if (groupName.includes("equity")) {
        equity += amount;
      }
    }
  }

  return {
    cashBalance: Math.max(0, cashBalance),
    totalAssets: Math.max(0, totalAssets),
    totalLiabilities: Math.max(0, totalLiabilities),
    equity: Math.max(0, equity),
  };
}

/**
 * Calculates days overdue for an invoice
 */
function calculateDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Determines invoice status
 */
function getInvoiceStatus(
  invoice: InvoiceData
): "draft" | "sent" | "viewed" | "paid" | "overdue" {
  if (invoice.Balance === 0) {
    return "paid";
  }

  const daysOverdue = calculateDaysOverdue(invoice.DueDate);
  if (daysOverdue > 0) {
    return "overdue";
  }

  if (invoice.EmailStatus?.toLowerCase() === "sent") {
    return "sent";
  }

  return "draft";
}

/**
 * Transforms QBO Invoice data
 */
export function transformInvoices(qboData: {
  QueryResponse?: {
    Invoice?: InvoiceData[];
  };
}): Invoice[] {
  const invoices: Invoice[] = [];

  if (qboData.QueryResponse?.Invoice) {
    for (const qboInvoice of qboData.QueryResponse.Invoice) {
      if (!qboInvoice?.Id) continue;
      const dueDate = qboInvoice.DueDate || qboInvoice.TxnDate || new Date().toISOString().split("T")[0];
      const daysOverdue = calculateDaysOverdue(dueDate);

      invoices.push({
        id: qboInvoice.Id,
        invoice_number: qboInvoice.DocNumber || "",
        customer_name: qboInvoice.CustomerRef?.name || "Unknown",
        amount: qboInvoice.TotalAmt || 0,
        due_date: dueDate,
        status: getInvoiceStatus(qboInvoice),
        days_overdue: daysOverdue,
      });
    }
  }

  return invoices;
}

/**
 * Transforms a monthly P&L report into Cash Flow data
 * Uses the QBO P&L with summarize_column_by=Month to get per-month revenue & expenses
 * Revenue = inflow, Expenses = outflow, Net = revenue - expenses
 */
export function transformCashFlow(
  qboData: QBOMonthlyReportData
): CashFlowData[] {
  const cashFlowData: CashFlowData[] = [];

  if (!qboData?.Columns?.Column || !qboData?.Rows?.Row) {
    return cashFlowData;
  }

  const columns = qboData.Columns.Column;
  // Find month columns (skip first "Account" column and last "Total" column)
  const monthColumns: Array<{ index: number; title: string }> = [];
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    if (col.ColType === "Money" && col.ColTitle.toLowerCase() !== "total") {
      monthColumns.push({ index: i, title: col.ColTitle });
    }
  }

  if (monthColumns.length === 0) return cashFlowData;

  // Initialize monthly buckets
  const monthlyRevenue: number[] = new Array(monthColumns.length).fill(0);
  const monthlyExpenses: number[] = new Array(monthColumns.length).fill(0);

  // Walk through sections to find Income and Expense summary rows
  for (const row of qboData.Rows.Row) {
    const group = (row.group || "").toLowerCase();
    const headerLabel = (row.Header?.ColData?.[0]?.value || "").toLowerCase();
    const label = group || headerLabel;

    // Skip "net" summary rows (NetOperatingIncome, NetIncome, NetOtherIncome)
    if (label.startsWith("net")) continue;

    // Get the Summary.ColData which has monthly totals for the section
    const summaryColData = row.Summary?.ColData;
    if (!summaryColData) continue;

    if (label.includes("income") || label.includes("revenue")) {
      for (const mc of monthColumns) {
        if (mc.index < summaryColData.length) {
          monthlyRevenue[monthColumns.indexOf(mc)] += extractAmount(summaryColData[mc.index]?.value);
        }
      }
    } else if (
      label.includes("expense") ||
      label.includes("cost of goods") ||
      label.includes("cogs") ||
      label.includes("otherexpenses")
    ) {
      for (const mc of monthColumns) {
        if (mc.index < summaryColData.length) {
          monthlyExpenses[monthColumns.indexOf(mc)] += extractAmount(summaryColData[mc.index]?.value);
        }
      }
    }
  }

  // Build cash flow array — include months that have any activity
  for (let i = 0; i < monthColumns.length; i++) {
    const rev = monthlyRevenue[i];
    const exp = monthlyExpenses[i];
    // Include all months that have revenue or expenses (even if zero revenue)
    if (rev !== 0 || exp !== 0) {
      cashFlowData.push({
        month: monthColumns[i].title, // Already formatted like "Jul 2025"
        inflow: Math.max(0, rev),
        outflow: Math.max(0, exp),
        net: rev - exp,
      });
    }
  }

  return cashFlowData;
}

/**
 * Formats month string (YYYY-MM) for display
 */
function formatMonthForDisplay(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
}

/**
 * Creates financial metrics from dashboard data
 */
export function createMetrics(dashboardData: {
  revenue: number;
  expenses: number;
  profit: number;
  cash_balance: number;
}): FinancialMetric[] {
  const profitMargin =
    dashboardData.revenue > 0
      ? (dashboardData.profit / dashboardData.revenue) * 100
      : 0;

  return [
    {
      label: "Total Revenue",
      value: dashboardData.revenue,
      change: 0,
      changeType: "neutral",
      format: "currency",
    },
    {
      label: "Total Expenses",
      value: dashboardData.expenses,
      change: 0,
      changeType: "neutral",
      format: "currency",
    },
    {
      label: "Net Profit",
      value: dashboardData.profit,
      change: 0,
      changeType: dashboardData.profit > 0 ? "positive" : "negative",
      format: "currency",
    },
    {
      label: "Profit Margin",
      value: profitMargin,
      change: 0,
      changeType: profitMargin > 0 ? "positive" : "negative",
      format: "percent",
    },
    {
      label: "Cash Balance",
      value: dashboardData.cash_balance,
      change: 0,
      changeType: "neutral",
      format: "currency",
    },
  ];
}

/**
 * Combines all transformed data into a complete DashboardData object
 */
export function buildDashboardData(
  profitAndLoss: ReturnType<typeof transformProfitAndLoss>,
  balanceSheet: ReturnType<typeof transformBalanceSheet>,
  invoices: Invoice[],
  cashFlow: CashFlowData[]
): DashboardData {
  const dashboardData: DashboardData = {
    revenue: profitAndLoss.revenue,
    expenses: profitAndLoss.expenses,
    profit: profitAndLoss.profit,
    cash_balance: balanceSheet.cashBalance,
    accounts_receivable: 0,
    accounts_payable: balanceSheet.totalLiabilities,
    jobs: [],
    invoices,
    cash_flow: cashFlow,
    metrics: [],
    last_updated: new Date().toISOString(),
  };

  dashboardData.metrics = createMetrics(dashboardData);

  return dashboardData;
}
