"use client"

import { useState, useEffect } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  CreditCard,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface DashboardContentProps {
  dashboardData: any
  isLoading: boolean
  onSync: () => void
}

export default function DashboardContent({ dashboardData, isLoading, onSync }: DashboardContentProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    await onSync()
    setSyncing(false)
  }

  const monthlyRevenue = [
    { month: 'Jan', revenue: 285000, orders: 3420, cac: 45 },
    { month: 'Feb', revenue: 312000, orders: 3740, cac: 42 },
    { month: 'Mar', revenue: 298000, orders: 3575, cac: 48 },
    { month: 'Apr', revenue: 325000, orders: 3900, cac: 41 },
    { month: 'May', revenue: 342000, orders: 4100, cac: 39 },
    { month: 'Jun', revenue: 358000, orders: 4295, cac: 38 },
  ]

  const inventoryMetrics = [
    { month: 'Jan', turnover: 4.2, daysOutstanding: 52 },
    { month: 'Feb', turnover: 4.5, daysOutstanding: 48 },
    { month: 'Mar', turnover: 4.1, daysOutstanding: 54 },
    { month: 'Apr', turnover: 4.8, daysOutstanding: 45 },
    { month: 'May', turnover: 5.1, daysOutstanding: 42 },
    { month: 'Jun', turnover: 5.3, daysOutstanding: 40 },
  ]

  const cashflowData = [
    { month: 'Jan', inflow: 275000, outflow: 225000, net: 50000 },
    { month: 'Feb', inflow: 298000, outflow: 242000, net: 56000 },
    { month: 'Mar', inflow: 285000, outflow: 238000, net: 47000 },
    { month: 'Apr', inflow: 312000, outflow: 248000, net: 64000 },
    { month: 'May', inflow: 328000, outflow: 255000, net: 73000 },
    { month: 'Jun', inflow: 342000, outflow: 262000, net: 80000 },
  ]

  const mockInvoices = [
    { id: 'INV-001', customer: 'Amazon FBA', amount: 45280, status: 'paid', date: '2024-06-15' },
    { id: 'INV-002', customer: 'Shopify Payments', amount: 28350, status: 'pending', date: '2024-06-18' },
    { id: 'INV-003', customer: 'Wholesale Partner A', amount: 15200, status: 'overdue', date: '2024-05-20' },
    { id: 'INV-004', customer: 'Facebook Marketplace', amount: 8920, status: 'paid', date: '2024-06-10' },
    { id: 'INV-005', customer: 'Etsy Shop', amount: 3450, status: 'pending', date: '2024-06-20' },
  ]

  const tabs = [
    { id: 'overview', label: 'Overview', icon: DollarSign },
    { id: 'invoices', label: 'Invoices', icon: CreditCard },
    { id: 'cashflow', label: 'Cash Flow', icon: TrendingUp },
    { id: 'reports', label: 'Reports', icon: Package },
  ]

  const kpiCards = [
    {
      title: 'Gross Merchandise Volume',
      value: '$358,000',
      change: '+18.5%',
      trend: 'up',
      icon: ShoppingCart,
      description: 'Last 30 days'
    },
    {
      title: 'Contribution Margin/Order',
      value: '$22.50',
      change: '+12.3%',
      trend: 'up',
      icon: DollarSign,
      description: 'Within benchmark range'
    },
    {
      title: 'Customer Acquisition Cost',
      value: '$38',
      change: '-15.6%',
      trend: 'down',
      icon: Users,
      description: '22% of AOV'
    },
    {
      title: 'LTV:CAC Ratio',
      value: '4.2:1',
      change: '+0.8',
      trend: 'up',
      icon: TrendingUp,
      description: 'Above 3:1 minimum'
    },
  ]

  const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
      paid: 'bg-green-900/20 text-green-400 border-green-900',
      pending: 'bg-yellow-900/20 text-yellow-400 border-yellow-900',
      overdue: 'bg-red-900/20 text-red-400 border-red-900',
    }
    
    const icons = {
      paid: CheckCircle,
      pending: Clock,
      overdue: XCircle,
    }
    
    const Icon = icons[status as keyof typeof icons]
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles]}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-violet-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">SellerCFO Dashboard</h1>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Data'}
        </button>
      </div>

      <div className="flex space-x-1 border-b border-gray-800">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-violet-400 border-b-2 border-violet-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards.map((card) => {
              const Icon = card.icon
              return (
                <div key={card.title} className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-5 h-5 text-violet-400" />
                    <span className={`flex items-center gap-1 text-sm ${
                      card.trend === 'up' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {card.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {card.change}
                    </span>
                  </div>
                  <h3 className="text-gray-400 text-sm font-medium">{card.title}</h3>
                  <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{card.description}</p>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h3 className="text-lg font-medium text-white mb-4">Revenue & Orders Trend</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                      labelStyle={{ color: '#D1D5DB' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8B5CF6"
                      fill="#8B5CF6"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h3 className="text-lg font-medium text-white mb-4">Inventory Metrics</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inventoryMetrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                      labelStyle={{ color: '#D1D5DB' }}
                    />
                    <Bar dataKey="turnover" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-lg font-medium text-white mb-4">Key Metrics Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-400">MER</p>
                <p className="text-xl font-semibold text-white">3.8x</p>
                <p className="text-xs text-green-400">Within benchmark</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Blended ROAS</p>
                <p className="text-xl font-semibold text-white">3.2x</p>
                <p className="text-xs text-green-400">Above break-even</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Return Rate</p>
                <p className="text-xl font-semibold text-white">7.2%</p>
                <p className="text-xs text-yellow-400">Slightly high</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Repeat Rate</p>
                <p className="text-xl font-semibold text-white">28.5%</p>
                <p className="text-xs text-green-400">Healthy retention</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400">Total Outstanding</h3>
              <p className="text-2xl font-bold text-white mt-1">$47,970</p>
              <p className="text-sm text-gray-500 mt-1">5 invoices</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400">Overdue</h3>
              <p className="text-2xl font-bold text-red-400 mt-1">$15,200</p>
              <p className="text-sm text-gray-500 mt-1">1 invoice</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400">Paid This Month</h3>
              <p className="text-2xl font-bold text-green-400 mt-1">$228,450</p>
              <p className="text-sm text-gray-500 mt-1">18 invoices</p>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg border border-gray-800">
            <div className="p-6">
              <h3 className="text-lg font-medium text-white">Recent Invoices</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-t border-b border-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Invoice ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {mockInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-white">{invoice.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{invoice.customer}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">${invoice.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{invoice.date}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={invoice.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cashflow' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400">Cash Conversion Cycle</h3>
              <p className="text-2xl font-bold text-white mt-1">42 days</p>
              <p className="text-sm text-green-400 mt-1">Within optimal range</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400">Working Capital Ratio</h3>
              <p className="text-2xl font-bold text-white mt-1">1.8x</p>
              <p className="text-sm text-green-400 mt-1">Healthy liquidity</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400">Net Cash Flow</h3>
              <p className="text-2xl font-bold text-green-400 mt-1">+$80,000</p>
              <p className="text-sm text-gray-500 mt-1">Last month</p>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-lg font-medium text-white mb-4">Cash Flow Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashflowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#D1D5DB' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="inflow"
                    stackId="1"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.3}
                  />
                  <Area
                    type="monotone"
                    dataKey="outflow"
                    stackId="2"
                    stroke="#EF4444"
                    fill="#EF4444"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-lg font-medium text-white mb-4">Cash Flow Breakdown</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-300">Operating Activities</span>
                </div>
                <span className="text-white font-medium">+$95,000</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-gray-300">Investing Activities</span>
                </div>
                <span className="text-white font-medium">-$12,000</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-gray-300">Financing Activities</span>
                </div>
                <span className="text-white font-medium">-$3,000</span>
              </div>
              <div className="pt-4 border-t border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 font-medium">Net Cash Flow</span>
                  <span className="text-green-400 font-bold text-lg">+$80,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h3 className="text-lg font-medium text-white mb-4">Platform Performance</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Amazon FBA</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white">$185,000</span>
                    <span className="text-xs text-gray-500">52%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Shopify</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white">$125,000</span>
                    <span className="text-xs text-gray-500">35%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Other Channels</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white">$48,000</span>
                    <span className="text-xs text-gray-500">13%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h3 className="text-lg font-medium text-white mb-4">Platform Fee Analysis</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Amazon Fees</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white">$27,750</span>
                    <span className="text-xs text-red-400">15%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Shopify + Payment Processing</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white">$8,750</span>
                    <span className="text-xs text-yellow-400">7%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total Platform Fees</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">$36,500</span>
                    <span className="text-xs text-yellow-400">18.2%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-lg font-medium text-white mb-4">Key Insights</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-green-900/20 rounded-lg border border-green-900">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-green-400 font-medium">Strong Unit Economics</p>
                  <p className="text-xs text-gray-400 mt-1">Contribution margin of $22.50 per order exceeds benchmark range</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-yellow-900/20 rounded-lg border border-yellow-900">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-400 font-medium">Monitor Return Rate</p>
                  <p className="text-xs text-gray-400 mt-1">7.2% return rate is slightly above optimal range for your category</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-blue-900/20 rounded-lg border border-blue-900">
                <TrendingUp className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-400 font-medium">Growth Opportunity</p>
                  <p className="text-xs text-gray-400 mt-1">LTV:CAC ratio of 4.2:1 suggests room to increase ad spend</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}