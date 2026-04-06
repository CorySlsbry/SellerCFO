'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Clock,
  AlertCircle,
  Briefcase,
  Target,
  DollarSign,
  Lock,
  Download,
  X,
  ChevronDown,
  CalendarDays,
  Loader2,
} from 'lucide-react';
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils';

type DateRange = 'this-month' | 'last-month' | 'this-quarter' | 'last-quarter' | 'ytd' | 'last-year' | 'custom';
type ReportType =
  | 'pl'
  | 'balance-sheet'
  | 'cash-flow'
  | 'ar-aging'
  | 'ap-aging'
  | 'collection-analysis'
  | 'payer-performance'
  | 'tax'
  | 'provider-productivity'
  | 'denial-analysis';

interface GeneratedReport {
  type: ReportType;
  dateRange: DateRange;
  startDate: string;
  endDate: string;
  data: any;
}

const reportDefinitions = [
  {
    type: 'pl' as ReportType,
    title: 'Profit & Loss',
    description: 'Income statement showing revenues, expenses, and net income',
    icon: TrendingUp,
    color: '#06b6d4',
  },
  {
    type: 'balance-sheet' as ReportType,
    title: 'Balance Sheet',
    description: 'Assets, liabilities, and equity snapshot',
    icon: BarChart3,
    color: '#22c55e',
  },
  {
    type: 'cash-flow' as ReportType,
    title: 'Cash Flow Statement',
    description: 'Operating, investing, and financing cash flows',
    icon: DollarSign,
    color: '#eab308',
  },
  {
    type: 'ar-aging' as ReportType,
    title: 'Accounts Receivable Aging',
    description: 'Outstanding invoices by age and customer',
    icon: Clock,
    color: '#06b6d4',
  },
  {
    type: 'ap-aging' as ReportType,
    title: 'Accounts Payable Aging',
    description: 'Outstanding bills by age and vendor',
    icon: AlertCircle,
    color: '#f59e0b',
  },
  {
    type: 'collection-analysis' as ReportType,
    title: 'Collection Analysis',
    description: 'Net collection rate, adjustments, and write-offs by payer',
    icon: Briefcase,
    color: '#8b5cf6',
  },
  {
    type: 'payer-performance' as ReportType,
    title: 'Payer Performance',
    description: 'Reimbursement rates, denial rates, and days to pay by payer',
    icon: Target,
    color: '#ec4899',
  },
  {
    type: 'tax' as ReportType,
    title: 'Tax Summary',
    description: 'Taxable income, deductions, and estimated liability',
    icon: Lock,
    color: '#14b8a6',
  },
  {
    type: 'provider-productivity' as ReportType,
    title: 'Provider Productivity',
    description: 'wRVUs, encounters, and revenue per provider',
    icon: PieChart,
    color: '#06b6d4',
  },
  {
    type: 'denial-analysis' as ReportType,
    title: 'Denial Analysis',
    description: 'Denial patterns, root causes, and appeal success rates',
    icon: BarChart3,
    color: '#10b981',
  },
];


export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('this-month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDateRangeLabel = () => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (dateRange) {
      case 'this-month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date();
        return `This Month (${formatDate(start, { format: 'short' })} - ${formatDate(end, { format: 'short' })})`;
      case 'last-month':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        return `Last Month (${formatDate(start, { format: 'short' })} - ${formatDate(end, { format: 'short' })})`;
      case 'this-quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        start = new Date(today.getFullYear(), quarter * 3, 1);
        end = new Date();
        return `This Quarter (${formatDate(start, { format: 'short' })} - ${formatDate(end, { format: 'short' })})`;
      case 'last-quarter':
        const lastQuarter = Math.floor(today.getMonth() / 3) - 1;
        start = new Date(today.getFullYear(), lastQuarter * 3, 1);
        end = new Date(today.getFullYear(), lastQuarter * 3 + 3, 0);
        return `Last Quarter (${formatDate(start, { format: 'short' })} - ${formatDate(end, { format: 'short' })})`;
      case 'ytd':
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date();
        return `Year to Date (${formatDate(start, { format: 'short' })} - ${formatDate(end, { format: 'short' })})`;
      case 'last-year':
        start = new Date(today.getFullYear() - 1, 0, 1);
        end = new Date(today.getFullYear() - 1, 11, 31);
        return `Last Year (${formatDate(start, { format: 'short' })} - ${formatDate(end, { format: 'short' })})`;
      case 'custom':
        return `Custom (${formatDate(customStartDate, { format: 'short' })} - ${formatDate(customEndDate, { format: 'short' })})`;
      default:
        return '';
    }
  };

  const generateReport = async (reportType: ReportType) => {
    let startDate = '';
    let endDate = '';

    const today = new Date();

    switch (dateRange) {
      case 'this-month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        endDate = new Date().toISOString().split('T')[0];
        break;
      case 'last-month':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
        endDate = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
        break;
      case 'this-quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
        endDate = new Date().toISOString().split('T')[0];
        break;
      case 'last-quarter':
        const lastQuarter = Math.floor(today.getMonth() / 3) - 1;
        startDate = new Date(today.getFullYear(), lastQuarter * 3, 1).toISOString().split('T')[0];
        endDate = new Date(today.getFullYear(), lastQuarter * 3 + 3, 0).toISOString().split('T')[0];
        break;
      case 'ytd':
        startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        endDate = new Date().toISOString().split('T')[0];
        break;
      case 'last-year':
        startDate = new Date(today.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
        endDate = new Date(today.getFullYear() - 1, 11, 31).toISOString().split('T')[0];
        break;
      case 'custom':
        startDate = customStartDate;
        endDate = customEndDate;
        break;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType,
          startDate,
          endDate,
          clientCompanyId: typeof window !== 'undefined'
            ? window.localStorage?.getItem?.('selectedClientId')
            : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate report');
      }

      setGeneratedReport({
        type: reportType,
        dateRange,
        startDate,
        endDate,
        data: result.data,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Report generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'pdf' | 'csv') => {
    console.log(`Exporting ${generatedReport?.type} as ${format.toUpperCase()}`);
    setShowExportMenu(false);
  };

  if (generatedReport) {
    return <ReportViewer report={generatedReport} onClose={() => setGeneratedReport(null)} onExport={handleExport} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1 text-[#e8e8f0]">Reports</h1>
        <p className="text-[#8888a0]">Generate and view financial reports for your medical practice</p>
      </div>

      {/* Error State */}
      {error && (
        <Card className="p-4 bg-[#7f1d1d]/20 border-[#dc2626]">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-[#dc2626]" />
            <div>
              <p className="text-sm font-semibold text-[#fca5a5]">Error generating report</p>
              <p className="text-sm text-[#fecaca]">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-[#fca5a5] hover:text-[#fecaca]"
            >
              <X size={18} />
            </button>
          </div>
        </Card>
      )}

      {/* Date Range Selector */}
      <Card className="p-6 bg-[#12121a] border-[#2a2a3d]">
        <div className="space-y-4">
          <label className="text-sm font-semibold text-[#e8e8f0]">Report Date Range</label>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {(['this-month', 'last-month', 'this-quarter', 'last-quarter', 'ytd', 'last-year'] as DateRange[]).map(
              (range) => (
                <button
                  key={range}
                  onClick={() => {
                    setDateRange(range);
                    if (range !== 'custom') {
                      setCustomStartDate('');
                      setCustomEndDate('');
                    }
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    dateRange === range
                      ? 'bg-[#06b6d4] text-white'
                      : 'bg-[#2a2a3d] text-[#e8e8f0] hover:bg-[#3a3a4d]'
                  }`}
                >
                  {range === 'this-month' && 'This Month'}
                  {range === 'last-month' && 'Last Month'}
                  {range === 'this-quarter' && 'This Quarter'}
                  {range === 'last-quarter' && 'Last Quarter'}
                  {range === 'ytd' && 'YTD'}
                  {range === 'last-year' && 'Last Year'}
                </button>
              )
            )}
          </div>

          {/* Custom Date Range */}
          <div className="border-t border-[#2a2a3d] pt-4">
            <button
              onClick={() => setDateRange('custom')}
              className={`flex items-center gap-2 w-full px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                dateRange === 'custom'
                  ? 'bg-[#06b6d4] text-white'
                  : 'bg-[#2a2a3d] text-[#e8e8f0] hover:bg-[#3a3a4d]'
              }`}
            >
              <CalendarDays size={16} />
              Custom Date Range
            </button>

            {dateRange === 'custom' && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#8888a0] mb-1 block">From Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#2a2a3d] border border-[#3a3a4d] text-[#e8e8f0] text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#8888a0] mb-1 block">To Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#2a2a3d] border border-[#3a3a4d] text-[#e8e8f0] text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Selected Range Display */}
          <div className="bg-[#1a1a26] border border-[#06b6d4]/30 rounded-lg p-3">
            <p className="text-sm text-[#e8e8f0]">
              <span className="font-semibold">Selected Range:</span> {getDateRangeLabel()}
            </p>
          </div>
        </div>
      </Card>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportDefinitions.map((report) => {
          const IconComponent = report.icon;
          return (
            <Card key={report.type} className="p-6 bg-[#12121a] border-[#2a2a3d] hover:border-[#3a3a4d] transition-all">
              <div className="flex items-start justify-between mb-3">
                <div
                  className="p-2 rounded-lg"
                  style={{
                    backgroundColor: `${report.color}20`,
                  }}
                >
                  <IconComponent size={24} style={{ color: report.color }} />
                </div>
              </div>

              <h3 className="text-lg font-semibold text-[#e8e8f0] mb-1">{report.title}</h3>
              <p className="text-sm text-[#8888a0] mb-4">{report.description}</p>

              <Button
                onClick={() => generateReport(report.type)}
                disabled={loading}
                variant="primary"
                size="sm"
                className="w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  'Generate Report'
                )}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

interface ReportViewerProps {
  report: GeneratedReport;
  onClose: () => void;
  onExport: (format: 'pdf' | 'csv') => void;
}

function ReportViewer({ report, onClose, onExport }: ReportViewerProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  const getReportTitle = () => {
    const titleMap: Record<ReportType, string> = {
      pl: 'Profit & Loss Statement',
      'balance-sheet': 'Balance Sheet',
      'cash-flow': 'Cash Flow Statement',
      'ar-aging': 'Accounts Receivable Aging',
      'ap-aging': 'Accounts Payable Aging',
      'collection-analysis': 'Collection Analysis',
      'payer-performance': 'Payer Performance Report',
      tax: 'Tax Summary',
      'provider-productivity': 'Provider Productivity Report',
      'denial-analysis': 'Denial Analysis Report',
    };
    return titleMap[report.type];
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0f]/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
      <Card className="w-full sm:max-w-5xl h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto bg-[#12121a] border-[#2a2a3d] rounded-none sm:rounded-xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#12121a] border-b border-[#2a2a3d] p-4 sm:p-6 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-2xl font-bold text-[#e8e8f0] truncate">{getReportTitle()}</h2>
            <p className="text-xs sm:text-sm text-[#8888a0] mt-1">
              {formatDate(report.startDate, { format: 'short' })} - {formatDate(report.endDate, { format: 'short' })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2"
              >
                <Download size={18} />
                Export
                <ChevronDown size={16} />
              </Button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-[#1a1a26] border border-[#2a2a3d] rounded-lg shadow-xl overflow-hidden">
                  <button
                    onClick={() => {
                      onExport('pdf');
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[#e8e8f0] hover:bg-[#2a2a3d] transition-colors"
                  >
                    Export as PDF
                  </button>
                  <button
                    onClick={() => {
                      onExport('csv');
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[#e8e8f0] hover:bg-[#2a2a3d] transition-colors border-t border-[#2a2a3d]"
                  >
                    Export as CSV
                  </button>
                </div>
              )}
            </div>

            <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
              <X size={20} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {report.type === 'pl' && <PLReportContent data={report.data} />}
          {report.type === 'balance-sheet' && <BalanceSheetContent data={report.data} />}
          {report.type === 'cash-flow' && <CashFlowContent data={report.data} />}
          {report.type === 'ar-aging' && <ARAgingContent data={report.data} />}
          {report.type === 'ap-aging' && <APAgingContent data={report.data} />}
          {report.type === 'collection-analysis' && <CollectionAnalysisContent data={report.data} />}
          {report.type === 'payer-performance' && <PayerPerformanceContent data={report.data} />}
          {report.type === 'tax' && <TaxContent data={report.data} />}
          {report.type === 'provider-productivity' && <ProviderProductivityContent data={report.data} />}
          {report.type === 'denial-analysis' && <DenialAnalysisContent data={report.data} />}
        </div>
      </Card>
    </div>
  );
}

function PLReportContent({ data }: { data: any }) {
  const totalRevenue = data.revenues.reduce((sum: number, item: any) => sum + item.amount, 0);
  const totalExpenses = data.expenses.reduce((sum: number, item: any) => sum + item.amount, 0);
  const netIncome = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4">
          <p className="text-sm text-[#8888a0] mb-1">Total Revenue</p>
          <p className="text-xl sm:text-2xl font-bold text-[#22c55e]">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4">
          <p className="text-sm text-[#8888a0] mb-1">Total Expenses</p>
          <p className="text-xl sm:text-2xl font-bold text-[#ef4444]">{formatCurrency(totalExpenses)}</p>
        </div>
        <div
          className="border rounded-lg p-4"
          style={{
            backgroundColor: netIncome >= 0 ? '#22c55e/10' : '#ef4444/10',
            borderColor: netIncome >= 0 ? '#22c55e/30' : '#ef4444/30',
          }}
        >
          <p className="text-sm text-[#8888a0] mb-1">Net Income</p>
          <p
            className="text-2xl font-bold"
            style={{ color: netIncome >= 0 ? '#22c55e' : '#ef4444' }}
          >
            {formatCurrency(netIncome)}
          </p>
        </div>
      </div>

      {/* Revenues */}
      <div>
        <h3 className="text-lg font-semibold text-[#e8e8f0] mb-3">Revenues</h3>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="border-b border-[#2a2a3d]">
                <th className="px-4 py-3 text-left text-[#8888a0] font-semibold">Category</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">Amount</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {data.revenues.map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-[#2a2a3d] last:border-0">
                  <td className="px-4 py-3 text-[#e8e8f0]">{item.category}</td>
                  <td className="px-4 py-3 text-right text-[#22c55e] font-semibold">{formatCurrency(item.amount)}</td>
                  <td className="px-4 py-3 text-right text-[#8888a0]">{formatPercent((item.amount / totalRevenue) * 100, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expenses */}
      <div>
        <h3 className="text-lg font-semibold text-[#e8e8f0] mb-3">Expenses</h3>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="border-b border-[#2a2a3d]">
                <th className="px-4 py-3 text-left text-[#8888a0] font-semibold">Category</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">Amount</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">% of Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.expenses.map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-[#2a2a3d] last:border-0">
                  <td className="px-4 py-3 text-[#e8e8f0]">{item.category}</td>
                  <td className="px-4 py-3 text-right text-[#ef4444] font-semibold">{formatCurrency(item.amount)}</td>
                  <td className="px-4 py-3 text-right text-[#8888a0]">{formatPercent((item.amount / totalRevenue) * 100, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profit Margin */}
      <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4">
        <p className="text-sm text-[#8888a0] mb-1">Profit Margin</p>
        <p className="text-2xl font-bold text-[#06b6d4]">
          {formatPercent((netIncome / totalRevenue) * 100, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
        </p>
      </div>
    </div>
  );
}

function BalanceSheetContent({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4">
          <p className="text-sm text-[#8888a0] mb-1">Total Assets</p>
          <p className="text-2xl font-bold text-[#22c55e]">{formatCurrency(data.totalAssets)}</p>
        </div>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4">
          <p className="text-sm text-[#8888a0] mb-1">Total Liabilities</p>
          <p className="text-2xl font-bold text-[#ef4444]">{formatCurrency(data.totalLiabilities)}</p>
        </div>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4">
          <p className="text-sm text-[#8888a0] mb-1">Total Equity</p>
          <p className="text-2xl font-bold text-[#06b6d4]">{formatCurrency(data.totalEquity)}</p>
        </div>
      </div>

      {/* Assets */}
      <div>
        <h3 className="text-lg font-semibold text-[#e8e8f0] mb-3">Assets</h3>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="border-b border-[#2a2a3d]">
                <th className="px-4 py-3 text-left text-[#8888a0] font-semibold">Asset Category</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">Amount</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">% of Total Assets</th>
              </tr>
            </thead>
            <tbody>
              {data.assets.map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-[#2a2a3d] last:border-0">
                  <td className="px-4 py-3 text-[#e8e8f0]">{item.category}</td>
                  <td className="px-4 py-3 text-right text-[#22c55e] font-semibold">{formatCurrency(item.amount)}</td>
                  <td className="px-4 py-3 text-right text-[#8888a0]">{formatPercent(Math.abs((item.amount / data.totalAssets) * 100), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Liabilities */}
      <div>
        <h3 className="text-lg font-semibold text-[#e8e8f0] mb-3">Liabilities</h3>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="border-b border-[#2a2a3d]">
                <th className="px-4 py-3 text-left text-[#8888a0] font-semibold">Liability Category</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">Amount</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">% of Total Liabilities</th>
              </tr>
            </thead>
            <tbody>
              {data.liabilities.map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-[#2a2a3d] last:border-0">
                  <td className="px-4 py-3 text-[#e8e8f0]">{item.category}</td>
                  <td className="px-4 py-3 text-right text-[#ef4444] font-semibold">{formatCurrency(item.amount)}</td>
                  <td className="px-4 py-3 text-right text-[#8888a0]">{formatPercent((item.amount / data.totalLiabilities) * 100, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Equity */}
      <div>
        <h3 className="text-lg font-semibold text-[#e8e8f0] mb-3">Equity</h3>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="border-b border-[#2a2a3d]">
                <th className="px-4 py-3 text-left text-[#8888a0] font-semibold">Equity Category</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.equity.map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-[#2a2a3d] last:border-0">
                  <td className="px-4 py-3 text-[#e8e8f0]">{item.category}</td>
                  <td className="px-4 py-3 text-right text-[#06b6d4] font-semibold">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CashFlowContent({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4">
          <p className="text-sm text-[#8888a0] mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-[#22c55e]">{formatCurrency(data.totalRevenue || 0)}</p>
        </div>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4">
          <p className="text-sm text-[#8888a0] mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-[#ef4444]">{formatCurrency(data.totalExpenses || 0)}</p>
        </div>
        <div
          className="border rounded-lg p-4"
          style={{
            backgroundColor: data.netCashFlow >= 0 ? '#14532d20' : '#7f1d1d20',
            borderColor: data.netCashFlow >= 0 ? '#22c55e50' : '#ef444450',
          }}
        >
          <p className="text-sm text-[#8888a0] mb-1">Net Cash Flow</p>
          <p
            className="text-2xl font-bold"
            style={{ color: data.netCashFlow >= 0 ? '#22c55e' : '#ef4444' }}
          >
            {formatCurrency(data.netCashFlow)}
          </p>
        </div>
      </div>

      {/* Operating Activities */}
      <div>
        <h3 className="text-lg font-semibold text-[#e8e8f0] mb-3">Operating Activities</h3>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="border-b border-[#2a2a3d]">
                <th className="px-4 py-3 text-left text-[#8888a0] font-semibold">Item</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.operating.map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-[#2a2a3d] last:border-0">
                  <td className="px-4 py-3 text-[#e8e8f0]">{item.item}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${item.amount >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
              <tr className="bg-[#2a2a3d]">
                <td className="px-4 py-3 text-[#e8e8f0] font-semibold">Operating Cash Flow</td>
                <td className={`px-4 py-3 text-right font-bold ${data.operatingTotal >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                  {formatCurrency(data.operatingTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Investing Activities */}
      <div>
        <h3 className="text-lg font-semibold text-[#e8e8f0] mb-3">Investing Activities</h3>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="border-b border-[#2a2a3d]">
                <th className="px-4 py-3 text-left text-[#8888a0] font-semibold">Item</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.investing.map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-[#2a2a3d] last:border-0">
                  <td className="px-4 py-3 text-[#e8e8f0]">{item.item}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${item.amount >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
              <tr className="bg-[#2a2a3d]">
                <td className="px-4 py-3 text-[#e8e8f0] font-semibold">Investing Cash Flow</td>
                <td className={`px-4 py-3 text-right font-bold ${data.investingTotal >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                  {formatCurrency(data.investingTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Financing Activities */}
      <div>
        <h3 className="text-lg font-semibold text-[#e8e8f0] mb-3">Financing Activities</h3>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="border-b border-[#2a2a3d]">
                <th className="px-4 py-3 text-left text-[#8888a0] font-semibold">Item</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.financing.map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-[#2a2a3d] last:border-0">
                  <td className="px-4 py-3 text-[#e8e8f0]">{item.item}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${item.amount >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
              <tr className="bg-[#2a2a3d]">
                <td className="px-4 py-3 text-[#e8e8f0] font-semibold">Financing Cash Flow</td>
                <td className={`px-4 py-3 text-right font-bold ${data.financingTotal >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                  {formatCurrency(data.financingTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function sortByAgingPriority(items: any[]) {
  const statusPriority: Record<string, number> = { 'Past Due': 0, 'Overdue': 1, 'Current': 2 };
  return [...items].sort((a, b) => {
    const aPriority = statusPriority[a.status] ?? 3;
    const bPriority = statusPriority[b.status] ?? 3;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return (b.days || 0) - (a.days || 0);
  });
}

function ARAgingContent({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-8 text-center">
        <Clock size={48} className="mx-auto mb-4 text-[#22c55e]" />
        <h3 className="text-lg font-semibold text-[#e8e8f0] mb-2">No Outstanding Invoices</h3>
        <p className="text-[#8888a0]">All invoices are paid. Great job on collections!</p>
      </div>
    );
  }

  const sorted = sortByAgingPriority(data);
  const totalAR = data.reduce((sum, item) => sum + item.amount, 0);
  const currentAR = data.filter((item) => item.status === 'Current').reduce((sum, item) => sum + item.amount, 0);
  const overdueAR = data.filter((item) => item.status === 'Overdue').reduce((sum, item) => sum + item.amount, 0);
  const pastDueAR = data.filter((item) => item.status === 'Past Due').reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4">
          <p className="text-sm text-[#8888a0] mb-1">Total AR</p>
          <p className="text-xl font-bold text-[#06b6d4]">{formatCurrency(totalAR)}</p>
        </div>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4">
          <p className="text-sm text-[#8888a0] mb-1">Current (&lt; 30)</p>
          <p className="text-xl font-bold text-[#22c55e]">{formatCurrency(currentAR)}</p>
        </div>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4">
          <p className="text-sm text-[#8888a0] mb-1">Overdue (30-60)</p>
          <p className="text-xl font-bold text-[#eab308]">{formatCurrency(overdueAR)}</p>
        </div>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4">
          <p className="text-sm text-[#8888a0] mb-1">Past Due (&gt; 60)</p>
          <p className="text-xl font-bold text-[#ef4444]">{formatCurrency(pastDueAR)}</p>
        </div>
      </div>

      {/* Detail Table */}
      <div>
        <h3 className="text-lg font-semibold text-[#e8e8f0] mb-3">Customer Invoices</h3>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a3d]">
                <th className="px-4 py-3 text-left text-[#8888a0] font-semibold">Customer</th>
                <th className="px-4 py-3 text-left text-[#8888a0] font-semibold">Invoice</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">Amount</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">Days Old</th>
                <th className="px-4 py-3 text-center text-[#8888a0] font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((item, idx) => (
                <tr key={idx} className="border-b border-[#2a2a3d] last:border-0">
                  <td className="px-4 py-3 text-[#e8e8f0]">{item.customer}</td>
                  <td className="px-4 py-3 text-[#8888a0]">{item.invoice}</td>
                  <td className="px-4 py-3 text-right text-[#e8e8f0] font-semibold">{formatCurrency(item.amount)}</td>
                  <td className="px-4 py-3 text-right text-[#8888a0]">{item.days}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant={item.status === 'Current' ? 'success' : item.status === 'Overdue' ? 'warning' : 'danger'}
                    >
                      {item.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function APAgingContent({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-8 text-center">
        <AlertCircle size={48} className="mx-auto mb-4 text-[#22c55e]" />
        <h3 className="text-lg font-semibold text-[#e8e8f0] mb-2">No Outstanding Bills</h3>
        <p className="text-[#8888a0]">All bills are paid. You're current with all vendors.</p>
      </div>
    );
  }

  const sorted = sortByAgingPriority(data);
  const totalAP = data.reduce((sum, item) => sum + item.amount, 0);
  const currentAP = data.filter((item) => item.status === 'Current').reduce((sum, item) => sum + item.amount, 0);
  const overdueAP = data.filter((item) => item.status === 'Overdue').reduce((sum, item) => sum + item.amount, 0);
  const pastDueAP = data.filter((item) => item.status === 'Past Due').reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4">
          <p className="text-sm text-[#8888a0] mb-1">Total AP</p>
          <p className="text-xl font-bold text-[#06b6d4]">{formatCurrency(totalAP)}</p>
        </div>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4">
          <p className="text-sm text-[#8888a0] mb-1">Current (&lt; 30)</p>
          <p className="text-xl font-bold text-[#22c55e]">{formatCurrency(currentAP)}</p>
        </div>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4">
          <p className="text-sm text-[#8888a0] mb-1">Overdue (30-60)</p>
          <p className="text-xl font-bold text-[#eab308]">{formatCurrency(overdueAP)}</p>
        </div>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4">
          <p className="text-sm text-[#8888a0] mb-1">Past Due (&gt; 60)</p>
          <p className="text-xl font-bold text-[#ef4444]">{formatCurrency(pastDueAP)}</p>
        </div>
      </div>

      {/* Detail Table */}
      <div>
        <h3 className="text-lg font-semibold text-[#e8e8f0] mb-3">Vendor Bills</h3>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a3d]">
                <th className="px-4 py-3 text-left text-[#8888a0] font-semibold">Vendor</th>
                <th className="px-4 py-3 text-left text-[#8888a0] font-semibold">Invoice #</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">Amount</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">Days Old</th>
                <th className="px-4 py-3 text-center text-[#8888a0] font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((item, idx) => (
                <tr key={idx} className="border-b border-[#2a2a3d] last:border-0">
                  <td className="px-4 py-3 text-[#e8e8f0]">{item.vendor}</td>
                  <td className="px-4 py-3 text-[#8888a0]">{item.invoiceNum}</td>
                  <td className="px-4 py-3 text-right text-[#e8e8f0] font-semibold">{formatCurrency(item.amount)}</td>
                  <td className="px-4 py-3 text-right text-[#8888a0]">{item.days}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant={item.status === 'Current' ? 'success' : item.status === 'Overdue' ? 'warning' : 'danger'}
                    >
                      {item.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CollectionAnalysisContent({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-8 text-center">
        <Briefcase size={48} className="mx-auto mb-4 text-[#8888a0]" />
        <h3 className="text-lg font-semibold text-[#e8e8f0] mb-2">No Claims Tracking Data</h3>
        <p className="text-[#8888a0]">Connect a project management integration (NextGen, athenahealth) to see claims tracking data.</p>
      </div>
    );
  }

  const totalContractAmount = data.reduce((sum, item) => sum + item.contractAmount, 0);
  const totalCost = data.reduce((sum, item) => sum + item.totalCost, 0);
  const totalMargin = data.reduce((sum, item) => sum + item.margin, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4">
          <p className="text-sm text-[#8888a0] mb-1">Total Revenue</p>
          <p className="text-xl font-bold text-[#22c55e]">{formatCurrency(totalContractAmount)}</p>
        </div>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4">
          <p className="text-sm text-[#8888a0] mb-1">Total Cost</p>
          <p className="text-xl font-bold text-[#ef4444]">{formatCurrency(totalCost)}</p>
        </div>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4">
          <p className="text-sm text-[#8888a0] mb-1">Total Margin</p>
          <p className="text-xl font-bold text-[#06b6d4]">{formatCurrency(totalMargin)}</p>
        </div>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4">
          <p className="text-sm text-[#8888a0] mb-1">Margin %</p>
          <p className="text-xl font-bold text-[#10b981]">{formatPercent((totalMargin / totalContractAmount) * 100, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</p>
        </div>
      </div>

      {/* Detail Table */}
      <div>
        <h3 className="text-lg font-semibold text-[#e8e8f0] mb-3">Project Costs</h3>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a3d]">
                <th className="px-4 py-3 text-left text-[#8888a0] font-semibold">Job #</th>
                <th className="px-4 py-3 text-left text-[#8888a0] font-semibold">Job Name</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">Labor</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">Materials</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">Overhead</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">Total Cost</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">Revenue</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">Margin</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">% Complete</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr key={idx} className="border-b border-[#2a2a3d] last:border-0">
                  <td className="px-4 py-3 text-[#06b6d4] font-semibold">{item.jobNumber}</td>
                  <td className="px-4 py-3 text-[#e8e8f0]">{item.jobName}</td>
                  <td className="px-4 py-3 text-right text-[#8888a0]">{formatCurrency(item.laborCost)}</td>
                  <td className="px-4 py-3 text-right text-[#8888a0]">{formatCurrency(item.materialCost)}</td>
                  <td className="px-4 py-3 text-right text-[#8888a0]">{formatCurrency(item.overheadCost)}</td>
                  <td className="px-4 py-3 text-right text-[#ef4444] font-semibold">{formatCurrency(item.totalCost)}</td>
                  <td className="px-4 py-3 text-right text-[#22c55e] font-semibold">{formatCurrency(item.contractAmount)}</td>
                  <td className="px-4 py-3 text-right text-[#06b6d4] font-semibold">{formatCurrency(item.margin)}</td>
                  <td className="px-4 py-3 text-right text-[#8888a0]">{item.percentComplete}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PayerPerformanceContent({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-8 text-center">
        <Target size={48} className="mx-auto mb-4 text-[#8888a0]" />
        <h3 className="text-lg font-semibold text-[#e8e8f0] mb-2">No Claims Pending Data</h3>
        <p className="text-[#8888a0]">Connect a project management integration (NextGen, athenahealth) to see work-in-progress data.</p>
      </div>
    );
  }

  const totalWIP = data.reduce((sum, item) => sum + item.wipInventory, 0);
  const totalInvoiced = data.reduce((sum, item) => sum + item.invoiced, 0);
  const totalRevenue = data.reduce((sum, item) => sum + item.totalRevenue, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4">
          <p className="text-sm text-[#8888a0] mb-1">Total Claims Pending</p>
          <p className="text-xl font-bold text-[#06b6d4]">{formatCurrency(totalWIP)}</p>
        </div>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4">
          <p className="text-sm text-[#8888a0] mb-1">Total Invoiced</p>
          <p className="text-xl font-bold text-[#22c55e]">{formatCurrency(totalInvoiced)}</p>
        </div>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4">
          <p className="text-sm text-[#8888a0] mb-1">Total Revenue</p>
          <p className="text-xl font-bold text-[#10b981]">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4">
          <p className="text-sm text-[#8888a0] mb-1">Unbilled</p>
          <p className="text-xl font-bold text-[#eab308]">{formatCurrency(totalRevenue - totalInvoiced)}</p>
        </div>
      </div>

      {/* Detail Table */}
      <div>
        <h3 className="text-lg font-semibold text-[#e8e8f0] mb-3">Work in Progress by Project</h3>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a3d]">
                <th className="px-4 py-3 text-left text-[#8888a0] font-semibold">Job #</th>
                <th className="px-4 py-3 text-left text-[#8888a0] font-semibold">Job Name</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">Claims Pending Inventory</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">Invoiced</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">Total Revenue</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">Remaining</th>
                <th className="px-4 py-3 text-center text-[#8888a0] font-semibold">Billing Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr key={idx} className="border-b border-[#2a2a3d] last:border-0">
                  <td className="px-4 py-3 text-[#06b6d4] font-semibold">{item.jobNumber}</td>
                  <td className="px-4 py-3 text-[#e8e8f0]">{item.jobName}</td>
                  <td className="px-4 py-3 text-right text-[#8888a0]">{formatCurrency(item.wipInventory)}</td>
                  <td className="px-4 py-3 text-right text-[#22c55e] font-semibold">{formatCurrency(item.invoiced)}</td>
                  <td className="px-4 py-3 text-right text-[#10b981] font-semibold">{formatCurrency(item.totalRevenue)}</td>
                  <td className="px-4 py-3 text-right text-[#eab308] font-semibold">{formatCurrency(item.remaining)}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={item.billingStatus === 'On Track' ? 'success' : 'warning'}>
                      {item.billingStatus}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TaxContent({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4">
          <p className="text-sm text-[#8888a0] mb-1">Taxable Income</p>
          <p className="text-xl font-bold text-[#06b6d4]">{formatCurrency(data.taxableIncome)}</p>
        </div>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4">
          <p className="text-sm text-[#8888a0] mb-1">Total Deductions</p>
          <p className="text-xl font-bold text-[#22c55e]">{formatCurrency(data.totalDeductions)}</p>
        </div>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4">
          <p className="text-sm text-[#8888a0] mb-1">Estimated Tax Liability</p>
          <p className="text-xl font-bold text-[#ef4444]">{formatCurrency(data.totalEstimatedTax)}</p>
        </div>
      </div>

      {/* Deductions */}
      <div>
        <h3 className="text-lg font-semibold text-[#e8e8f0] mb-3">Deductions</h3>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="border-b border-[#2a2a3d]">
                <th className="px-4 py-3 text-left text-[#8888a0] font-semibold">Deduction Item</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.deductions.map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-[#2a2a3d] last:border-0">
                  <td className="px-4 py-3 text-[#e8e8f0]">{item.item}</td>
                  <td className="px-4 py-3 text-right text-[#22c55e] font-semibold">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
              <tr className="bg-[#2a2a3d]">
                <td className="px-4 py-3 text-[#e8e8f0] font-semibold">Total Deductions</td>
                <td className="px-4 py-3 text-right text-[#22c55e] font-bold">{formatCurrency(data.totalDeductions)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Calculation */}
      <div>
        <h3 className="text-lg font-semibold text-[#e8e8f0] mb-3">Tax Calculation</h3>
        <div className="space-y-3">
          <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4 flex justify-between">
            <span className="text-[#8888a0]">Adjusted Gross Income</span>
            <span className="text-[#e8e8f0] font-semibold">{formatCurrency(data.adjustedIncome)}</span>
          </div>
          <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4 flex justify-between">
            <span className="text-[#8888a0]">Federal Income Tax</span>
            <span className="text-[#ef4444] font-semibold">{formatCurrency(data.estimatedFederalTax)}</span>
          </div>
          <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4 flex justify-between">
            <span className="text-[#8888a0]">State Income Tax</span>
            <span className="text-[#ef4444] font-semibold">{formatCurrency(data.estimatedStateTax)}</span>
          </div>
          <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4 flex justify-between">
            <span className="text-[#8888a0]">Self-Employment Tax</span>
            <span className="text-[#ef4444] font-semibold">{formatCurrency(data.estimatedSelfEmploymentTax)}</span>
          </div>
        </div>
      </div>

      {/* Quarterly Payments */}
      <div>
        <h3 className="text-lg font-semibold text-[#e8e8f0] mb-3">Estimated Quarterly Payments</h3>
        <div className="grid grid-cols-4 gap-4">
          {data.quarterlyPayments.map((q: any, idx: number) => (
            <div key={idx} className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4 text-center">
              <p className="text-sm text-[#8888a0] mb-2">{q.quarter}</p>
              <p className="text-lg font-bold text-[#06b6d4]">{formatCurrency(q.amount)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProviderProductivityContent({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-8 text-center">
        <PieChart size={48} className="mx-auto mb-4 text-[#8888a0]" />
        <h3 className="text-lg font-semibold text-[#e8e8f0] mb-2">No Patient Balance Data</h3>
        <p className="text-[#8888a0]">Connect a project management integration (NextGen, athenahealth) to see patient balance data.</p>
      </div>
    );
  }

  const totalRetainage = data.reduce((sum, item) => sum + item.retainageAmount, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4">
        <p className="text-sm text-[#8888a0] mb-1">Total Patient Balance</p>
        <p className="text-2xl font-bold text-[#06b6d4]">{formatCurrency(totalRetainage)}</p>
      </div>

      {/* Detail Table */}
      <div>
        <h3 className="text-lg font-semibold text-[#e8e8f0] mb-3">Project Patient Balance</h3>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a3d]">
                <th className="px-4 py-3 text-left text-[#8888a0] font-semibold">Job #</th>
                <th className="px-4 py-3 text-left text-[#8888a0] font-semibold">Project Name</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">Contract Amount</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">Patient Balance %</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">Patient Balance Amount</th>
                <th className="px-4 py-3 text-center text-[#8888a0] font-semibold">Due Date</th>
                <th className="px-4 py-3 text-center text-[#8888a0] font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr key={idx} className="border-b border-[#2a2a3d] last:border-0">
                  <td className="px-4 py-3 text-[#06b6d4] font-semibold">{item.jobNumber}</td>
                  <td className="px-4 py-3 text-[#e8e8f0]">{item.jobName}</td>
                  <td className="px-4 py-3 text-right text-[#8888a0]">{formatCurrency(item.contractAmount)}</td>
                  <td className="px-4 py-3 text-right text-[#8888a0]">{item.retainagePercent}%</td>
                  <td className="px-4 py-3 text-right text-[#06b6d4] font-semibold">{formatCurrency(item.retainageAmount)}</td>
                  <td className="px-4 py-3 text-center text-[#8888a0]">{formatDate(item.dueDate, { format: 'short' })}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="info">{item.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DenialAnalysisContent({ data }: { data: any[] }) {
  const totalBudget = data.reduce((sum, item) => sum + item.budget, 0);
  const totalActual = data.reduce((sum, item) => sum + item.actual, 0);
  const totalVariance = totalBudget - totalActual;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4">
          <p className="text-sm text-[#8888a0] mb-1">Total Budget</p>
          <p className="text-xl font-bold text-[#06b6d4]">{formatCurrency(totalBudget)}</p>
        </div>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg p-4">
          <p className="text-sm text-[#8888a0] mb-1">Total Actual</p>
          <p className="text-xl font-bold text-[#ef4444]">{formatCurrency(totalActual)}</p>
        </div>
        <div
          className="border rounded-lg p-4"
          style={{
            backgroundColor: totalVariance >= 0 ? '#22c55e/10' : '#ef4444/10',
            borderColor: totalVariance >= 0 ? '#22c55e/30' : '#ef4444/30',
          }}
        >
          <p className="text-sm text-[#8888a0] mb-1">Total Variance</p>
          <p
            className="text-xl font-bold"
            style={{ color: totalVariance >= 0 ? '#22c55e' : '#ef4444' }}
          >
            {formatCurrency(totalVariance)}
          </p>
        </div>
      </div>

      {/* Detail Table */}
      <div>
        <h3 className="text-lg font-semibold text-[#e8e8f0] mb-3">Budget vs Actual Comparison</h3>
        <div className="bg-[#1a1a26] border border-[#2a2a3d] rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a3d]">
                <th className="px-4 py-3 text-left text-[#8888a0] font-semibold">Category</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">Budget</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">Actual</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">Variance</th>
                <th className="px-4 py-3 text-right text-[#8888a0] font-semibold">Variance %</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => {
                const isUnderBudget = item.variance >= 0;
                return (
                  <tr key={idx} className="border-b border-[#2a2a3d] last:border-0">
                    <td className="px-4 py-3 text-[#e8e8f0]">{item.category}</td>
                    <td className="px-4 py-3 text-right text-[#8888a0]">{formatCurrency(item.budget)}</td>
                    <td className="px-4 py-3 text-right text-[#ef4444]">{formatCurrency(item.actual)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${isUnderBudget ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                      {formatCurrency(item.variance)}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${isUnderBudget ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                      {isUnderBudget ? '+' : ''}{formatPercent(item.variancePercent, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
