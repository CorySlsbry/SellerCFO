'use client';

import { Card } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell,
} from 'recharts';
import {
  ShoppingCart, TrendingUp, DollarSign, Percent, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

const channelData = [
  {
    name: 'Amazon FBA',
    revenue: 185000,
    orders: 3420,
    aov: 54.09,
    margin: 18.2,
    fees: 27750,
    feePct: 15.0,
    returnRate: 8.1,
    growth: 22.4,
    color: '#FF9900',
  },
  {
    name: 'Shopify',
    revenue: 125000,
    orders: 2180,
    aov: 57.34,
    margin: 32.5,
    fees: 8750,
    feePct: 7.0,
    returnRate: 4.2,
    growth: 18.7,
    color: '#96BF48',
  },
  {
    name: 'Etsy',
    revenue: 28000,
    orders: 680,
    aov: 41.18,
    margin: 24.8,
    fees: 3920,
    feePct: 14.0,
    returnRate: 3.1,
    growth: 12.3,
    color: '#F1641E',
  },
  {
    name: 'Walmart',
    revenue: 15000,
    orders: 310,
    aov: 48.39,
    margin: 21.3,
    fees: 2250,
    feePct: 15.0,
    returnRate: 6.5,
    growth: 45.2,
    color: '#0071CE',
  },
  {
    name: 'TikTok Shop',
    revenue: 5000,
    orders: 195,
    aov: 25.64,
    margin: 15.8,
    fees: 400,
    feePct: 8.0,
    returnRate: 9.2,
    growth: 120.0,
    color: '#FF004F',
  },
];

const monthlyByChannel = [
  { month: 'Jan', Amazon: 152000, Shopify: 95000, Etsy: 22000, Walmart: 8000, TikTok: 2000 },
  { month: 'Feb', Amazon: 160000, Shopify: 102000, Etsy: 24000, Walmart: 10000, TikTok: 3000 },
  { month: 'Mar', Amazon: 155000, Shopify: 98000, Etsy: 23000, Walmart: 11000, TikTok: 3500 },
  { month: 'Apr', Amazon: 170000, Shopify: 110000, Etsy: 25000, Walmart: 12000, TikTok: 4000 },
  { month: 'May', Amazon: 178000, Shopify: 118000, Etsy: 26000, Walmart: 14000, TikTok: 4500 },
  { month: 'Jun', Amazon: 185000, Shopify: 125000, Etsy: 28000, Walmart: 15000, TikTok: 5000 },
];

const COLORS = ['#FF9900', '#96BF48', '#F1641E', '#0071CE', '#FF004F'];

export default function ChannelAnalyticsPage() {
  const totalRevenue = channelData.reduce((sum, ch) => sum + ch.revenue, 0);
  const totalOrders = channelData.reduce((sum, ch) => sum + ch.orders, 0);
  const totalFees = channelData.reduce((sum, ch) => sum + ch.fees, 0);
  const blendedAOV = totalRevenue / totalOrders;

  const pieData = channelData.map(ch => ({ name: ch.name, value: ch.revenue }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Channel Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">Performance breakdown by sales channel</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-gray-900 border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-violet-400" />
            <p className="text-sm text-gray-400">Total Revenue</p>
          </div>
          <p className="text-2xl font-bold text-white">${(totalRevenue / 1000).toFixed(0)}K</p>
          <p className="text-xs text-gray-500 mt-1">{channelData.length} active channels</p>
        </Card>
        <Card className="p-5 bg-gray-900 border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="w-4 h-4 text-green-400" />
            <p className="text-sm text-gray-400">Total Orders</p>
          </div>
          <p className="text-2xl font-bold text-white">{totalOrders.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
        </Card>
        <Card className="p-5 bg-gray-900 border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <p className="text-sm text-gray-400">Blended AOV</p>
          </div>
          <p className="text-2xl font-bold text-white">${blendedAOV.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Across all channels</p>
        </Card>
        <Card className="p-5 bg-gray-900 border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="w-4 h-4 text-red-400" />
            <p className="text-sm text-gray-400">Total Platform Fees</p>
          </div>
          <p className="text-2xl font-bold text-red-400">${(totalFees / 1000).toFixed(1)}K</p>
          <p className="text-xs text-gray-500 mt-1">{((totalFees / totalRevenue) * 100).toFixed(1)}% of revenue</p>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Channel Over Time */}
        <Card className="p-6 bg-gray-900 border-gray-800">
          <h3 className="text-lg font-medium text-white mb-4">Revenue by Channel</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyByChannel}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  formatter={(value: number) => [`$${(value / 1000).toFixed(0)}K`, undefined]}
                />
                <Legend />
                <Bar dataKey="Amazon" stackId="a" fill="#FF9900" />
                <Bar dataKey="Shopify" stackId="a" fill="#96BF48" />
                <Bar dataKey="Etsy" stackId="a" fill="#F1641E" />
                <Bar dataKey="Walmart" stackId="a" fill="#0071CE" />
                <Bar dataKey="TikTok" stackId="a" fill="#FF004F" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Revenue Share Pie */}
        <Card className="p-6 bg-gray-900 border-gray-800">
          <h3 className="text-lg font-medium text-white mb-4">Revenue Share</h3>
          <div className="h-64 flex items-center">
            <ResponsiveContainer width="55%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  formatter={(value: number) => [`$${(value / 1000).toFixed(0)}K`, undefined]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {channelData.map((ch, idx) => (
                <div key={ch.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                    <span className="text-gray-300">{ch.name}</span>
                  </div>
                  <span className="text-white font-medium">{((ch.revenue / totalRevenue) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Channel Performance Table */}
      <Card className="p-6 bg-gray-900 border-gray-800">
        <h3 className="text-lg font-medium text-white mb-4">Channel Performance Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-2 text-gray-400 font-medium">Channel</th>
                <th className="text-right py-3 px-2 text-gray-400 font-medium">Revenue</th>
                <th className="text-right py-3 px-2 text-gray-400 font-medium">Orders</th>
                <th className="text-right py-3 px-2 text-gray-400 font-medium">AOV</th>
                <th className="text-right py-3 px-2 text-gray-400 font-medium">Margin</th>
                <th className="text-right py-3 px-2 text-gray-400 font-medium">Fees</th>
                <th className="text-right py-3 px-2 text-gray-400 font-medium">Return Rate</th>
                <th className="text-right py-3 px-2 text-gray-400 font-medium">Growth</th>
              </tr>
            </thead>
            <tbody>
              {channelData.map((ch) => (
                <tr key={ch.name} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ch.color }} />
                      <span className="text-white font-medium">{ch.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right text-white">${(ch.revenue / 1000).toFixed(0)}K</td>
                  <td className="py-3 px-2 text-right text-gray-300">{ch.orders.toLocaleString()}</td>
                  <td className="py-3 px-2 text-right text-gray-300">${ch.aov.toFixed(2)}</td>
                  <td className="py-3 px-2 text-right text-green-400">{ch.margin}%</td>
                  <td className="py-3 px-2 text-right text-red-400">{ch.feePct}%</td>
                  <td className="py-3 px-2 text-right text-yellow-400">{ch.returnRate}%</td>
                  <td className="py-3 px-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <ArrowUpRight className="w-3 h-3 text-green-400" />
                      <span className="text-green-400">{ch.growth}%</span>
                    </div>
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
