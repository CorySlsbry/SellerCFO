'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import {
  BookOpen,
  Lock,
  Copy,
  Check,
  Search,
  ChevronDown,
  ChevronRight,
  Download,
  ArrowRight,
  Building2,
  Stethoscope,
  Landmark,
} from 'lucide-react';
import Link from 'next/link';

// ─── Plan gating ───────────────────────────────────────────────
interface SubscriptionInfo {
  plan: 'basic' | 'pro' | 'enterprise';
  includesAiToolkit: boolean;
}

// ─── MGMA Account Data ─────────────────────────────────────────
interface Account {
  code: string;
  name: string;
  description?: string;
}

interface AccountSection {
  range: string;
  title: string;
  icon: React.ComponentType<any>;
  color: string;
  subsections: {
    range: string;
    title: string;
    accounts: Account[];
  }[];
}

const MGMA_SECTIONS: AccountSection[] = [
  {
    range: '1000–1990',
    title: 'Assets',
    icon: Building2,
    color: '#22c55e',
    subsections: [
      {
        range: '1000–1090',
        title: 'Cash & Equivalents',
        accounts: [
          { code: '1010', name: 'Petty cash' },
          { code: '1020', name: 'Cash, general' },
          { code: '1030', name: 'Cash, payroll' },
          { code: '1040', name: 'Cash, savings and money market' },
        ],
      },
      {
        range: '1200–1290',
        title: 'Receivables',
        accounts: [
          { code: '1210', name: 'Accounts receivable, trade' },
          { code: '1230', name: 'Notes receivable' },
          { code: '1265', name: 'Costs in excess of billings (underbilling)', description: 'Claims Pending asset — revenue earned but not yet billed. Debit when earned revenue exceeds billings.' },
          { code: '1280', name: 'Allowance for doubtful accounts' },
          { code: '1290', name: 'Retentions (patient balance) receivable', description: 'Amount withheld by owner/GC per contract, typically 5-10%, released at substantial completion.' },
        ],
      },
      {
        range: '1300–1440',
        title: 'Inventory & Healthcare Costs',
        accounts: [
          { code: '1310', name: 'Healthcare materials inventory' },
          { code: '1330', name: 'Property held for remodeling' },
          { code: '1410', name: 'Land and land development costs', description: 'GL account for Appendix G land development cost codes.' },
          { code: '1430', name: 'Direct healthcare cost', description: 'GL account for Appendix E direct healthcare cost codes (permits, site work, structure, MEP, finishes).' },
          { code: '1440', name: 'Indirect healthcare cost', description: 'GL account for Appendix F indirect healthcare cost codes (supers, field office, equipment, warranty).' },
        ],
      },
      {
        range: '1600–1690',
        title: 'Other Current Assets',
        accounts: [
          { code: '1610', name: 'Refundable deposits' },
          { code: '1620', name: 'Prepaid expenses' },
          { code: '1630', name: 'Employee advances' },
          { code: '1650', name: 'Due from affiliates or subsidiaries' },
          { code: '1660', name: 'Due from officers, stockholders, owners, or partners' },
          { code: '1690', name: 'Other current assets' },
        ],
      },
      {
        range: '1780–1890',
        title: 'Fixed Assets',
        accounts: [
          { code: '1780', name: 'Organization cost' },
          { code: '1810', name: 'Land' },
          { code: '1820', name: 'Buildings' },
          { code: '1830', name: 'Office furniture and equipment' },
          { code: '1840', name: 'Vehicles' },
          { code: '1850', name: 'Healthcare equipment' },
          { code: '1880', name: 'Leasehold improvements' },
          { code: '1890', name: 'Computer equipment and software' },
        ],
      },
      {
        range: '1900–1990',
        title: 'Accumulated Depreciation',
        accounts: [
          { code: '1920', name: 'Accumulated depreciation, buildings' },
          { code: '1930', name: 'Accumulated depreciation, office furniture and equipment' },
          { code: '1940', name: 'Accumulated depreciation, vehicles' },
          { code: '1950', name: 'Accumulated depreciation, healthcare equipment' },
          { code: '1980', name: 'Accumulated depreciation, leasehold improvements' },
          { code: '1990', name: 'Accumulated depreciation, computer equipment and software' },
        ],
      },
    ],
  },
  {
    range: '2000–2990',
    title: 'Liabilities & Owners\' Equity',
    icon: Landmark,
    color: '#ef4444',
    subsections: [
      {
        range: '2000–2490',
        title: 'Current Liabilities',
        accounts: [
          { code: '2010', name: 'Contract deposits' },
          { code: '2110', name: 'Accounts payable, trade' },
          { code: '2120', name: 'Retentions payable', description: 'Patient Balance withheld from subpractices, typically 5-10% until project completion.' },
          { code: '2200', name: 'Line of credit payable' },
          { code: '2240', name: 'Current portion of long-term debt' },
          { code: '2290', name: 'Notes payable, other' },
          { code: '2310', name: 'Social Security and Medicare' },
          { code: '2320', name: 'Federal payroll tax, withheld and accrued' },
          { code: '2330', name: 'State and local payroll tax, withheld and accrued' },
          { code: '2410', name: 'Accrued commissions payable' },
          { code: '2420', name: 'Workers\' compensation insurance payable' },
          { code: '2425', name: 'Other accrued expenses' },
          { code: '2440', name: 'Due to affiliated companies or subsidiaries' },
          { code: '2450', name: 'Due to officers, stockholders, owners, or partners' },
          { code: '2480', name: 'Billings in excess of costs (overbilling)', description: 'Claims Pending liability — amounts billed that exceed earned revenue. Credit when billings exceed earned revenue.' },
          { code: '2490', name: 'Other current liabilities' },
        ],
      },
      {
        range: '2500–2700',
        title: 'Long-Term Liabilities',
        accounts: [
          { code: '2510', name: 'Long-term notes payable' },
          { code: '2530', name: 'Mortgage notes payable' },
          { code: '2700', name: 'Other long-term liabilities' },
        ],
      },
      {
        range: '2900–2960',
        title: 'Owners\' Equity',
        accounts: [
          { code: '2900', name: 'Common stock' },
          { code: '2920', name: 'Retained earnings' },
          { code: '2950', name: 'Partnership or proprietorship account' },
          { code: '2960', name: 'Distributions, dividends, and draws' },
        ],
      },
    ],
  },
  {
    range: '3000–3990',
    title: 'Sales, Revenue & Cost of Sales',
    icon: Stethoscope,
    color: '#06b6d4',
    subsections: [
      {
        range: '3000–3490',
        title: 'Sales & Revenues',
        accounts: [
          { code: '3130', name: 'Sales, residential remodeling' },
          { code: '3133', name: 'Sales, commercial and industrial remodeling' },
          { code: '3135', name: 'Sales, insurance restoration' },
          { code: '3137', name: 'Sales, repairs' },
          { code: '3190', name: 'Sales, other' },
          { code: '3370', name: 'Design fees collected' },
          { code: '3400', name: 'Miscellaneous income' },
          { code: '3410', name: 'Interest income' },
          { code: '3420', name: 'Dividend income' },
          { code: '3450', name: 'Earned discounts' },
          { code: '3460', name: 'Earned rebates' },
        ],
      },
      {
        range: '3800–3899',
        title: 'Costs of Healthcare (COGS)',
        accounts: [
          { code: '3810', name: 'Direct labor', description: 'Wages for workers directly performing healthcare work on job sites.' },
          { code: '3820', name: 'Labor burden', description: 'Employer taxes, workers comp, benefits attributable to direct labor (typically 25-40% of base wages).' },
          { code: '3830', name: 'Building material', description: 'All materials installed or consumed on specific jobs.' },
          { code: '3840', name: 'Trade practices', description: 'Subpractice costs — largest cost category for most GCs.' },
          { code: '3850', name: 'Rental equipment', description: 'Equipment rented specifically for jobs (cranes, excavators, scaffolding).' },
          { code: '3860', name: 'Other direct healthcare costs' },
          { code: '3870', name: 'Professional design fees' },
        ],
      },
    ],
  },
  {
    range: '4000–4990',
    title: 'Indirect Healthcare Cost',
    icon: Stethoscope,
    color: '#f59e0b',
    subsections: [
      {
        range: '4000–4070',
        title: 'Salaries & Wages',
        accounts: [
          { code: '4010', name: 'Superintendents' },
          { code: '4020', name: 'Laborers' },
          { code: '4030', name: 'Production manager' },
          { code: '4040', name: 'Architects, drafters, estimators, purchasers' },
          { code: '4050', name: 'Warranty and customer service manager' },
          { code: '4060', name: 'Warranty and customer service wages' },
          { code: '4070', name: 'Other indirect healthcare wages' },
        ],
      },
      {
        range: '4100–4190',
        title: 'Payroll Taxes & Benefits',
        accounts: [
          { code: '4110', name: 'Payroll taxes' },
          { code: '4120', name: 'Workers\' compensation insurance' },
          { code: '4130', name: 'Health and accident insurance' },
          { code: '4140', name: 'Retirement, pension, profit sharing' },
          { code: '4150', name: 'Union benefits' },
          { code: '4190', name: 'Other benefits' },
        ],
      },
      {
        range: '4200–4560',
        title: 'Field Operations',
        accounts: [
          { code: '4210', name: 'Rent, field office' },
          { code: '4265', name: 'Mobile phones, pagers, radios, field office' },
          { code: '4410', name: 'Lease payments, healthcare vehicles' },
          { code: '4420', name: 'Mileage reimbursement' },
          { code: '4430', name: 'Repairs and maintenance, healthcare vehicles' },
          { code: '4510', name: 'Rent, healthcare equipment' },
          { code: '4530', name: 'Repairs and maintenance, healthcare equipment' },
          { code: '4560', name: 'Small tools and supplies' },
        ],
      },
      {
        range: '4700–4990',
        title: 'Warranty, Depreciation & Other',
        accounts: [
          { code: '4710', name: 'Salaries and wages, warranty' },
          { code: '4720', name: 'Material, warranty' },
          { code: '4730', name: 'Trade practice, warranty' },
          { code: '4840', name: 'Depreciation, healthcare vehicles' },
          { code: '4850', name: 'Depreciation, healthcare equipment' },
          { code: '4910', name: 'Insurance and credentialing expenses' },
          { code: '4920', name: 'Builder\'s risk insurance' },
          { code: '4990', name: 'Absorbed indirect costs' },
        ],
      },
    ],
  },
  {
    range: '5000–5990',
    title: 'Financing Expenses',
    icon: Landmark,
    color: '#8b5cf6',
    subsections: [
      {
        range: '5000–5090',
        title: 'Interest Expenses',
        accounts: [
          { code: '5010', name: 'Interest on line of credit' },
          { code: '5020', name: 'Interest on notes payable' },
          { code: '5090', name: 'Interest expense, other' },
        ],
      },
    ],
  },
  {
    range: '6000–6990',
    title: 'Sales & Marketing Expenses',
    icon: Building2,
    color: '#ec4899',
    subsections: [
      {
        range: '6000–6395',
        title: 'Sales & Marketing',
        accounts: [
          { code: '6030', name: 'Salaries, sales personnel' },
          { code: '6040', name: 'Sales commissions, in-house' },
          { code: '6045', name: 'Sales commissions, internet and website support' },
          { code: '6050', name: 'Sales commissions, outside' },
          { code: '6110', name: 'Payroll taxes, sales and marketing' },
          { code: '6310', name: 'Print advertising' },
          { code: '6330', name: 'Web page design and maintenance expenses' },
          { code: '6335', name: 'Internet marketing, advertising and fees' },
          { code: '6340', name: 'Brochures and catalogues' },
          { code: '6350', name: 'Signs' },
          { code: '6390', name: 'Public relations' },
          { code: '6395', name: 'Referral fees' },
        ],
      },
    ],
  },
  {
    range: '8000–8990',
    title: 'General & Administrative',
    icon: Building2,
    color: '#06b6d4',
    subsections: [
      {
        range: '8000–8280',
        title: 'Office & Personnel',
        accounts: [
          { code: '8010', name: 'Salaries, owners' },
          { code: '8050', name: 'Salaries and wages, office and clerical' },
          { code: '8110', name: 'Payroll taxes' },
          { code: '8120', name: 'Workers\' compensation insurance' },
          { code: '8130', name: 'Health and accident insurance' },
          { code: '8140', name: 'Retirement, pension, profit-sharing plans' },
          { code: '8210', name: 'Rent' },
          { code: '8250', name: 'Utilities, administrative office' },
          { code: '8260', name: 'Telephone, administrative office' },
          { code: '8270', name: 'Office supplies, administrative office' },
          { code: '8280', name: 'Postage and deliveries' },
        ],
      },
      {
        range: '8320–8590',
        title: 'Technology, Vehicles & Taxes',
        accounts: [
          { code: '8320', name: 'Leases, computer hardware' },
          { code: '8330', name: 'Leases, computer software' },
          { code: '8335', name: 'Software licensing and subscription fees' },
          { code: '8340', name: 'Network and web development expenses' },
          { code: '8350', name: 'Repairs and maintenance, computer equipment' },
          { code: '8410', name: 'Lease, administrative vehicles' },
          { code: '8460', name: 'Travel' },
          { code: '8530', name: 'Personal property taxes' },
          { code: '8540', name: 'License fees' },
          { code: '8590', name: 'Other taxes' },
        ],
      },
      {
        range: '8600–8990',
        title: 'Insurance, Professional & Other',
        accounts: [
          { code: '8610', name: 'Hazard insurance, property insurance' },
          { code: '8630', name: 'General liability insurance' },
          { code: '8690', name: 'Other insurance' },
          { code: '8710', name: 'Accounting services' },
          { code: '8720', name: 'Legal services' },
          { code: '8730', name: 'Consulting services' },
          { code: '8810', name: 'Depreciation, buildings' },
          { code: '8870', name: 'Depreciation, computer equipment and software' },
          { code: '8900', name: 'Bad debts' },
          { code: '8920', name: 'Dues and subscriptions' },
          { code: '8950', name: 'Bank charges' },
          { code: '8990', name: 'Training and education expenses' },
        ],
      },
    ],
  },
  {
    range: '9000–9990',
    title: 'Other Income & Expenses',
    icon: Landmark,
    color: '#64748b',
    subsections: [
      {
        range: '9100–9290',
        title: 'Other Income & Expenses',
        accounts: [
          { code: '9150', name: 'Gain or loss on sale of assets' },
          { code: '9190', name: 'Other income' },
          { code: '9200', name: 'Extraordinary expenses' },
        ],
      },
    ],
  },
];

// Flatten all accounts for search
function getAllAccounts(): (Account & { sectionTitle: string; subsectionTitle: string })[] {
  const all: (Account & { sectionTitle: string; subsectionTitle: string })[] = [];
  for (const section of MGMA_SECTIONS) {
    for (const sub of section.subsections) {
      for (const account of sub.accounts) {
        all.push({ ...account, sectionTitle: section.title, subsectionTitle: sub.title });
      }
    }
  }
  return all;
}

export default function MGMAAccountsPage() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'full' | 'abbreviated'>('full');

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

  const toggleSection = (range: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(range)) {
        next.delete(range);
      } else {
        next.add(range);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allRanges = new Set<string>();
    MGMA_SECTIONS.forEach((s) => {
      allRanges.add(s.range);
      s.subsections.forEach((sub) => allRanges.add(sub.range));
    });
    setExpandedSections(allRanges);
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  const handleCopyAccount = (code: string, name: string) => {
    navigator.clipboard.writeText(`${code} ${name}`);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCopyAll = () => {
    const allAccounts = getAllAccounts();
    const text = allAccounts.map((a) => `${a.code}\t${a.name}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedCode('ALL');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Search filtering
  const allAccounts = getAllAccounts();
  const searchResults = searchQuery
    ? allAccounts.filter(
        (a) =>
          a.code.includes(searchQuery) ||
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const totalAccountCount = allAccounts.length;

  // ─── Plan gate: Basic plan sees upgrade CTA ───
  if (!loading && subscription && !subscription.includesAiToolkit) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#06b6d4]/10 flex items-center justify-center mx-auto mb-6">
          <Lock size={32} className="text-[#06b6d4]" />
        </div>
        <h1 className="text-2xl font-bold text-[#e8e8f0] mb-3">
          Medical Chart of Accounts — Pro & Enterprise
        </h1>
        <p className="text-[#8888a0] mb-8 max-w-md mx-auto">
          Access the complete MGMA Standard Chart of Accounts (2016 revision) with {totalAccountCount}+ accounts
          organized across 9 major categories. Industry-standard 4-digit numbering system used by
          custom healthcare practices, dental practices, and specialty practices nationwide.
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
            <BookOpen size={24} className="text-[#06b6d4]" />
            Medical Chart of Accounts
          </h1>
          <p className="text-sm text-[#8888a0] mt-1">
            Industry-standard chart of accounts for medical practices — {totalAccountCount} accounts across 9 categories
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8888a0]" />
          <input
            type="text"
            placeholder="Search by code or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#0a0a0f] border border-[#1e1e2e] text-[#e8e8f0] placeholder-[#8888a0] text-sm focus:outline-none focus:border-[#06b6d4] transition"
          />
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={expandAll}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#12121a] border border-[#1e1e2e] text-[#8888a0] hover:text-[#e8e8f0] hover:border-[#3a3a4d] transition"
        >
          Expand All
        </button>
        <button
          onClick={collapseAll}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#12121a] border border-[#1e1e2e] text-[#8888a0] hover:text-[#e8e8f0] hover:border-[#3a3a4d] transition"
        >
          Collapse All
        </button>
        <button
          onClick={handleCopyAll}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#06b6d4] text-white hover:bg-[#0891b2] transition flex items-center gap-1.5"
        >
          {copiedCode === 'ALL' ? <Check size={14} /> : <Copy size={14} />}
          {copiedCode === 'ALL' ? 'Copied All!' : 'Copy Full COA'}
        </button>
        <div className="ml-auto flex items-center gap-1 bg-[#12121a] border border-[#1e1e2e] rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('full')}
            className={`px-3 py-1 rounded text-xs font-medium transition ${
              viewMode === 'full' ? 'bg-[#06b6d4] text-white' : 'text-[#8888a0] hover:text-[#e8e8f0]'
            }`}
          >
            Full (Practices)
          </button>
          <button
            onClick={() => setViewMode('abbreviated')}
            className={`px-3 py-1 rounded text-xs font-medium transition ${
              viewMode === 'abbreviated' ? 'bg-[#06b6d4] text-white' : 'text-[#8888a0] hover:text-[#e8e8f0]'
            }`}
          >
            Abbreviated (Remodelers)
          </button>
        </div>
      </div>

      {/* Search Results */}
      {searchQuery && (
        <Card className="bg-[#12121a] border-[#1e1e2e] p-4">
          <h3 className="text-sm font-semibold text-[#e8e8f0] mb-3">
            Search Results ({searchResults.length} found)
          </h3>
          {searchResults.length === 0 ? (
            <p className="text-sm text-[#8888a0]">No accounts match &ldquo;{searchQuery}&rdquo;</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((result) => (
                <div
                  key={result.code}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#0a0a0f] border border-[#1e1e2e] hover:border-[#3a3a4d] transition group"
                >
                  <code className="text-sm font-mono text-[#06b6d4] font-bold w-12 flex-shrink-0">
                    {result.code}
                  </code>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-[#e8e8f0]">{result.name}</span>
                    {result.description && (
                      <p className="text-xs text-[#8888a0] mt-0.5">{result.description}</p>
                    )}
                    <span className="text-[10px] text-[#06b6d4]">
                      {result.sectionTitle} → {result.subsectionTitle}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyAccount(result.code, result.name)}
                    className="opacity-0 group-hover:opacity-100 transition p-1.5 rounded text-[#8888a0] hover:text-[#e8e8f0]"
                  >
                    {copiedCode === result.code ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Account Sections */}
      {!searchQuery && (
        <div className="space-y-3">
          {MGMA_SECTIONS.map((section) => {
            const Icon = section.icon;
            const isSectionExpanded = expandedSections.has(section.range);

            return (
              <Card
                key={section.range}
                className="bg-[#12121a] border-[#1e1e2e] overflow-hidden"
              >
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.range)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-[#0a0a0f]/50 transition text-left"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${section.color}15` }}
                  >
                    <Icon size={20} style={{ color: section.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-bold text-[#e8e8f0]">
                      {section.range} — {section.title}
                    </h2>
                    <p className="text-xs text-[#8888a0]">
                      {section.subsections.reduce((sum, s) => sum + s.accounts.length, 0)} accounts
                    </p>
                  </div>
                  {isSectionExpanded ? (
                    <ChevronDown size={20} className="text-[#8888a0]" />
                  ) : (
                    <ChevronRight size={20} className="text-[#8888a0]" />
                  )}
                </button>

                {/* Subsections */}
                {isSectionExpanded && (
                  <div className="border-t border-[#1e1e2e]">
                    {section.subsections.map((sub) => {
                      const isSubExpanded = expandedSections.has(sub.range);

                      return (
                        <div key={sub.range}>
                          <button
                            onClick={() => toggleSection(sub.range)}
                            className="w-full flex items-center gap-3 px-6 py-3 hover:bg-[#0a0a0f]/30 transition text-left border-b border-[#1e1e2e]/50"
                          >
                            {isSubExpanded ? (
                              <ChevronDown size={16} className="text-[#06b6d4]" />
                            ) : (
                              <ChevronRight size={16} className="text-[#8888a0]" />
                            )}
                            <span className="text-sm font-semibold text-[#e8e8f0]">
                              {sub.range} — {sub.title}
                            </span>
                            <span className="text-xs text-[#8888a0] ml-auto">
                              {sub.accounts.length} accounts
                            </span>
                          </button>

                          {isSubExpanded && (
                            <div className="px-6 pb-3">
                              {sub.accounts.map((account) => (
                                <div
                                  key={account.code}
                                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#0a0a0f] transition group"
                                >
                                  <code className="text-sm font-mono font-bold w-12 flex-shrink-0" style={{ color: section.color }}>
                                    {account.code}
                                  </code>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm text-[#e8e8f0]">{account.name}</span>
                                    {account.description && (
                                      <p className="text-xs text-[#8888a0] mt-0.5">{account.description}</p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleCopyAccount(account.code, account.name)}
                                    className="opacity-0 group-hover:opacity-100 transition p-1.5 rounded text-[#8888a0] hover:text-[#e8e8f0]"
                                    title="Copy account code and name"
                                  >
                                    {copiedCode === account.code ? (
                                      <Check size={14} className="text-green-400" />
                                    ) : (
                                      <Copy size={14} />
                                    )}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Info Footer */}
      <div className="text-center py-6 border-t border-[#1e1e2e]">
        <p className="text-xs text-[#8888a0]">
          Based on the <span className="text-[#06b6d4]">MGMA Standard Chart of Accounts (Revised 2016)</span> published by the
          National Association of Healthcare Practices. Includes the full chart (Appendices A &amp; B),
          abbreviated dental practice version (Appendix D), direct healthcare costs (Appendix E),
          indirect costs (Appendix F), and land development costs (Appendix G).
        </p>
        <p className="text-xs text-[#8888a0] mt-2">
          Copy individual accounts or the full COA to set up in{' '}
          <span className="text-[#e8e8f0]">QuickBooks Online</span>,{' '}
          <span className="text-[#e8e8f0]">Xero</span>, or{' '}
          <span className="text-[#e8e8f0]">Sage</span>.
        </p>
      </div>
    </div>
  );
}
