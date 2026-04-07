'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell,
} from 'recharts';
import {
  Package, AlertTriangle, TrendingUp, TrendingDown, DollarSign,
  RotateCcw, Clock, AlertCircle,
} from 'lucide-react';

const inventoryTurnover = [
  { month: 'Jan', turnover: 4.2, daysOnHand: 87 },
  { month: 'Feb', turnover: 4.5, daysOnHand: 81 },
  { month: 'Mar', turnover: 4.1, daysOnHand: 89 },
  { month: 'Apr', turnover: 4.8, daysOnHand: 76 },
  { month: 'May', turnover: 5.1, daysOnHand: 72 },
  { month: 'Jun', turnover: 5.3, daysOnHand: 69 },
];

const skuPerformance = [
  { sku: 'SKU-001', name: 'Organic Face Serum', units: 1240, revenue: 49600, margin: 68, velocity: 'fast' },
  { sku: 'SKU-002', name: 'Vitamin C Moisturizer', units: 890, revenue: 35600, margin: 62, velocity: 'fast' },
  { sku: 'SKU-003', name: 'Night Repair Cream', units: 620, revenue: 37200, margin: 71, velocity: 'medium' },
  { sku: 'SKU-004', name: 'Sunscreen SPF 50', units: 1580, revenue: 39500, margin: 45, velocity: 'fast' },
  { sku: 'SKU-005', name: 'Eye Cream Deluxe', units: 340, revenue: 23800, margin: 74, velocity: 'slow' },
  { sku: 'SKU-006', name: 'Lip Balm Set (3pk)', units: 2100, revenue: 25200, margin: 58, velocity: 'fast' },
  { sku: 'SKU-007', name: 'Body Oil Luxe', units: 180, revenue: 12600, margin: 66, velocity: 'slow' },
  { sku: 'SKU-008', name: 'Cleanser Foam', units: 920, revenue: 18400, margin: 55, velocity: 'medium' },
];

const inventoryAging = [
  { range: '0-30 days', value: 145000, pct: 42, color: '#10B981' },
  { range: '31-60 days', value: 98000, pct: 28, color: '#8B5CF6' },
  { range: '61-90 days', value: 62000, pct: 18, color: '#F59E0B' },
  { range: '90+ days', value: 42000, pct: 12, color: '#EF4444' },
];

const COLORS = ['#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

export default function InventoryPage() {
  const totalInventoryValue = inventoryAging.reduce((sum, item) => sum + item.value, 0);
  const avgTurnover = inventoryTurnover[inventoryTurnover.length - 1].turnover;
  const avgDaysOnHand = inventoryTurnover[inventoryTurnover.length - 1].daysOnHand;
  const deadStockValue = inventoryAging.find(a => a.range === '90+ days')?.value || 0;
  const deadStockPct = ((deadStockValue / totalInventoryValue) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Inventory HQ</h1>
        <p className="text-gray-400 text-sm mt-1">Inventory health, turnover, and SKU-level analytics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-gray-900 border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-violet-400" />
            <p className="text-sm text-gray-400">Inventory Value</p>
          </div>
          <p className="text-2xl font-bold text-white">${(totalInventoryValue / 1000).toFixed(0)}K</p>
          <p className="text-xs text-gray-500 mt-1">Across all channels</p>
        </Card>
        <Card className="p-5 bg-gray-900 border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <RotateCcw className="w-4 h-4 text-green-400" />
            <p className="text-sm text-gray-400">Turnover Rate</p>
          </div>
          <p className="text-2xl font-bold text-white">{avgTurnover}x</p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3 text-green-400" />
            <span className="text-xs text-green-400">Improving</span>
          </div>
        </Card>
        <Card className="p-5 bg-gray-900 border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <p className="text-sm text-gray-400">Days on Hand</p>
          </div>
          <p className="text-2xl font-bold text-white">{avgDaysOnHand} days</p>
          <p className="text-xs text-green-400 mt-1">Below 90-day target</p>
        </Card>
        <Card className="p-5 bg-gray-900 border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <p className="text-sm text-gray-400">Dead Stock</p>
          </div>
          <p className="text-2xl font-bold text-red-400">${(deadStockValue / 1000).toFixed(0)}K</p>
          <p className="text-xs text-gray-500 mt-1">{deadStockPct}% of inventory</p>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Turnover Trend */}
        <Card className="p-6 bg-gray-900 border-gray-800">
          <h3 className="text-lg font-medium text-white mb-4">Inventory Turnover Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={inventoryTurnover}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
                <Legend />
                <Line type="monotone" dataKey="turnover" name="Turnover Rate" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Inventory Aging */}
        <Card className="p-6 bg-gray-900 border-gray-800">
          <h3 className="text-lg font-medium text-white mb-4">Inventory Aging</h3>
          <div className="h-64 flex items-center">
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie data={inventoryAging} dataKey="value" nameKey="range" cx="50%" cy="50%" outerRadius={80} label={false}>
                  {inventoryAging.map((entry, index) => (
                    <Cell key={entry.range} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  formatter={(value: number) => [`$${(value / 1000).toFixed(0)}K`, undefined]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {inventoryAging.map((item, idx) => (
                <div key={item.range} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                    <span className="text-sm text-gray-300">{item.range}</span>
                  </div>
                  <span className="text-sm text-white font-medium">{item.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Days on Hand Trend */}
      <Card className="p-6 bg-gray-900 border-gray-800">
        <h3 className="text-lg font-medium text-white mb-4">Days on Hand Trend</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={inventoryTurnover}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
              <Bar dataKey="daysOnHand" name="Days on Hand" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* SKU Performance Table */}
      <Card className="p-6 bg-gray-900 border-gray-800">
        <h3 className="text-lg font-medium text-white mb-4">SKU Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-2 text-gray-400 font-medium">SKU</th>
                <th className="text-left py-3 px-2 text-gray-400 font-medium">Product</th>
                <th className="text-right py-3 px-2 text-gray-400 font-medium">Units Sold</th>
                <th className="text-right py-3 px-2 text-gray-400 font-medium">Revenue</th>
                <th className="text-right py-3 px-2 text-gray-400 font-medium">Margin</th>
                <th className="text-right py-3 px-2 text-gray-400 font-medium">Velocity</th>
              </tr>
            </thead>
            <tbody>
              {skuPerformance.map((sku) => (
                <tr key={sku.sku} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="py-3 px-2 text-gray-500 font-mono text-xs">{sku.sku}</td>
                  <td className="py-3 px-2 text-white">{sku.name}</td>
                  <td className="py-3 px-2 text-right text-gray-300">{sku.units.toLocaleString()}</td>
                  <td className="py-3 px-2 text-right text-white font-medium">${sku.revenue.toLocaleString()}</td>
                  <td className="py-3 px-2 text-right text-green-400">{sku.margin}%</td>
                  <td className="py-3 px-2 text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      sku.velocity === 'fast' ? 'bg-green-900/30 text-green-400' :
                      sku.velocity === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-red-900/30 text-red-400'
                    }`}>
                      {sku.velocity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
