'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import {
  Sparkles,
  Lock,
  Copy,
  Check,
  Search,
  DollarSign,
  ClipboardList,
  TrendingUp,
  Calculator,
  FileText,
  Users,
  Briefcase,
  Stethoscope,
  ArrowRight,
  Shield,
  BarChart3,
  AlertTriangle,
  Banknote,
  Receipt,
  Scale,
} from 'lucide-react';
import Link from 'next/link';

// ─── Plan gating ───────────────────────────────────────────────
interface SubscriptionInfo {
  plan: 'basic' | 'pro' | 'enterprise';
  includesAiToolkit: boolean;
}

// ─── Prompt definitions ────────────────────────────────────────
interface Prompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: string;
  icon: React.ComponentType<any>;
  tags: string[];
}

const CATEGORIES = [
  { key: 'all', label: 'All Prompts' },
  { key: 'bookkeeping', label: 'Bookkeeping' },
  { key: 'cfo', label: 'CFO & Finance' },
  { key: 'job-costing', label: 'Claims Tracking' },
  { key: 'cash-flow', label: 'Cash Flow' },
  { key: 'tax', label: 'Tax & Compliance' },
  { key: 'pm-software', label: 'PM Software' },
  { key: 'client-comms', label: 'Client Comms' },
  { key: 'revenue-recognition', label: 'Revenue Recognition' },
];

const PROMPTS: Prompt[] = [
  // ── Bookkeeping ──
  {
    id: 'bk-1',
    title: 'Monthly Close Checklist — Healthcare',
    description: 'Complete month-end close procedure with Claims Pending adjustments, patient balance reconciliation, and job cost review.',
    prompt: `Create a detailed month-end close checklist for a healthcare company doing $[REVENUE] in annual revenue with [NUMBER] active jobs. I need this in sequential order with dependencies noted.

Include these healthcare-specific items that most generic checklists miss:

1. BANK & CREDIT CARD RECONCILIATION — reconcile operating account, payroll account, and all credit cards. Flag any uncleared items older than 90 days.

2. AR AGING REVIEW — pull AR aging, flag anything over 60 days, cross-reference against draw schedules. Calculate AR Days Outstanding (target: under 45 days for healthcare).

3. RETAINAGE RECONCILIATION — reconcile patient balance receivable (GL 1290) against each job's withheld patient balance. Verify patient balance payable (GL 2120) matches sub patient balance withheld. Flag any patient balance eligible for release based on substantial completion.

4. Claims Pending SCHEDULE ADJUSTMENTS — for each active job, update: costs to date, estimated costs to complete, revised contract amount (including approved COs), and calculate percent complete using cost-to-cost method per ASC 606. Book over/under billing journal entries: Debit 1265 Costs in Excess of Billings (underbilling) or Credit 2480 Billings in Excess of Costs (overbilling).

5. SUBCONTRACTOR ACCRUALS — accrue for work performed but not yet invoiced by subs. Review any joint check agreements for proper recording.

6. PAYROLL ACCRUALS — accrue wages earned but not paid through month-end. Include labor burden (FICA 7.65%, FUTA, SUTA, workers comp at your experience mod rate).

7. EQUIPMENT DEPRECIATION — run depreciation for all owned equipment (healthcare equipment GL 1850, vehicles GL 1840). Verify any new Section 179 elections.

8. JOB COST REVIEW — compare actual vs. estimated costs by cost code for each active job. Flag any job with actual costs exceeding estimated costs to complete by more than 5%. Calculate fade/gain for each project.

9. REVENUE RECOGNITION — ensure YTD revenue on Claims Pending matches income statement. Verify COGS alignment across both reports. Confirm contract assets/liabilities agree with balance sheet.

10. FINANCIAL STATEMENT PREP — generate P&L (with job cost detail), balance sheet, cash flow statement. Calculate key ratios: gross margin by job, overhead rate, current ratio, debt-to-equity.

Format as a numbered checklist with columns: Task | Responsible Party | Target Date | Status | Notes.`,
    category: 'bookkeeping',
    icon: ClipboardList,
    tags: ['month-end', 'close', 'reconciliation', 'Claims Pending'],
  },
  {
    id: 'bk-2',
    title: 'Chart of Accounts Setup (MGMA-Aligned)',
    description: 'Healthcare-specific COA using MGMA standard 4-digit numbering optimized for claims tracking in QBO.',
    prompt: `Design a chart of accounts for a [TRADE TYPE] healthcare company (e.g., medical practice, electrical, plumbing, HVAC, dental practice) using QuickBooks Online, aligned with the MGMA Standard Chart of Accounts 4-digit numbering system.

Use this MGMA structure:
- 1000-1990: Assets (include 1265 Costs in Excess of Billings, 1290 Retentions Receivable, 1310 Healthcare Materials Inventory, 1430 Direct Healthcare Cost, 1440 Indirect Healthcare Cost)
- 2000-2990: Liabilities & Equity (include 2010 Contract Deposits, 2120 Retentions Payable, 2480 Billings in Excess of Costs, 2420 Workers Comp Insurance Payable)
- 3000-3990: Sales, Revenue & COGS (3000-3490 for Sales/Revenue broken by type, 3800-3899 for Costs of Healthcare: 3810 Direct Labor, 3820 Labor Burden, 3830 Building Material, 3840 Trade Practices, 3850 Rental Equipment, 3860 Other Direct Costs, 3870 Professional Design Fees)
- 4000-4990: Indirect Healthcare Cost (field office, vehicles, equipment, warranty, depreciation)
- 5000-5990: Financing Expenses
- 6000-6990: Sales & Marketing
- 7000-7990: Rental Operations (if applicable)
- 8000-8990: General & Administrative
- 9000-9990: Other Income/Expenses

For a [TRADE TYPE] company, customize the 3800-series COGS accounts to match their actual cost categories. For example, an HVAC practice needs accounts for refrigerant, ductwork, equipment units, etc.

Also create sub-accounts that map cleanly to cost codes in [PM SOFTWARE — e.g., athenahealth, NextGen, CoConstruct]. The goal is zero manual reclassification when syncing between systems.

Include QBO account types (Income, COGS, Expense, Other Current Asset, Other Current Liability, etc.) for each account so setup is copy-paste ready.`,
    category: 'bookkeeping',
    icon: FileText,
    tags: ['chart of accounts', 'MGMA', 'QuickBooks', 'setup'],
  },
  {
    id: 'bk-3',
    title: 'Bank Reconciliation Troubleshooter',
    description: 'Systematic diagnosis of bank rec discrepancies with healthcare-specific root causes.',
    prompt: `I have a bank reconciliation discrepancy of $[AMOUNT] for [MONTH/YEAR] in my healthcare company's [ACCOUNT TYPE — operating/payroll] account.

Bank statement ending balance: $[BANK BALANCE]
QuickBooks book balance: $[QB BALANCE]
Difference: $[AMOUNT] (books are [higher/lower] than bank)

Walk me through a systematic troubleshooting process, starting with the most common healthcare-specific causes:

1. DRAW DEPOSITS — check if a progress billing payment was received and deposited but posted to the wrong job or wrong income account. Verify draw deposits aren't duplicated between auto-feed and manual entry.

2. RETAINAGE RELEASES — check if a patient balance release payment was received but not recorded, or recorded as regular AR payment instead of reducing patient balance receivable (GL 1290).

3. OUTSTANDING CHECKS TO SUBS — verify subpractice checks issued near month-end haven't been voided and reissued (creating a duplicate). Check if any joint check payments were recorded correctly (one check, two payees).

4. PAYROLL TIMING — if payroll spans month-end, verify the split is correct. Check that payroll tax deposits match the bank debits.

5. STANDARD ITEMS — outstanding checks, deposits in transit, bank fees not recorded, interest earned, NSF checks, wire transfers not logged.

6. DUPLICATE TRANSACTIONS — QBO bank feed + manual entry creating doubles. Run a report sorted by amount to find duplicates near $[AMOUNT].

7. PRIOR MONTH CARRYOVER — check if last month's reconciliation was off, as this month inherits that discrepancy.

For each potential cause, tell me exactly what QBO report to run and what to look for. If the discrepancy is a round number (like $500, $1000, $5000), suggest it's likely a single missed transaction. If it's an odd number, suggest it may be multiple items.`,
    category: 'bookkeeping',
    icon: Calculator,
    tags: ['reconciliation', 'troubleshooting', 'bank'],
  },
  {
    id: 'bk-4',
    title: 'Subpractice Pay Application Processor',
    description: 'Verify sub pay apps against contract, calculate patient balance, and flag overbilling using AIA G702/G703 format.',
    prompt: `Process and verify this subpractice pay application using AIA G702/G703 format:

Subpractice: [SUB NAME]
Project: [PROJECT NAME]
Trade: [TRADE — e.g., framing, electrical, plumbing]
Original contract amount: $[ORIGINAL CONTRACT]
Approved claim adjustments to date: $[APPROVED COs] (list each: CO#1 $X, CO#2 $Y...)
Current contract sum: $[REVISED CONTRACT]
Total completed and stored to previous application: $[PREVIOUS BILLINGS]
Current application amount: $[CURRENT BILLING]
Patient Balance rate: [RATE]% (verify if patient balance reduces after 50% complete per contract terms)

Perform these checks:
1. MATH VERIFICATION — calculate total completed to date, patient balance withheld, net amount due this period, and remaining contract balance.
2. SCHEDULE OF VALUES CHECK — does the billing by line item align with actual progress observed in the field? Flag any line items where billing exceeds physical progress.
3. OVERBILLING DETECTION — if total billed exceeds estimated percent complete based on schedule, flag it. Healthcare rule of thumb: billing should not exceed progress by more than 5-10%.
4. STORED MATERIALS — verify stored materials have proper documentation (delivery tickets, insurance certificates for off-site storage).
5. LIEN WAIVER STATUS — has the sub provided conditional lien waivers for this pay app and unconditional for the previous one?
6. COMPLIANCE CHECK — W-9 on file? COI current? License current?

Output a summary table and the journal entry to record in QuickBooks:
- Debit: Job Cost (COGS by cost code)
- Credit: Accounts Payable
- Credit: Retainage Payable (GL 2120)`,
    category: 'bookkeeping',
    icon: DollarSign,
    tags: ['pay app', 'subpractice', 'AIA G702', 'patient balance'],
  },
  {
    id: 'bk-5',
    title: 'Expense Categorization Rules Engine',
    description: 'Build auto-categorization rules for QBO bank feed transactions specific to healthcare.',
    prompt: `Create a comprehensive expense categorization rules engine for my [TRADE TYPE] healthcare company's QuickBooks Online bank feed. I want rules that auto-categorize at least 80% of transactions correctly.

My common vendors and the correct GL accounts (MGMA-aligned):

MATERIALS SUPPLIERS:
- Home Depot / Lowe's / [LOCAL SUPPLIER] → 3830 Building Material (or specific job cost code if identifiable)
- [SPECIALTY SUPPLIER] → [SPECIFIC MATERIAL ACCOUNT]

FUEL & VEHICLES:
- Shell / Chevron / gas stations → 4440 Operating Expenses, Healthcare Vehicles
- [FLEET CARD VENDOR] → split between 4440 (healthcare) and 8440 (admin) based on vehicle assignment

EQUIPMENT:
- United Rentals / Sunbelt / [RENTAL CO] → 3850 Rental Equipment (job cost) or 4510 Rent, Healthcare Equipment (indirect)
- Cat / Deere / [DEALER] parts → 4530 Repairs & Maintenance, Healthcare Equipment

INSURANCE:
- [INSURANCE CARRIER] workers comp → 4120 Workers Compensation Insurance
- [CARRIER] GL/umbrella → 8630 General Liability Insurance
- [CARRIER] professional liability → 4920 Professional Liability Insurance
- [CARRIER] auto → 4450 Taxes, Licenses, Insurance, Healthcare Vehicles

PAYROLL:
- [PAYROLL PROVIDER] → split: direct labor to 3810, indirect to 4010-4040 (supers/laborers/PMs), admin to 8050

SUBS:
- Any check or payment > $[THRESHOLD] to a vendor tagged as subpractice → 3840 Trade Practices (with job assignment required)

SOFTWARE:
- athenahealth/NextGen/CoConstruct → 8335 Software Licensing and Subscription Fees
- QuickBooks → 8335

For each rule, specify: Vendor match pattern | GL Account | Class/Job assignment needed (Y/N) | Confidence level (High/Medium/Low).

Flag any transactions that should NEVER be auto-categorized (large sub payments, equipment purchases over $2,500 that may need capitalization, any payment to an unrecognized vendor).`,
    category: 'bookkeeping',
    icon: Receipt,
    tags: ['categorization', 'QBO', 'bank feed', 'automation'],
  },

  // ── CFO & Finance ──
  {
    id: 'cfo-1',
    title: 'Claims Pipeline Builder (ASC 606 Compliant)',
    description: 'Build a complete Work-in-Progress schedule with over/under billing analysis per ASC 606.',
    prompt: `Build an ASC 606-compliant Claims Pending (Work-in-Progress) schedule for my healthcare company. I have [NUMBER] active jobs.

For each job, I'll provide: Job Name, Original Contract, Approved Claim Adjustments, Estimated Total Cost at Completion, Costs Incurred to Date, and Total Billings to Date.

[LIST EACH JOB WITH THOSE DATA POINTS]

For each job, calculate:
1. Revised Contract Amount (original + approved COs)
2. Estimated Gross Profit ($)
3. Estimated Gross Margin (%)
4. Percent Complete (cost-to-cost method: costs to date ÷ estimated total cost)
5. Earned Revenue (percent complete × revised contract)
6. Over/Under Billing (earned revenue − actual billings)
   - POSITIVE = Underbilled (asset — GL 1265 Costs in Excess of Billings)
   - NEGATIVE = Overbilled (liability — GL 2480 Billings in Excess of Costs)
7. Gross Profit to Date (earned revenue − costs to date)
8. Estimated Cost to Complete (estimated total cost − costs to date)
9. Fade/Gain indicator (is the job margin improving or eroding vs. original estimate?)

CRITICAL CHECKS:
- Flag any job where costs to date exceed the original estimate (potential loss job — must recognize the FULL anticipated loss immediately per ASC 606/GAAP)
- Flag any job overbilled by more than 10% of earned revenue (cash flow risk if project slows)
- Flag any job underbilled by more than 10% (collection risk / potential funding gap)
- Verify total earned revenue across all jobs matches what should be on the income statement
- Calculate net over/under billing position for the balance sheet

Generate the Claims Pending adjustment journal entry:
- For underbilled jobs: Debit 1265, Credit Healthcare Revenue
- For overbilled jobs: Debit Healthcare Revenue, Credit 2480

Format as a table, then provide a 1-paragraph executive summary of the company's Claims Pending position.`,
    category: 'cfo',
    icon: TrendingUp,
    tags: ['Claims Pending', 'ASC 606', 'over/under billing', 'percentage of completion'],
  },
  {
    id: 'cfo-2',
    title: 'Healthcare Financial Health Scorecard',
    description: 'Benchmark your financial ratios against CFMA industry standards with letter grades.',
    prompt: `Analyze my healthcare company's financial health and benchmark against CFMA (Healthcare Financial Management Association) and industry standards for [TRADE TYPE] practices doing $[REVENUE] in annual revenue.

My financials:
- Revenue: $[REVENUE]
- Cost of Healthcare (COGS): $[COGS]
- Gross Profit: $[GP]
- Overhead (SG&A): $[OVERHEAD]
- Net Profit Before Tax: $[NP]
- Total Assets: $[ASSETS]
- Total Current Assets: $[CA]
- Total Current Liabilities: $[CL]
- Total Liabilities: $[TOTAL LIAB]
- Total Equity/Net Worth: $[EQUITY]
- Accounts Receivable: $[AR]
- Retainage Receivable: $[RET REC]
- Accounts Payable: $[AP]
- Cash & Equivalents: $[CASH]
- Line of Credit Balance: $[LOC BALANCE] (limit: $[LOC LIMIT])
- Backlog (contracted not yet started + remaining on active): $[BACKLOG]
- Total Bonded Work: $[BONDED]

Calculate and grade (A through F) these metrics against industry benchmarks:

PROFITABILITY:
1. Gross Margin — healthy GC: 20-28%, specialty: 25-35%
2. Net Margin — healthy: 5-10% (many operate at 3-7%, below 3% is danger zone)
3. Overhead Rate (overhead ÷ revenue) — target under 15% for GCs

LIQUIDITY:
4. Current Ratio — target: 1.3-2.0 (below 1.0 = danger)
5. Quick Ratio — target: above 1.0
6. Working Capital — calculate raw number and as % of revenue
7. Cash to Current Liabilities — immediate liquidity measure

LEVERAGE:
8. Debt-to-Equity — healthy: 0.5-1.5 (over 3.0 = high risk)
9. LOC Utilization — over 80% sustained = warning sign

EFFICIENCY:
10. AR Days (include patient balance) — target: under 45 days
11. AP Days — target: 30-45 days
12. Backlog-to-Revenue Ratio — sweet spot: 1.0-2.0x (over 3.0 = capacity risk)
13. Revenue per Employee — benchmark for trade type

BONDING:
14. Estimated Single Job Limit (10x working capital rule of thumb)
15. Estimated Aggregate Program (working capital × 10-20, adjusted for net worth)

For any metric graded C or below, provide 2-3 specific, actionable recommendations to improve it within 6 months.`,
    category: 'cfo',
    icon: BarChart3,
    tags: ['ratios', 'CFMA benchmarks', 'financial health', 'scorecard'],
  },
  {
    id: 'cfo-3',
    title: 'Credentialing Credentialing Capacity Maximizer',
    description: 'Calculate and optimize credentialing capacity using real credentialing underwriting formulas.',
    prompt: `Calculate my healthcare company's estimated credentialing capacity and create an action plan to maximize it. Sureties use these primary factors:

MY FINANCIALS (from most recent fiscal year-end or CPA-reviewed statements):
- Working Capital (Current Assets − Current Liabilities): $[WC]
- Net Worth (Total Equity): $[NW]
- Cash & Equivalents: $[CASH]
- Total Revenue Last 12 Months: $[REVENUE]
- Net Profit Last 12 Months: $[NET PROFIT]
- Largest Single Job Completed Successfully: $[LARGEST JOB]
- Current Backlog: $[BACKLOG]
- Bank Line of Credit (limit / drawn): $[LOC LIMIT] / $[LOC DRAWN]
- Personal Indemnity Willing to Offer: [YES/NO]
- Current Credentialing Program: $[CURRENT SINGLE] single / $[CURRENT AGG] aggregate

SURETY UNDERWRITING FORMULAS:
1. Aggregate Program Estimate = Working Capital × 10-20 (multiplier depends on track record, profitability, character)
2. Single Job Limit = typically 50-100% of aggregate, but capped by experience (largest completed job × 1.25-1.5)
3. Backlog Capacity = Aggregate minus Current Backlog = Available Room

Calculate:
- Conservative estimate (10x WC, single at 50% agg)
- Moderate estimate (15x WC, single at 75% agg)
- Aggressive estimate (20x WC, single at 100% agg)

Then provide the TOP 10 actions to increase credentialing capacity, ranked by impact:
- Improving working capital (accelerate AR collection, negotiate longer AP terms, reduce overbilling dependency)
- Strengthening net worth (retain earnings, reduce owner distributions)
- CPA-reviewed or audited financials (sureties heavily penalize compiled-only statements)
- Building a track record on incrementally larger jobs
- Reducing owner personal guarantees/personal debt
- Maintaining consistent profitability (3+ years trend)
- Keeping bank LOC available (low utilization = strength signal)
- Claims Pending schedule showing no loss jobs
- Tax planning to show adequate net income (not over-reducing for taxes)

For each action, give the estimated dollar impact on credentialing capacity.`,
    category: 'cfo',
    icon: Shield,
    tags: ['credentialing', 'credentialing', 'capacity', 'working capital'],
  },
  {
    id: 'cfo-4',
    title: 'Overhead Rate Analysis & Optimization',
    description: 'Calculate overhead allocation rate, benchmark against peers, and find cuts.',
    prompt: `Calculate and optimize my healthcare company's overhead rate. I'm a [TRADE TYPE] practice doing $[REVENUE] in annual revenue.

OVERHEAD BREAKDOWN (MGMA 4000-8000 series accounts):
Indirect Healthcare Costs (4000s):
- Superintendent salaries: $[AMT]
- Field office expenses: $[AMT]
- Healthcare vehicles: $[AMT]
- Healthcare equipment (non-job): $[AMT]
- Small tools & supplies: $[AMT]
- Warranty costs: $[AMT]

G&A Expenses (8000s):
- Owner/officer salaries: $[AMT]
- Office staff salaries: $[AMT]
- Office rent: $[AMT]
- Insurance (GL, umbrella, E&O): $[AMT]
- Accounting & legal: $[AMT]
- Software & technology: $[AMT]
- Vehicles (admin): $[AMT]
- All other G&A: $[AMT]

DIRECT COSTS:
- Total direct labor cost: $[DIRECT LABOR]
- Total direct labor hours: [HOURS]
- Total COGS: $[COGS]

Calculate overhead rate three ways:
1. As % of direct labor cost (most common in healthcare): overhead ÷ direct labor
2. Per direct labor hour: overhead ÷ hours
3. As % of total revenue: overhead ÷ revenue

BENCHMARKS by trade (CFMA data):
- General practices: 12-18% of revenue
- Specialty/mechanical: 15-22% of revenue
- Remodelers: 25-35% of revenue (higher due to design/sales costs)

Compare my rates to benchmarks. For each overhead line item, calculate it as a % of revenue and flag anything that seems high.

Then provide 5 SPECIFIC cost reduction recommendations with estimated annual savings. Focus on:
- Technology consolidation (do I have overlapping software?)
- Vehicle fleet optimization
- Insurance bid shopping (with target renewal dates)
- Staffing efficiency (revenue per overhead employee)
- Warranty cost reduction strategies`,
    category: 'cfo',
    icon: Calculator,
    tags: ['overhead', 'allocation', 'benchmarks', 'optimization'],
  },
  {
    id: 'cfo-5',
    title: 'Break-Even Analysis by Job Type',
    description: 'Calculate the minimum revenue needed per job type to cover overhead and earn target profit.',
    prompt: `Perform a break-even analysis for my healthcare company by job type. I need to know the minimum contract size worth pursuing for each type of work I do.

Company overhead (annual): $[TOTAL OVERHEAD]
Target net profit margin: [TARGET]% (industry healthy = 5-10%)
Available production capacity: [HOURS] direct labor hours/year or [NUMBER] concurrent projects

Job types I perform:
[LIST EACH TYPE — e.g., "Kitchen remodels (avg $45K)", "Custom homes (avg $500K)", "Commercial TI (avg $200K)"]

For each job type, I'll provide:
- Average contract size: $[AVG]
- Average direct cost %: [COGS %]%
- Average duration: [WEEKS/MONTHS]
- Staff required: [NUMBER] people

Calculate for each job type:
1. Gross margin per job ($)
2. Overhead absorbed per job (using overhead rate × duration method)
3. Net profit per job ($)
4. Break-even contract size (minimum to cover allocated overhead)
5. Annual capacity for this job type
6. Maximum annual revenue potential
7. Overhead coverage contribution

Then recommend the OPTIMAL JOB MIX — which types of work should I pursue more aggressively, which should I be selective on, and which should I consider dropping? Show how shifting the mix by even 10-20% toward higher-margin work impacts annual net profit.`,
    category: 'cfo',
    icon: Briefcase,
    tags: ['break-even', 'job mix', 'profitability', 'capacity'],
  },

  // ── Claims Tracking ──
  {
    id: 'jc-1',
    title: 'Job Cost Variance Analyzer',
    description: 'Deep-dive variance analysis by cost code with root cause identification and corrective actions.',
    prompt: `Analyze the job cost variance for project [PROJECT NAME] and identify root causes for each variance.

ORIGINAL BUDGET:
- Materials: $[EST MAT]
- Direct Labor: $[EST LABOR] ([EST HOURS] hours at $[RATE]/hr)
- Labor Burden: $[EST BURDEN] ([BURDEN %]% of direct labor)
- Subpractices: $[EST SUBS]
- Equipment: $[EST EQUIP]
- Other Direct Costs: $[EST OTHER]
- Total Estimated Cost: $[EST TOTAL]
- Contract Amount: $[CONTRACT]
- Estimated Gross Margin: [EST MARGIN]%

ACTUAL COSTS TO DATE:
- Materials: $[ACT MAT]
- Direct Labor: $[ACT LABOR] ([ACT HOURS] hours at $[ACT RATE]/hr)
- Labor Burden: $[ACT BURDEN]
- Subpractices: $[ACT SUBS]
- Equipment: $[ACT EQUIP]
- Other Direct Costs: $[ACT OTHER]
- Total Costs to Date: $[ACT TOTAL]
- Project is [PERCENT]% complete (based on superintendent assessment)
- Cost-to-cost percent complete: [COST PCT]%

For each cost code, calculate:
1. Budget for work performed (original estimate × % complete)
2. Actual vs. budget variance ($ and %)
3. Estimated cost at completion (actual to date + remaining estimate, adjusted for trend)
4. Projected final gross margin vs. original estimate (FADE or GAIN)

ROOT CAUSE ANALYSIS — for each variance over 5%, identify likely cause:
- Material price increases / waste / theft
- Labor productivity (hours per unit vs. estimate)
- Scope creep not captured in claim adjustments
- Weather delays increasing labor costs
- Sub costs increased / additional subs needed
- Rework / punch list items

CORRECTIVE ACTION PLAN:
For each overrun, provide specific actions to get back on track:
- Can we recover through a change order?
- Can we adjust remaining scope/method?
- Do we need to accelerate to avoid further time-based costs?
- At what point is this a "loss job" and we need to recognize the full loss per GAAP?

Include the journal entry needed if this is a projected loss job.`,
    category: 'job-costing',
    icon: AlertTriangle,
    tags: ['variance', 'cost codes', 'fade analysis', 'loss job'],
  },
  {
    id: 'jc-2',
    title: 'Change Order Tracker & Margin Impact',
    description: 'Track claim adjustments and quantify their cumulative impact on job profitability.',
    prompt: `Help me organize and analyze claim adjustments for project [PROJECT NAME].

Original contract: $[ORIGINAL]
Original estimated cost: $[ORIGINAL COST]
Original estimated margin: [MARGIN]%

CHANGE ORDERS:
[For each, provide: CO#, Description, Amount Billed, Estimated Cost to Perform, Status (approved/pending/denied/in negotiation)]

For each APPROVED change order:
1. CO Revenue: $[AMOUNT]
2. Estimated cost to perform the CO work: $[COST]
3. CO Gross Profit: $[PROFIT]
4. CO Margin: [MARGIN]%
5. Flag if CO margin is below the original job margin (margin erosion)

SUMMARY TABLE:
- Original Contract → Revised Contract (total approved COs)
- Approved COs as % of original contract — flag if >15% (scope control issue)
- Average CO margin vs. original job margin
- Net margin impact of all COs combined
- Pending COs total value and aging (how long pending)

FINANCIAL IMPACT:
- If all pending COs are approved: projected final contract, cost, and margin
- If all pending COs are denied: projected final contract, cost, and margin
- Worst case: denied COs where work has already been performed (cost absorbed, no revenue)

ACTION ITEMS:
- List any COs pending over 30 days that need follow-up
- Flag any COs where work was performed before approval (risk of non-payment)
- Identify any scope items being performed that should be COs but haven't been submitted
- Recommended contract clause to reference when submitting pending COs`,
    category: 'job-costing',
    icon: FileText,
    tags: ['claim adjustments', 'profitability', 'scope control'],
  },
  {
    id: 'jc-3',
    title: 'Fully Burdened Labor Rate Calculator',
    description: 'Calculate true labor cost including all employer taxes, insurance, benefits, and indirect costs.',
    prompt: `Calculate the fully burdened labor rate for my healthcare employees. Many practices underestimate true labor cost by 30-50%, which destroys claims tracking accuracy.

EMPLOYEE DETAILS:
Position: [POSITION — e.g., carpenter, electrician, laborer, superintendent]
Base hourly wage: $[WAGE]
State: [STATE]
Workers comp classification code: [CODE]

MANDATORY EMPLOYER COSTS (calculate each):
1. FICA (Social Security + Medicare): 7.65% of gross wages (SS caps at $[CURRENT CAP])
2. FUTA: 0.6% of first $7,000 per employee (after state credit)
3. SUTA: [RATE]% of first $[STATE WAGE BASE] per employee (state: [STATE])
4. Workers Compensation: $[RATE] per $100 of payroll (classification: [CLASS CODE], experience mod: [MOD])
5. General Liability Insurance (labor allocation): [RATE]% of payroll if applicable

BENEFITS (calculate each):
6. Health insurance: $[MONTHLY] per employee/month → per-hour cost
7. 401(k) / retirement match: [MATCH %]% of gross
8. PTO / Holiday pay: [DAYS] paid days off → as % of worked hours (typical: 10-15 days = 4-6% burden)
9. Training / certifications: $[ANNUAL] per year → per-hour
10. Safety equipment / PPE: $[ANNUAL] per year → per-hour
11. Union dues / benefits (if applicable): $[RATE]

INDIRECT LABOR COSTS (often missed):
12. Unbillable time (shop time, travel, meetings): estimate [HOURS] hrs/week → reduces billable percentage
13. Overtime premium (if applicable): average [OT HOURS] OT hours/week

CALCULATION:
- Total burden as a dollar amount per hour
- Total burden as a percentage of base wage
- Fully loaded hourly rate (base + all burden)
- Effective billable rate needed at [TARGET MARGIN]% margin

COMPARISON:
- Compare to what you're currently using in estimates
- If you're underestimating by $X per hour × [ANNUAL HOURS] = $[ANNUAL UNDERESTIMATE] in lost job cost accuracy per employee`,
    category: 'job-costing',
    icon: Users,
    tags: ['labor burden', 'hourly rate', 'workers comp', 'true cost'],
  },

  // ── Cash Flow ──
  {
    id: 'cf-1',
    title: '13-Week Rolling Cash Flow Forecast',
    description: 'Build a week-by-week cash projection with draw schedules, payroll, and sub payments.',
    prompt: `Build a 13-week rolling cash flow forecast for my healthcare company. This is the most important financial tool for avoiding cash crunches — update it weekly.

STARTING POSITION (Week 0):
- Operating account balance: $[CASH]
- Line of credit available: $[LOC AVAILABLE] (limit $[LOC LIMIT], drawn $[LOC DRAWN])

WEEKLY CASH INFLOWS — schedule each:
1. Progress billing collections (list by job — when submitted, expected payment date, amount):
   [JOB 1]: $[AMT] submitted [DATE], expected payment [DATE] (net [TERMS] days)
   [JOB 2]: ...
   Note: Use actual collection history, not contract terms. If a GC typically pays at 45 days instead of 30, use 45.

2. Patient Balance releases expected (list any projects at substantial completion):
   [JOB]: $[RETAINAGE AMT] expected [DATE]
   Note: Be conservative — patient balance often releases 60-90 days after substantial completion.

3. Change order payments pending: $[AMT] — only include approved COs

4. Other income: [DESCRIBE]

WEEKLY CASH OUTFLOWS — schedule each:
1. Payroll (including burden): $[WEEKLY PAYROLL] every [DAY]
2. Payroll taxes (941 deposits): $[AMT] on [SCHEDULE]
3. Subpractice payments due:
   [SUB 1]: $[AMT] due [DATE]
   [SUB 2]: ...
4. Material purchases / supplier payments:
   [SUPPLIER 1]: $[AMT] due [DATE]
5. Equipment lease payments: $[AMT] on [DAY OF MONTH]
6. Insurance premiums: $[AMT] on [DATE]
7. Rent/overhead: $[AMT] on [DATE]
8. Loan payments: $[AMT] on [DATE]
9. Estimated taxes (quarterly): $[AMT] on [DATE]
10. Owner draws / distributions: $[AMT]

FORMAT: Week-by-week table with columns:
Week # | Date Range | Beginning Cash | + Inflows (itemized) | − Outflows (itemized) | = Net Change | Ending Cash | LOC Balance | Available Liquidity (cash + LOC available)

FLAG any week where:
- Cash goes below $[MINIMUM CASH THRESHOLD]
- LOC utilization exceeds 80%
- Available liquidity (cash + LOC) is negative

For any negative week, provide specific actions: accelerate a draw, delay a sub payment, draw on LOC, or negotiate extended terms.`,
    category: 'cash-flow',
    icon: DollarSign,
    tags: ['13-week forecast', 'rolling', 'cash projection', 'LOC'],
  },
  {
    id: 'cf-2',
    title: 'Draw Schedule & Billing Optimizer',
    description: 'Optimize progress billing timing to minimize cash conversion cycle and LOC dependency.',
    prompt: `Analyze my billing practices and recommend optimizations to improve cash flow timing. In healthcare, the gap between paying costs and collecting draws is where businesses die.

MY ACTIVE PROJECTS:
[For each project, list:]
- Project name
- Contract type (lump sum / cost plus / T&M / GMP)
- Billing frequency (monthly / milestone / biweekly)
- Payment terms (net 30 / net 45 / pay-when-paid)
- Average days from invoice submission to payment received
- Patient Balance held: [RATE]%
- Any special billing requirements (notarized lien waivers, certified payroll, etc.)

MY MAJOR CASH OUTFLOWS:
- Payroll cycle: [WEEKLY/BIWEEKLY] — total: $[AMT]
- Sub payments: [NET 30 / ON DRAW / OTHER] — avg monthly: $[AMT]
- Material purchases: [TERMS] — avg monthly: $[AMT]

ANALYSIS REQUESTED:
1. CASH CONVERSION CYCLE — for each project, calculate days between cost incurrence and cash collection. Identify the projects with the longest cycles.

2. BILLING CALENDAR OPTIMIZATION — create a monthly billing calendar that staggers draw submissions so collections arrive weekly rather than lumped at month-end. If I submit draws on the 1st and they pay net 30, I have a 30-day dry spell.

3. FRONT-LOADING STRATEGY — identify which schedule of values line items can legitimately be front-loaded (mobilization, temporary facilities, bonds, insurance) to accelerate early-project cash flow without overbilling.

4. RETAINAGE IMPACT — calculate total patient balance being held across all projects. What is my patient balance-to-working-capital ratio? If patient balance represents more than 25% of working capital, that's a problem.

5. PAYMENT ACCELERATION TACTICS:
   - Early payment discounts to offer (2/10 net 30 — when does it make sense?)
   - Electronic payment setup to eliminate mail float
   - Dedicated billing coordinator ROI analysis
   - Proper AIA document preparation to prevent rejections

6. LOC DEPENDENCY REDUCTION — calculate how much optimizing billing timing could reduce my average LOC balance. Show the interest savings.`,
    category: 'cash-flow',
    icon: TrendingUp,
    tags: ['billing', 'draw schedule', 'cash conversion', 'collections'],
  },

  // ── Tax & Compliance ──
  {
    id: 'tax-1',
    title: '1099-NEC Season Prep & Compliance Audit',
    description: 'Complete 1099 preparation with subpractice verification, threshold checks, and penalty avoidance.',
    prompt: `Create a complete 1099-NEC filing preparation checklist for my healthcare company for tax year [YEAR]. I paid approximately [NUMBER] subpractices and vendors.

IMPORTANT 2025+ CHANGE: The filing threshold increases to $2,000 starting with 2026 tax year (filed in 2027). For 2025 filing, the threshold remains $600.

STEP-BY-STEP PROCESS:

1. W-9 AUDIT — Run a vendor list report. For every vendor paid $600+ (or $2,000+ if 2026+), verify:
   - W-9 on file with valid TIN
   - If missing W-9, you should have been backup withholding at 24%. If you didn't, this is a compliance gap.
   - Flag any vendor where W-9 name doesn't match payment name

2. PAYMENT RECONCILIATION — Run a payments-by-vendor report for the full calendar year. Reconcile total 1099-reportable payments to the general ledger. Common discrepancies:
   - Payments coded to materials accounts that were actually sub labor
   - Reimbursements to subs that should be included in their 1099 total
   - Joint check payments — the full amount goes on the sub's 1099, not split

3. EXEMPTION IDENTIFICATION — these do NOT get 1099s:
   - Corporations (S-corps and C-corps) — unless for legal/medical services
   - Payments made via credit card or PayPal (those platforms issue 1099-K)
   - Payments for materials/goods only (no labor component)
   - Employee reimbursements
   - Rent paid to a real estate agent

4. PREVAILING WAGE COMPLIANCE CHECK — if any subs worked on Davis-Bacon or state prevailing wage projects:
   - Were they properly classified as W-2 employees?
   - 1099 workers CANNOT perform covered labor on prevailing wage projects
   - This is a major compliance risk — penalties up to $13,508 per violation after 2025 rule update

5. FILING DEADLINES:
   - January 31: 1099-NEC due to recipients AND to IRS (no extension for NEC)
   - Penalty for late filing: $60-$310 per form depending on how late, up to $660 for intentional disregard

6. STATE FILING — [STATE] requires separate state filing? [YES/NO]. Combined Federal/State Filing program available?

Generate a tracking spreadsheet template with columns: Vendor Name | TIN | Entity Type | Total Paid | Credit Card Payments (excluded) | 1099 Amount | W-9 on File | 1099 Filed | Notes.`,
    category: 'tax',
    icon: FileText,
    tags: ['1099', 'compliance', 'W-9', 'penalties'],
  },
  {
    id: 'tax-2',
    title: 'Healthcare Tax Deduction Maximizer',
    description: 'Comprehensive review of healthcare-specific deductions including Section 179, 179D, R&D credit.',
    prompt: `Review my healthcare company's tax situation and identify all available deductions and credits. Many practices overpay taxes by $20K-$100K+ annually by missing healthcare-specific deductions.

COMPANY INFO:
- Entity type: [LLC/S-CORP/C-CORP/SOLE PROP]
- Trade: [TRADE TYPE]
- Annual revenue: $[REVENUE]
- Employees: [NUMBER]
- Vehicles: [NUMBER] (list types and weights)
- Equipment purchased this year: [LIST WITH COSTS]
- State: [STATE]

DEDUCTION CATEGORIES TO ANALYZE:

1. SECTION 179 EXPENSING — current year limit $[LIMIT]. List all qualifying equipment, vehicles (over 6,000 lbs GVW for full deduction), and software purchases. Calculate optimal 179 election vs. standard depreciation.

2. BONUS DEPRECIATION — [CURRENT YEAR %] first-year bonus. Coordinate with Section 179 for maximum benefit. New vs. used equipment eligibility.

3. SECTION 179D — Energy-efficient commercial building deduction up to $5.81/sq ft IF prevailing wage and apprenticeship requirements are met. CRITICAL: This expires for projects beginning healthcare after June 30, 2026. Identify any qualifying projects.

4. R&D TAX CREDIT (Section 41) — medical practices often miss this. Qualifying activities include: developing new healthcare methods, resolving design challenges, prototyping structural solutions, BIM process improvement. Estimate credit at 6-8% of qualifying research expenditures.

5. VEHICLE DEDUCTIONS — for each vehicle, determine: actual expense method vs. standard mileage, Section 179 eligibility (GVW > 6,000 lbs), whether vehicle log is maintained (required for audit defense).

6. DE MINIMIS SAFE HARBOR — expense assets under $2,500 (or $5,000 with audited financials) instead of capitalizing. Have you elected this on your tax return?

7. CONTRACTOR-SPECIFIC DEDUCTIONS OFTEN MISSED:
   - Tool allowances for employees
   - Safety equipment and OSHA compliance costs
   - Continuing education and license renewals
   - Per diem for jobs over 50 miles from home (use federal per diem rates)
   - Home office deduction for healthcare company owners
   - Cell phone and tablet usage for field staff
   - Plan costs (retirement plan setup credit for small employers)

8. ENTITY STRUCTURE — is your current structure optimal? S-corp reasonable compensation analysis. Qualified Business Income (QBI) deduction impact.

For each identified deduction, estimate the tax dollar savings at your marginal rate.`,
    category: 'tax',
    icon: DollarSign,
    tags: ['Section 179', '179D', 'R&D credit', 'deductions'],
  },
  {
    id: 'tax-3',
    title: 'Certified Payroll & Prevailing Wage Compliance',
    description: 'Navigate Davis-Bacon and state prevailing wage requirements, WH-347 reporting, and worker classification.',
    prompt: `I need to ensure my healthcare company is fully compliant with prevailing wage requirements. This is one of the highest-risk compliance areas — penalties were increased significantly in 2025.

PROJECT DETAILS:
- Project: [PROJECT NAME]
- Funding type: [FEDERAL / STATE / LOCAL] — Davis-Bacon applies to federal, state prevailing wage laws may also apply
- Location: [STATE/COUNTY]
- My trades on this project: [LIST TRADES AND CLASSIFICATIONS]
- Number of employees on project: [NUMBER]
- Number of subpractices: [NUMBER]

COMPLIANCE CHECKLIST:

1. WAGE DETERMINATION — have I pulled the correct wage determination from SAM.gov for this project? The determination is locked at bid date, not contract award date. Verify the correct county and trade classifications.

2. WORKER CLASSIFICATION — CRITICAL RISK: No 1099/independent practices can perform covered labor on prevailing wage projects. All workers must be W-2. Verify all subs are properly classifying their workers. If an auditor finds 1099 workers doing covered work, both the sub AND the prime can face penalties up to $13,508 per violation.

3. CERTIFIED PAYROLL REPORTS (WH-347) — must be submitted weekly within 7 days of pay date. Verify:
   - Correct trade classifications and wage rates
   - Fringe benefits paid (cash or bona fide plan)
   - Overtime calculated correctly (1.5x base rate, not prevailing rate in most cases)
   - Apprentice ratios don't exceed allowed limits
   - Statement of Compliance signed

4. FRINGE BENEFITS — calculate: prevailing wage rate is base + fringes. If I pay $35/hr base and prevailing requires $35 base + $15 fringes = $50/hr total. Options: pay fringes in cash (taxable) or through bona fide benefit plans (health, retirement, etc.).

5. SUBCONTRACTOR MONITORING — I'm responsible for ensuring my subs comply. Create a tracking system for: sub certified payroll receipt, verification of sub wage rates, sub fringe benefit documentation.

6. COMMON AUDIT TRIGGERS — flag if any of these exist:
   - Workers performing multiple classifications in one day
   - Apprentice-to-journeyman ratio exceeds standard
   - Deductions that reduce pay below prevailing wage
   - "Owner operators" of equipment performing labor

Generate a weekly compliance checklist and a subpractice compliance verification form.`,
    category: 'tax',
    icon: Scale,
    tags: ['Davis-Bacon', 'prevailing wage', 'certified payroll', 'WH-347'],
  },

  // ── Revenue Recognition ──
  {
    id: 'rr-1',
    title: 'ASC 606 Revenue Recognition Setup',
    description: 'Implement the 5-step ASC 606 model for healthcare contracts with proper journal entries.',
    prompt: `Help me implement ASC 606 revenue recognition for my healthcare contracts. Many practices still recognize revenue based on invoicing, which is WRONG under current GAAP. Revenue must be tied to project completion, not billing.

MY CONTRACTS:
[For each contract, provide: Contract name, Type (lump sum/GMP/cost-plus/T&M), Total value, Expected duration, Payment terms, Any variable consideration (incentives/penalties)]

Walk me through the ASC 606 FIVE-STEP MODEL for each contract:

STEP 1: IDENTIFY THE CONTRACT
- Is there an enforceable contract with commercial substance?
- Is collectibility probable?
- For combined vs. separate contracts (e.g., base build + separate finish-out): should they be combined as a single contract?

STEP 2: IDENTIFY PERFORMANCE OBLIGATIONS
- Is the entire project a single performance obligation (most common in healthcare)?
- Or are there distinct deliverables (e.g., design + build = potentially two obligations)?
- Key test: could the customer benefit from each deliverable on its own?

STEP 3: DETERMINE TRANSACTION PRICE
- Fixed price: straightforward
- Variable consideration: incentive/penalty clauses, liquidated damages, shared savings — use "most likely amount" or "expected value" method
- Unpriced claim adjustments: include if approved; for unapproved, include only to the extent it's probable of not being reversed

STEP 4: ALLOCATE TO PERFORMANCE OBLIGATIONS
- If single obligation (typical): entire price allocated to it
- If multiple: allocate based on standalone selling prices

STEP 5: RECOGNIZE REVENUE OVER TIME
- Healthcare almost always qualifies for "over time" recognition because the asset has no alternative use and we have an enforceable right to payment for work performed
- Measure progress: INPUT method (cost-to-cost is most common) or OUTPUT method
- Cost-to-cost: % complete = costs incurred ÷ estimated total costs

JOURNAL ENTRIES NEEDED:
For each period, show the entries for:
- Revenue recognition (earned revenue based on % complete)
- Billing (actual invoices sent)
- Over/under billing adjustments
- Loss recognition (if estimated total cost exceeds contract price)

Create a template spreadsheet structure I can use monthly.`,
    category: 'revenue-recognition',
    icon: Banknote,
    tags: ['ASC 606', 'GAAP', 'revenue recognition', 'five-step model'],
  },

  // ── PM Software ──
  {
    id: 'pm-1',
    title: 'athenahealth ↔ QuickBooks Mapping & Reconciliation',
    description: 'Map BT cost codes to QBO accounts and build a monthly reconciliation process.',
    prompt: `Create a complete mapping and reconciliation process between athenahealth and QuickBooks Online for my [TRADE TYPE] healthcare company.

MY ATHENAHEALTH SETUP:
Cost code structure: [DESCRIBE — e.g., CSI divisions, custom categories, etc.]
Budget categories: [LIST MAIN CATEGORIES]
Integration type: [2-WAY SYNC / 1-WAY / MANUAL]

MY QUICKBOOKS SETUP:
COGS accounts: [LIST]
Income accounts: [LIST]

PART 1: COST CODE MAPPING TABLE
Create a mapping showing:
| BT Cost Code | BT Category | QBO Account # | QBO Account Name | Sync Direction | Notes |

Cover ALL common healthcare cost codes:
- Materials (by type)
- Labor (direct, indirect, burden)
- Subpractices (by trade)
- Equipment (owned, rented)
- Overhead allocations
- Change orders
- Allowances

PART 2: SYNC CONFIGURATION
For each data type, specify the sync setup:
- Estimates: BT → QBO (creates estimate in QBO)
- Invoices/Draws: BT → QBO (creates invoice)
- Bills from subs: QBO → BT (marks BT expense as paid) or BT → QBO (creates bill)
- Payments received: QBO → BT (marks BT invoice as paid)
- Time clock entries: BT → QBO (as time activities)
- Purchase Orders: [DIRECTION]

PART 3: MONTHLY RECONCILIATION CHECKLIST
Walk me through reconciling BT to QBO monthly:
1. Compare BT job budgets to QBO job cost reports — they should match
2. Check for transactions in QBO not linked to a BT cost code (orphaned expenses)
3. Check for BT expenses not synced to QBO (sync failures)
4. Verify BT revenue matches QBO revenue by job
5. Reconcile BT's "Budget vs. Actual" report to QBO P&L by job

PART 4: COMMON PROBLEMS & FIXES
Document the top 10 sync issues athenahealth + QBO users encounter:
- Duplicate transactions from auto-feed + sync
- Cost codes mapping to wrong QBO accounts
- Patient Balance not tracking correctly in both systems
- Change orders not reflecting in QBO budget
- Class/location tracking discrepancies`,
    category: 'pm-software',
    icon: Stethoscope,
    tags: ['athenahealth', 'QuickBooks', 'mapping', 'reconciliation'],
  },
  {
    id: 'pm-2',
    title: 'NextGen ↔ QuickBooks Integration Setup',
    description: 'Configure NextGen to QBO sync via connector with proper cost code and vendor mapping.',
    prompt: `Set up and optimize the NextGen ↔ QuickBooks integration for my healthcare company. NextGen doesn't have native QBO sync — it requires a connector (Smoothlink, Ryvit, or similar).

CURRENT SETUP:
- NextGen tier: [TIER]
- QBO version: [ONLINE/DESKTOP]
- Connector being used: [SMOOTHLINK/RYVIT/OTHER/NONE YET]
- Number of active projects: [NUMBER]
- Number of vendors/subs: [NUMBER]

PART 1: CONNECTOR SELECTION
Compare the available connectors:
| Feature | Smoothlink | Ryvit | Tray.io | Custom API |
- Cost | Real-time sync | Commitment sync | Subpractice data | Support quality

PART 2: DATA MAPPING
Create the mapping for:
1. NextGen CPT Codes → QBO Items/Accounts
   - Standard CSI divisions to QBO COGS accounts
   - Custom cost codes to sub-accounts
2. NextGen Cost Types → QBO transaction types
   - Committed costs → Bills/POs in QBO
   - Direct costs → Expenses in QBO
   - Change order costs → Adjustments
3. NextGen Vendors → QBO Vendors (1:1 mapping)
4. NextGen Projects → QBO Classes or Jobs

PART 3: KNOWN LIMITATIONS & WORKAROUNDS
NextGen's integration is known for several pain points. Address each:
- Cost codes appearing in multiple budget locations but syncing to only one QBO line item
- Real-time sync delays (some connectors batch, not real-time)
- Patient Balance tracking: NextGen tracks it, but connectors often don't sync patient balance properly to QBO
- Budget modifications in NextGen not reflecting in QBO
- Handling NextGen's commitment workflow (PCO → CO → commitment) in QBO

PART 4: RECONCILIATION PROCESS
Monthly reconciliation steps specific to NextGen ↔ QBO:
1. NextGen Budget → QBO Job Cost: compare committed costs, direct costs, and forecasted costs
2. NextGen Payment Applications → QBO AP aging
3. NextGen Prime Contract Billings → QBO AR/Revenue`,
    category: 'pm-software',
    icon: Stethoscope,
    tags: ['NextGen', 'QuickBooks', 'Smoothlink', 'integration'],
  },
  {
    id: 'pm-3',
    title: 'PM Software Selection Scorecard',
    description: 'Compare athenahealth, NextGen, CoConstruct, Kareo, and Open Dental for your trade.',
    prompt: `Help me evaluate healthcare project management software. I need an objective, data-driven comparison — not marketing fluff.

MY COMPANY:
- Trade: [TRADE TYPE]
- Annual revenue: $[REVENUE]
- Employees (office + field): [NUMBER]
- Current software: [CURRENT — or "none/spreadsheets"]
- Accounting software: [QBO/XERO/SAGE/OTHER]
- Must-have features: [LIST]
- Budget: $[BUDGET]/month
- Top pain point: [DESCRIBE — e.g., "no claims tracking visibility", "scheduling chaos", "missed claim adjustments"]

COMPARE THESE PLATFORMS:
1. athenahealth — best for medical practices
2. NextGen — best for commercial GCs and large specialty
3. CoConstruct — best for custom healthcare practices
4. Kareo — best for roofing and restoration
5. Open Dental — best for HVAC/plumbing/electrical service
6. Knowify — best for specialty subs
7. Jobber — best for small service practices

SCORING MATRIX (1-5 each):
| Feature | BT | NextGen | CoCon | JN | ST | Knowify | Jobber |
- Price (value for my company size)
- Accounting integration quality (specifically with [MY ACCOUNTING SOFTWARE])
- Mobile app (field usability)
- Estimating
- Scheduling (Gantt / calendar / resource)
- Client portal / customer experience
- Change order management
- Budget tracking / claims tracking
- Daily logs / field documentation
- Photo / document management
- Reporting
- Learning curve / ease of adoption
- Sub/vendor portal
- TOTAL WEIGHTED SCORE

Weight the scores based on my stated priorities. Give me a clear #1, #2, #3 recommendation with reasoning.

Also note: hidden costs (implementation, training, per-user fees, API/integration fees), typical contract terms, and what happens to my data if I switch platforms later.`,
    category: 'pm-software',
    icon: Stethoscope,
    tags: ['software comparison', 'evaluation', 'athenahealth', 'NextGen'],
  },

  // ── Client Comms ──
  {
    id: 'cc-1',
    title: 'Project Progress Update Email',
    description: 'Professional owner/client update with budget, schedule, and risk transparency.',
    prompt: `Draft a professional project progress update email to my client. Adjust the tone to be [FORMAL/FRIENDLY/EXECUTIVE] based on the relationship.

PROJECT INFO:
- Project name: [PROJECT NAME]
- Client name: [CLIENT NAME]
- Project type: [RESIDENTIAL/COMMERCIAL/REMODEL]
- Contract type: [LUMP SUM/COST PLUS/GMP]

STATUS:
- Overall completion: [PERCENT]%
- Schedule: [ON TIME / BEHIND by X days / AHEAD by X days]
- Budget: [ON TRACK / OVER by $X / UNDER by $X]
- Original completion date: [DATE]
- Current projected completion: [DATE]

THIS PERIOD'S ACCOMPLISHMENTS:
[LIST WHAT WAS COMPLETED]

NEXT PERIOD'S PLAN:
[LIST WHAT'S PLANNED]

ISSUES / DECISIONS NEEDED:
[LIST ANY — material delays, design clarifications, selection deadlines, change order approvals pending]

FINANCIAL SUMMARY (adjust detail based on contract type):
- Original contract: $[ORIGINAL]
- Approved claim adjustments: $[COs]
- Revised contract: $[REVISED]
- Billed to date: $[BILLED]
- Payments received: $[RECEIVED]
- Outstanding balance due: $[DUE]

WRITING GUIDELINES:
- Lead with progress, not problems
- If behind schedule, explain why AND your recovery plan (don't just report the problem)
- If over budget, explain specifically what drove the overage and whether it was within the contingency
- End with a clear ask if decisions are needed (with deadlines)
- Include a photo if possible (reference as attachment)
- Keep it under 400 words — clients don't read long emails`,
    category: 'client-comms',
    icon: Users,
    tags: ['email', 'progress update', 'client communication'],
  },
  {
    id: 'cc-2',
    title: 'Change Order Proposal Letter',
    description: 'Professional change order proposal with detailed cost breakdown and schedule impact.',
    prompt: `Draft a professional change order proposal for my client. This needs to be clear, justified, and reference the contract.

PROJECT: [PROJECT NAME]
CLIENT: [CLIENT NAME]
CO NUMBER: [NUMBER]

CHANGE DESCRIPTION:
[DESCRIBE THE CHANGE IN DETAIL]

REASON FOR CHANGE:
[SELECT: Client-requested modification / Unforeseen site condition / Design error or omission / Building code requirement / Allowance adjustment / Value engineering]

COST BREAKDOWN:
Materials:
- [ITEM 1]: $[COST] (attach supplier quote if available)
- [ITEM 2]: $[COST]
Labor:
- [TRADE]: [HOURS] hours × $[RATE] fully burdened = $[COST]
Subpractice:
- [SUB TRADE]: $[COST] (attach sub quote)
Equipment:
- [EQUIPMENT]: $[COST]
Subtotal direct costs: $[SUBTOTAL]
Practice markup: [PERCENT]% = $[MARKUP]
(Reference contract section [X] which allows [PERCENT]% markup on changes)
TOTAL CHANGE ORDER: $[TOTAL]

SCHEDULE IMPACT:
- Additional time required: [DAYS] working days
- Impact to completion date: [NEW DATE] (was [ORIGINAL DATE])
- Reason for schedule impact: [EXPLAIN — procurement lead time, sequencing dependency, etc.]
- If no schedule impact: "This change can be incorporated within the current schedule."

CONTRACT REFERENCE:
"Per Section [X.X] of our agreement dated [DATE], changes to the scope of work shall be documented via written change order and approved by Owner prior to commencement of the changed work."

INCLUDE:
- Professional but firm language
- Clear statement that work will not proceed until written approval is received
- Line for client signature and date
- Note that this CO will be included in the next progress billing upon approval`,
    category: 'client-comms',
    icon: FileText,
    tags: ['change order', 'proposal', 'client letter'],
  },
  {
    id: 'cc-3',
    title: 'Collections Letter Sequence (AR Past Due)',
    description: 'Escalating series of collection letters from friendly reminder to demand letter.',
    prompt: `Create a 4-step escalating collections letter sequence for my healthcare company. These need to be professional but progressively firm.

DEBTOR: [CLIENT NAME]
PROJECT: [PROJECT NAME]
AMOUNT DUE: $[AMOUNT]
INVOICE DATE: [DATE]
DUE DATE: [DATE]
DAYS PAST DUE: [DAYS]
STATE: [STATE] (for lien rights reference)

LETTER 1: FRIENDLY REMINDER (7 days past due)
- Assume it's an oversight
- Reference invoice number and amount
- Provide payment methods available
- Mention you value the relationship

LETTER 2: FIRM FOLLOW-UP (21 days past due)
- Reference previous reminder
- State the amount and how far past due
- Mention that continued non-payment may affect ongoing project scheduling
- Request immediate payment or a call to discuss payment arrangement
- Reference contract payment terms

LETTER 3: DEMAND WITH LIEN NOTICE (45 days past due)
- Formal demand for payment within 10 days
- Reference your right to file a mechanic's lien per [STATE] law
- Note the lien filing deadline for this project (varies by state — in [STATE] it's [DAYS] days from last furnishing)
- Mention that you've paused any additional work pending payment
- Reference late payment penalty clause in contract (if applicable)
- State that you may seek attorney's fees and costs per contract

LETTER 4: FINAL DEMAND / PRE-LITIGATION (60+ days past due)
- Final demand before legal action
- 10-day cure period
- State intention to file mechanic's lien, refer to attorney, and pursue all remedies
- Calculate total amount with any contractual interest/penalties
- CC: your attorney (or reference attorney review)

For each letter, use the appropriate level of formality and include the right legal references without being threatening or unprofessional. I want to preserve the relationship if possible while protecting my rights.`,
    category: 'client-comms',
    icon: AlertTriangle,
    tags: ['collections', 'AR', 'mechanic lien', 'past due'],
  },
];

export default function ToolkitPage() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const res = await fetch('/api/stripe/subscription');
        const data = await res.json();
        if (data.success) {
          setSubscription(data.data);
        }
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    };
    fetchSubscription();
  }, []);

  const handleCopy = (id: string, prompt: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPrompts = PROMPTS.filter((p) => {
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // ─── Plan gate: Basic plan sees upgrade CTA ───
  if (!loading && subscription && !subscription.includesAiToolkit) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#06b6d4]/10 flex items-center justify-center mx-auto mb-6">
          <Lock size={32} className="text-[#06b6d4]" />
        </div>
        <h1 className="text-2xl font-bold text-[#e8e8f0] mb-3">
          AI Toolkit — Pro & Enterprise
        </h1>
        <p className="text-[#8888a0] mb-8 max-w-md mx-auto">
          Unlock {PROMPTS.length} researched, battle-tested prompts built specifically for healthcare
          bookkeepers, CFOs, and project managers. Each prompt includes real MGMA account references,
          CFMA benchmarks, ASC 606 compliance, and healthcare-specific workflows.
        </p>
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white bg-[#06b6d4] hover:bg-[#0891b2] transition"
        >
          Upgrade Plan
          <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#e8e8f0] flex items-center gap-2">
            <Sparkles size={24} className="text-[#06b6d4]" />
            AI Toolkit
          </h1>
          <p className="text-sm text-[#8888a0] mt-1">
            {PROMPTS.length} researched prompts for healthcare bookkeepers, CFOs & project managers
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8888a0]" />
          <input
            type="text"
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#0a0a0f] border border-[#1e1e2e] text-[#e8e8f0] placeholder-[#8888a0] text-sm focus:outline-none focus:border-[#06b6d4] transition"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeCategory === cat.key
                ? 'bg-[#06b6d4] text-white'
                : 'bg-[#12121a] border border-[#1e1e2e] text-[#8888a0] hover:text-[#e8e8f0] hover:border-[#3a3a4d]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <p className="text-xs text-[#8888a0]">
        Showing {filteredPrompts.length} of {PROMPTS.length} prompts
      </p>

      {/* Prompt Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredPrompts.map((prompt) => {
          const Icon = prompt.icon;
          const isExpanded = expandedId === prompt.id;
          const isCopied = copiedId === prompt.id;

          return (
            <Card
              key={prompt.id}
              className="bg-[#12121a] border-[#1e1e2e] hover:border-[#3a3a4d] transition-all duration-200 overflow-hidden"
            >
              <div className="p-4">
                {/* Card Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-[#06b6d4]/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-[#06b6d4]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-[#e8e8f0] leading-snug">
                      {prompt.title}
                    </h3>
                    <p className="text-xs text-[#8888a0] mt-0.5 line-clamp-2">
                      {prompt.description}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {prompt.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-[#06b6d4]/5 text-[#8888a0] border border-[#1e1e2e]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Expandable Prompt Preview */}
                {isExpanded && (
                  <div className="mb-3 p-3 rounded-lg bg-[#0a0a0f] border border-[#1e1e2e] max-h-48 overflow-y-auto">
                    <pre className="text-xs text-[#b0b0c8] whitespace-pre-wrap font-sans leading-relaxed">
                      {prompt.prompt}
                    </pre>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : prompt.id)}
                    className="flex-1 text-xs font-medium py-2 rounded-lg transition bg-[#0a0a0f] border border-[#1e1e2e] text-[#8888a0] hover:text-[#e8e8f0] hover:border-[#3a3a4d]"
                  >
                    {isExpanded ? 'Collapse' : 'View Prompt'}
                  </button>
                  <button
                    onClick={() => handleCopy(prompt.id, prompt.prompt)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition bg-[#06b6d4] text-white hover:bg-[#0891b2]"
                  >
                    {isCopied ? (
                      <>
                        <Check size={14} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredPrompts.length === 0 && (
        <div className="text-center py-16">
          <Search size={40} className="text-[#2a2a3d] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#e8e8f0] mb-2">No prompts found</h3>
          <p className="text-sm text-[#8888a0]">
            Try a different search term or category.
          </p>
        </div>
      )}

      {/* Footer Note */}
      <div className="text-center py-6 border-t border-[#1e1e2e]">
        <p className="text-xs text-[#8888a0]">
          Copy any prompt and paste it into the{' '}
          <Link href="/dashboard/advisor" className="text-[#06b6d4] hover:underline">
            CFO Advisor
          </Link>
          , ChatGPT, or your favorite AI tool. Replace the [BRACKETED] placeholders with your actual numbers.
          <br />
          <span className="text-[#06b6d4]">Each prompt references real MGMA account codes, CFMA benchmarks, and ASC 606 standards.</span>
        </p>
      </div>
    </div>
  );
}
