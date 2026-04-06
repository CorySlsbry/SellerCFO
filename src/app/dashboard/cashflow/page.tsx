'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CashFlowChart } from '@/components/charts/cashflow-chart';
import { AlertCircle } from 'lucide-react';
import { formatCompactCurrency } from '@/lib/utils';
import Link from 'next/link';
import type { DashboardData, CashFlowData, Invoice } from '@/types';

export default function CashFlowPage() {
  const [loading, setLoading] = useState(true);
  const [cashFlow, setCashFlow] = useState<CashFlowData[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [hasData, setHasData] = useState(false);

  const getLocationId = () =>
    typeof window !== 'undefined' ? window.localStorage?.getItem?.('selectedLocationId') || null : null;

  const fetchData = useCallback(async (clientId?: string | null, locationId?: string | null) => {
    try {
      setLoading(true);
      const p = new URLSearchParams();
      if (clientId) p.set('clientCompanyId', clientId);
      if (locationId) p.set('locationId', locationId);
      const qs = p.size > 0 ? '?' + p.toString() : '';
      const response = await fetch(`/api/qbo/data${qs}`);
      const result = await response.json();

      if (result.success && result.data) {
        const data: DashboardData = result.data;
        setCashFlow(data.cash_flow || []);
        setInvoices(data.invoices || []);
        setHasData(
          (data.cash_flow && data.cash_flow.length > 0) ||
          (data.invoices && data.invoices.length > 0)
        );
      } else {
        setHasData(false);
      }
    } catch (error) {
      console.error('Error fetching cash flow data:', error);
      setHasData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedClient = typeof window !== 'undefined'
      ? window.localStorage?.getItem?.('selectedClientId') || null : null;
    const storedLocation = getLocationId();
    fetchData(storedClient, storedLocation);

    const handleClientChanged = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      fetchData(detail?.clientId ?? null, getLocationId());
    };
    const handleLocationChanged = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const cid = typeof window !== 'undefined'
        ? window.localStorage?.getItem?.('selectedClientId') || null : null;
      fetchData(cid, detail?.locationId ?? null);
    };

    window.addEventListener('clientChanged', handleClientChanged);
    window.addEventListener('locationChanged', handleLocationChanged);
    return () => {
      window.removeEventListener('clientChanged', handleClientChanged);
      window.removeEventListener('locationChanged', handleLocationChanged);
    };
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-[#8888a0]">Loading cash flow data...</div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="space-y-6">
        <Card className="p-8 bg-gradient-to-br from-[#06b6d4]/10 to-[#1a1a26] border-[#06b6d4]/20">
          <div className="text-center py-12">
            <AlertCircle className="mx-auto mb-4 text-[#8888a0]" size={48} />
            <h2 className="text-xl font-semibold text-[#e8e8f0] mb-2">
              No Cash Flow Data
            </h2>
            <p className="text-[#8888a0] mb-6">
              Connect QuickBooks and sync to see your cash flow data
            </p>
            <Link
              href="/dashboard/integrations"
              className="inline-block px-6 py-2 bg-[#06b6d4] text-white rounded-lg hover:bg-[#06b6d4]/90 transition-colors"
            >
              Go to Integrations
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Map cash_flow data to chart format (chart expects inflows/outflows plural + isForecast)
  const chartData = cashFlow.map((cf) => ({
    month: cf.month,
    inflows: cf.inflow,
    outflows: cf.outflow,
    net: cf.net,
    isForecast: false,
  }));

  // Calculate totals
  const totalInflows = cashFlow.reduce((sum, cf) => sum + cf.inflow, 0);
  const totalOutflows = cashFlow.reduce((sum, cf) => sum + cf.outflow, 0);
  const netCashFlow = totalInflows - totalOutflows;

  // Outstanding invoices (unpaid)
  const outstandingInvoices = invoices.filter(
    (inv) => inv.status !== 'paid'
  );
  const totalReceivable = outstandingInvoices.reduce(
    (sum, inv) => sum + inv.amount,
    0
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-[#22c55e]/10 to-[#1a1a26] border-[#22c55e]/20">
          <p className="text-[#8888a0] text-sm mb-1">Total Revenue (12 mo)</p>
          <p className="text-3xl font-bold text-[#22c55e]">
            {formatCompactCurrency(totalInflows)}
          </p>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-[#ef4444]/10 to-[#1a1a26] border-[#ef4444]/20">
          <p className="text-[#8888a0] text-sm mb-1">Total Expenses (12 mo)</p>
          <p className="text-3xl font-bold text-[#ef4444]">
            {formatCompactCurrency(totalOutflows)}
          </p>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-[#06b6d4]/10 to-[#1a1a26] border-[#06b6d4]/20">
          <p className="text-[#8888a0] text-sm mb-1">Net Cash Flow</p>
          <p className={`text-3xl font-bold ${netCashFlow >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
            {formatCompactCurrency(netCashFlow)}
          </p>
        </Card>
      </div>

      {/* Cash Flow Chart */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Monthly Cash Flow</h2>
        <CashFlowChart data={chartData} />
      </Card>

      {/* Outstanding Receivables */}
      {outstandingInvoices.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Outstanding Receivables</h2>
            <span className="text-sm font-bold text-[#22c55e]">
              {formatCompactCurrency(totalReceivable)} total
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a3d]">
                  <th className="text-left py-2 px-2 text-[#8888a0] font-medium">Customer</th>
                  <th className="text-right py-2 px-2 text-[#8888a0] font-medium">Amount</th>
                  <th className="text-right py-2 px-2 text-[#8888a0] font-medium">Due</th>
                  <th className="text-right py-2 px-2 text-[#8888a0] font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {outstandingInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-[#2a2a3d] hover:bg-[#1a1a26] transition-colors"
                  >
                    <td className="py-3 px-2 text-[#e8e8f0] truncate">
                      {inv.customer_name}
                    </td>
                    <td className="py-3 px-2 text-right text-[#e8e8f0] font-semibold">
                      {formatCompactCurrency(inv.amount)}
                    </td>
                    <td className="py-3 px-2 text-right text-[#8888a0]">
                      {inv.due_date
                        ? new Date(inv.due_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <Badge variant={inv.status === 'overdue' ? 'destructive' : 'info'}>
                        {inv.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
