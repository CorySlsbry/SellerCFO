/**
 * Advisor Context Generator
 * Formats live dashboard data + integration data into a structured context block
 * that gets injected into the CFO Advisor's system prompt so Claude can reference
 * the user's actual financial data when answering questions.
 */

import type { DashboardData, Invoice, CashFlowData, JobData } from '@/types';

interface IntegrationMetrics {
  totalContractValue: number;
  totalActualCost: number;
  totalAR: number;
  totalRetainageReceivable: number;
  totalRetainagePayable: number;
  totalPipeline: number;
  totalWeightedPipeline: number;
  projectCount: number;
  contactCount: number;
  dealCount: number;
  activeProjectCount: number;
}

interface IntegrationProject {
  name: string;
  status: string;
  contract_amount: number;
  actual_cost: number;
  estimated_cost: number;
  billings_to_date: number;
  percent_complete: number;
  retainage_receivable: number;
  retainage_payable: number;
  over_under_billing: number;
  source: string;
  customer_name?: string;
  start_date?: string;
  projected_end_date?: string;
}

interface IntegrationDeal {
  name: string;
  amount: number;
  stage: string;
  probability: number;
  weighted_amount: number;
  expected_close_date?: string;
  contact_name?: string;
}

export interface AdvisorContext {
  dashboard: DashboardData | null;
  integrations: {
    projects: IntegrationProject[];
    deals: IntegrationDeal[];
    connectedSources: string[];
    metrics: IntegrationMetrics;
    dealsByStage: Record<string, { count: number; amount: number }>;
  } | null;
}

function formatCurrency(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return `$${amount.toFixed(2)}`;
}

function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Builds a structured text block from dashboard + integration data
 * for injection into the CFO Advisor system prompt.
 */
export function buildAdvisorContextBlock(ctx: AdvisorContext): string {
  const sections: string[] = [];

  // ── Dashboard Financial Data (from QBO snapshot) ──
  if (ctx.dashboard && ctx.dashboard.revenue > 0) {
    const d = ctx.dashboard;
    const profitMargin = d.revenue > 0 ? (d.profit / d.revenue) * 100 : 0;

    sections.push(`## LIVE FINANCIAL DATA (from QuickBooks Online)
Last synced: ${d.last_updated ? new Date(d.last_updated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown'}

### Key Metrics
- Revenue (YTD): ${formatCurrency(d.revenue)}
- Expenses (YTD): ${formatCurrency(d.expenses)}
- Net Profit: ${formatCurrency(d.profit)} (${formatPct(profitMargin)} margin)
- Cash Balance: ${formatCurrency(d.cash_balance)}
- Accounts Receivable: ${formatCurrency(d.accounts_receivable)}
- Accounts Payable: ${formatCurrency(d.accounts_payable)}
- Net Cash Position: ${formatCurrency(d.cash_balance + d.accounts_receivable - d.accounts_payable)}`);

    // ── Invoice / AR Detail ──
    if (d.invoices && d.invoices.length > 0) {
      const openInvoices = d.invoices.filter(inv => inv.status !== 'paid');
      const overdueInvoices = openInvoices.filter(inv => inv.status === 'overdue');
      const totalOpen = openInvoices.reduce((s, inv) => s + inv.amount, 0);
      const totalOverdue = overdueInvoices.reduce((s, inv) => s + inv.amount, 0);

      let invoiceBlock = `\n### Accounts Receivable Detail
- Total Open Invoices: ${openInvoices.length} totaling ${formatCurrency(totalOpen)}
- Overdue Invoices: ${overdueInvoices.length} totaling ${formatCurrency(totalOverdue)}`;

      if (overdueInvoices.length > 0) {
        invoiceBlock += `\n- Overdue Breakdown:`;
        const sorted = [...overdueInvoices].sort((a, b) => b.days_overdue - a.days_overdue).slice(0, 10);
        for (const inv of sorted) {
          invoiceBlock += `\n  - ${inv.customer_name}: ${formatCurrency(inv.amount)} (${inv.days_overdue} days overdue, inv #${inv.invoice_number || inv.id})`;
        }
      }

      // AR Aging buckets
      const current = openInvoices.filter(i => i.days_overdue === 0);
      const bucket1_30 = openInvoices.filter(i => i.days_overdue > 0 && i.days_overdue <= 30);
      const bucket31_60 = openInvoices.filter(i => i.days_overdue > 30 && i.days_overdue <= 60);
      const bucket61_90 = openInvoices.filter(i => i.days_overdue > 60 && i.days_overdue <= 90);
      const bucket90plus = openInvoices.filter(i => i.days_overdue > 90);

      invoiceBlock += `\n- AR Aging:
  - Current: ${formatCurrency(current.reduce((s, i) => s + i.amount, 0))} (${current.length} invoices)
  - 1-30 days: ${formatCurrency(bucket1_30.reduce((s, i) => s + i.amount, 0))} (${bucket1_30.length} invoices)
  - 31-60 days: ${formatCurrency(bucket31_60.reduce((s, i) => s + i.amount, 0))} (${bucket31_60.length} invoices)
  - 61-90 days: ${formatCurrency(bucket61_90.reduce((s, i) => s + i.amount, 0))} (${bucket61_90.length} invoices)
  - 90+ days: ${formatCurrency(bucket90plus.reduce((s, i) => s + i.amount, 0))} (${bucket90plus.length} invoices)`;

      sections.push(invoiceBlock);
    }

    // ── Cash Flow ──
    if (d.cash_flow && d.cash_flow.length > 0) {
      let cfBlock = `\n### Cash Flow (Monthly)`;
      for (const cf of d.cash_flow) {
        cfBlock += `\n- ${cf.month}: In ${formatCurrency(cf.inflow)} / Out ${formatCurrency(cf.outflow)} / Net ${cf.net >= 0 ? '+' : ''}${formatCurrency(cf.net)}`;
      }
      sections.push(cfBlock);
    }

    // ── Jobs from QBO ──
    if (d.jobs && d.jobs.length > 0) {
      let jobBlock = `\n### Jobs (from QuickBooks)`;
      for (const job of d.jobs) {
        const margin = job.revenue > 0 ? ((job.revenue - job.actual_cost) / job.revenue * 100) : 0;
        jobBlock += `\n- ${job.name}: ${formatPct(job.percent_complete)} complete, Revenue ${formatCurrency(job.revenue)}, Cost ${formatCurrency(job.actual_cost)}, Margin ${formatPct(margin)}, Status: ${job.status}`;
      }
      sections.push(jobBlock);
    }
  }

  // ── Integration Data (projects, deals, pipeline) ──
  if (ctx.integrations) {
    const intg = ctx.integrations;

    if (intg.connectedSources.length > 0) {
      sections.push(`\n## CONNECTED INTEGRATIONS
Sources: ${intg.connectedSources.join(', ')}`);
    }

    if (intg.metrics && intg.metrics.projectCount > 0) {
      const m = intg.metrics;
      const portfolioMargin = m.totalContractValue > 0
        ? ((m.totalContractValue - m.totalActualCost) / m.totalContractValue * 100)
        : 0;

      sections.push(`### Portfolio Summary (from field management)
- Active Projects: ${m.activeProjectCount} of ${m.projectCount} total
- Total Contract Value: ${formatCurrency(m.totalContractValue)}
- Total Cost to Date: ${formatCurrency(m.totalActualCost)}
- Portfolio Margin: ${formatPct(portfolioMargin)}
- Total AR: ${formatCurrency(m.totalAR)}
- Retainage Receivable: ${formatCurrency(m.totalRetainageReceivable)}
- Retainage Payable: ${formatCurrency(m.totalRetainagePayable)}
- Net Retainage Position: ${formatCurrency(m.totalRetainageReceivable - m.totalRetainagePayable)}`);
    }

    // ── Project detail ──
    if (intg.projects && intg.projects.length > 0) {
      let projBlock = `\n### Project Detail`;
      const activeProjects = intg.projects.filter(p => p.status === 'active');
      const projectsToShow = activeProjects.length > 0 ? activeProjects : intg.projects;
      for (const p of projectsToShow.slice(0, 20)) {
        const margin = p.contract_amount > 0
          ? ((p.contract_amount - p.actual_cost) / p.contract_amount * 100)
          : 0;
        const billingStatus = p.over_under_billing > 0 ? `Over-Billed ${formatCurrency(p.over_under_billing)}` : p.over_under_billing < 0 ? `Under-Billed ${formatCurrency(Math.abs(p.over_under_billing))}` : 'On Track';

        projBlock += `\n- ${p.name} [${p.source}]: Contract ${formatCurrency(p.contract_amount)}, Cost ${formatCurrency(p.actual_cost)}, ${formatPct(p.percent_complete)} complete, Margin ${formatPct(margin)}, Billing: ${billingStatus}`;
        if (p.retainage_receivable > 0 || p.retainage_payable > 0) {
          projBlock += ` | Retainage: Recv ${formatCurrency(p.retainage_receivable)}, Pay ${formatCurrency(p.retainage_payable)}`;
        }
      }
      sections.push(projBlock);
    }

    // ── Sales Pipeline ──
    if (intg.deals && intg.deals.length > 0) {
      const m = intg.metrics;
      let dealBlock = `\n### Sales Pipeline
- Total Pipeline: ${formatCurrency(m.totalPipeline)} (${m.dealCount} deals)
- Weighted Pipeline: ${formatCurrency(m.totalWeightedPipeline)}`;

      if (intg.dealsByStage) {
        dealBlock += `\n- By Stage:`;
        for (const [stage, data] of Object.entries(intg.dealsByStage)) {
          dealBlock += `\n  - ${stage}: ${data.count} deals, ${formatCurrency(data.amount)}`;
        }
      }

      dealBlock += `\n- Top Deals:`;
      for (const d of intg.deals.slice(0, 10)) {
        dealBlock += `\n  - ${d.name}: ${formatCurrency(d.amount)}, ${d.stage}, ${formatPct(d.probability)} probability`;
      }
      sections.push(dealBlock);
    }
  }

  if (sections.length === 0) {
    return `\n\n---\nNOTE: No financial data is currently loaded. The user has not yet connected QuickBooks or synced their data. Provide general e-commerce financial guidance and encourage them to connect QuickBooks and their sales channels for personalized analysis.`;
  }

  return `\n\n---\n# THIS USER'S LIVE FINANCIAL DATA\nThe following is real, live financial data from this brand's connected systems. Reference these EXACT numbers when answering questions. Do not make up numbers — use only what is provided below. If data is missing for a specific question, say so and suggest what data would be needed.\n\n${sections.join('\n')}`;
}
