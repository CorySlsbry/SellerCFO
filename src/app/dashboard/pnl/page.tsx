'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import {
  DollarSign, TrendingUp, TrendingDown, AlertCircle, ArrowUpRight,
  ArrowDownRight, Minus,
} from 'lucide-react';
import Link from 'next/link';

// Sample P&L data - will be replaced with real QBO data when connected
const monthlyPnL = [
  { month: 'Jan', revenue: 285000, cogs: 142500, grossProfit: 142500, opex: 85500, netIncome: 57000 },
  { month: 'Feb', revenue: 312000, cogs: 153000, grossProfit: 159000, opex: 88200, netIncome: 70800 },
  { month: 'Mar', revenue: 298000, cogs: 149000, grossProfit: 149000, opex: 86400, netIncome: 62600 },
  { month: 'Apr', revenue: 325000, cogs: 159250, grossProfit: 165750, opex: 91000, netIncome: 74750 },
  { month: 'May', revenue: 342000, cogs: 164160, grossProfit: 177840, opex: 93600, netIncome: 84240 },
  { month: 'Jun', revenue: 358000, cogs: 168760, grossProfit: 189240, opex: 95800, netIncome: 93440 },
];

const expenseBreakdown = [
  { category: 'Cost of Goods Sold', amount: 168760, pct: 47.1 },
  { category: 'Advertising & Marketing', amount: 39380, pct: 11.0 },
  { category: 'Platform Fees', amount: 28640, pct: 8.0 },
  { category: 'Shipping & Fulfillment', amount: 25060, pct: 7.0 },
  { category: 'Payroll & Benefits', amount: 18790, pct: 5.2 },
  { category: 'Warehouse & Storage', amount: 10740, pct: 3.0 },
  { category: 'Software & Tools', amount: 5370, pct: 1.5 },
  { category: 'Other Operating', amount: 3580, pct: 1.0 },
];

export default function PnLPage() {
  const currentMonth = monthlyPnL[monthlyPnL.length - 1];
  const prevMonth = monthlyPnL[monthlyPnL.length - 2];
  const revenueChange = ((currentMonth.revenue - prevMonth.revenue) / prevMonth.revenue * 100).toFixed(1);
  const grossMargin = (currentMonth.grossProfit / currentMonth.revenue * 100).toFixed(1);
  const netMargin = (currentMonth.netIncome / currentMonth.revenue * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">P&L Center</h1>
        <p className="text-gray-400 text-sm mt-1">Profit & Loss analysis across all channels</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-gray-900 border-gray-800">
          <p className="text-sm text-gray-400 mb-1">Revenue (MTD)</p>
          <p className="text-2xl font-bold text-white">${(currentMonth.revenue / 1000).toFixed(0)}K</p>
          <div className="flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs text-green-400">+{revenueChange}% vs last month</span>
          </div>
        </Card>
        <Card className="p-5 bg-gray-900 border-gray-800">
          <p className="text-sm text-gray-400 mb-1">Gross Profit</p>
          <p className="text-2xl font-bold text-white">${(currentMonth.grossProfit / 1000).toFixed(0)}K</p>
          <p className="text-xs text-gray-500 mt-1">{grossMargin}% margin</p>
        </Card>
        <Card className="p-5 bg-gray-900 border-gray-800">
          <p className="text-sm text-gray-400 mb-1">Operating Expenses</p>
          <p className="text-2xl font-bold text-white">${(currentMonth.opex / 1000).toFixed(0)}K</p>
          <p className="text-xs text-gray-500 mt-1">{(currentMonth.opex / currentMonth.revenue * 100).toFixed(1)}% of revenue</p>
        </Card>
        <Card className="p-5 bg-gray-900 border-gray-800">
          <p className="text-sm text-gray-400 mb-1">Net Income</p>
          <p className="text-2xl font-bold text-green-400">${(currentMonth.netIncome / 1000).toFixed(0)}K</p>
          <p className="text-xs text-gray-500 mt-1">{netMargin}% net margin</p>
        </Card>
      </div>

      {/* Revenue vs Expenses Chart */}
      <Card className="p-6 bg-gray-900 border-gray-800">
        <h3 className="text-lg font-medium text-white mb-4">Revenue vs. Expenses Trend</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyPnL}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#D1D5DB' }}
                formatter={(value: number) => [`$${(value / 1000).toFixed(1)}K`, undefined]}
              />
              <Legend />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} strokeWidth={2} />
              <Area type="monotone" dataKey="grossProfit" name="Gross Profit" stroke="#10B981" fill="#10B981" fillOpacity={0.15} strokeWidth={2} />
              <Area type="monotone" dataKey="netIncome" name="Net Income" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Expense Breakdown */}
      <Card className="p-6 bg-gray-900 border-gray-800">
        <h3 className="text-lg font-medium text-white mb-4">Expense Breakdown (Current Month)</h3>
        <div className="space-y-3">
          {expenseBreakdown.map((item) => (
            <div key={item.category} className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-300 truncate">{item.category}</span>
                  <span className="text-sm text-white font-medium">${(item.amount / 1000).toFixed(1)}K</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-violet-500 h-2 rounded-full"
                    style={{ width: `${Math.min(item.pct * 2, 100)}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-gray-500 w-12 text-right">{item.pct}%</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Contribution Margin Waterfall */}
      <Card className="p-6 bg-gray-900 border-gray-800">
        <h3 className="text-lg font-medium text-white mb-4">Contribution Margin Waterfall</h3>
        <div className="space-y-2">
          {[
            { label: 'Gross Revenue', value: 358000, color: 'text-white' },
            { label: '− Returns & Refunds', value: -25060, color: 'text-red-400' },
            { label: '= Net Revenue', value: 332940, color: 'text-white', bold: true },
            { label: '− COGS', value: -168760, color: 'text-red-400' },
            { label: '= Gross Profit', value: 189240, color: 'text-green-400', bold: true },
            { label: '− Ad Spend', value: -39380, color: 'text-red-400' },
            { label: '− Platform Fees', value: -28640, color: 'text-red-400' },
            { label: '− Shipping', value: -25060, color: 'text-red-400' },
            { label: '= Contribution Margin', value: 96160, color: 'text-green-400', bold: true },
          ].map((row) => (
            <div key={row.label} className={`flex items-center justify-between py-2 ${row.bold ? 'border-t border-gray-700 pt-3' : ''}`}>
              <span className={`text-sm ${row.bold ? 'font-semibold text-white' : 'text-gray-400'}`}>{row.label}</span>
              <span className={`text-sm font-medium ${row.color}`}>
                {row.value >= 0 ? '' : '−'}${Math.abs(row.value).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
