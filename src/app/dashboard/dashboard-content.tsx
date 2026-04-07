"use client"

import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  RefreshCw, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package,
  Users, CreditCard, AlertCircle, Clock, CheckCircle, XCircle,
  Eye, EyeOff, Percent, RotateCcw, Target, ArrowUpRight, ArrowDownRight,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react'

interface DashboardContentProps {
  dashboardData: any
  isLoading: boolean
  onSync: () => void
}

// ============================================================
// KPI Definitions — each tied to a data source/integration
// ============================================================
interface KPIDef {
  id: string
  title: string
  value: string
  change: string
  trend: 'up' | 'down' | 'neutral'
  icon: any
  description: string
  source: string // which integration feeds this
  category: 'revenue' | 'profitability' | 'acquisition' | 'inventory' | 'efficiency'
}

const ALL_KPIS: KPIDef[] = [
  // Revenue
  {
    id: 'gmv',
    title: 'Gross Merchandise Volume',
    value: '$358,000',
    change: '+18.5%',
    trend: 'up',
    icon: ShoppingCart,
    description: 'Total sales across all channels (last 30 days)',
    source: 'Sales Channels',
    category: 'revenue',
  },
  {
    id: 'net_revenue',
    title: 'Net Revenue',
    value: '$332,940',
    change: '+16.2%',
    trend: 'up',
    icon: DollarSign,
    description: 'GMV minus returns & refunds',
    source: 'Sales Channels + QBO',
    category: 'revenue',
  },
  {
    id: 'aov',
    title: 'Average Order Value',
    value: '$52.75',
    change: '+4.2%',
    trend: 'up',
    icon: Target,
    description: 'Average revenue per order',
    source: 'Sales Channels',
    category: 'revenue',
  },
  {
    id: 'total_orders',
    title: 'Total Orders',
    value: '6,785',
    change: '+12.8%',
    trend: 'up',
    icon: ShoppingCart,
    description: 'Orders processed last 30 days',
    source: 'Sales Channels',
    category: 'revenue',
  },
  // Profitability
  {
    id: 'contribution_margin',
    title: 'Contribution Margin / Order',
    value: '$22.50',
    change: '+12.3%',
    trend: 'up',
    icon: DollarSign,
    description: 'Revenue minus COGS, fees, shipping per order',
    source: 'Sales Channels + QBO',
    category: 'profitability',
  },
  {
    id: 'gross_margin',
    title: 'Gross Margin',
    value: '52.9%',
    change: '+2.1pp',
    trend: 'up',
    icon: Percent,
    description: '(Revenue - COGS) / Revenue',
    source: 'QBO',
    category: 'profitability',
  },
  {
    id: 'net_margin',
    title: 'Net Margin',
    value: '26.1%',
    change: '+3.4pp',
    trend: 'up',
    icon: TrendingUp,
    description: 'Net income / Revenue',
    source: 'QBO',
    category: 'profitability',
  },
  {
    id: 'blended_roas',
    title: 'Blended ROAS',
    value: '3.2x',
    change: '+0.4',
    trend: 'up',
    icon: Target,
    description: 'Revenue / total ad spend across all channels',
    source: 'Sales Channels',
    category: 'profitability',
  },
  {
    id: 'mer',
    title: 'Marketing Efficiency Ratio',
    value: '3.8x',
    change: '+0.3',
    trend: 'up',
    icon: TrendingUp,
    description: 'Total revenue / total marketing spend',
    source: 'Sales Channels + QBO',
    category: 'profitability',
  },
  // Acquisition
  {
    id: 'cac',
    title: 'Customer Acquisition Cost',
    value: '$38',
    change: '-15.6%',
    trend: 'down',
    icon: Users,
    description: 'Blended cost to acquire one customer',
    source: 'Sales Channels',
    category: 'acquisition',
  },
  {
    id: 'ltv_cac',
    title: 'LTV:CAC Ratio',
    value: '4.2:1',
    change: '+0.8',
    trend: 'up',
    icon: TrendingUp,
    description: 'Customer lifetime value to acquisition cost',
    source: 'Sales Channels',
    category: 'acquisition',
  },
  {
    id: 'repeat_rate',
    title: 'Repeat Purchase Rate',
    value: '28.5%',
    change: '+3.2pp',
    trend: 'up',
    icon: RotateCcw,
    description: 'Percentage of customers who reorder',
    source: 'Sales Channels',
    category: 'acquisition',
  },
  {
    id: 'return_rate',
    title: 'Return Rate',
    value: '7.2%',
    change: '+0.8pp',
    trend: 'up',
    icon: ArrowDownRight,
    description: 'Percentage of orders returned',
    source: 'Sales Channels',
    category: 'acquisition',
  },
  // Inventory
  {
    id: 'inventory_turnover',
    title: 'Inventory Turnover',
    value: '5.3x',
    change: '+0.5',
    trend: 'up',
    icon: RotateCcw,
    description: 'COGS / average inventory value',
    source: 'Sales Channels + QBO',
    category: 'inventory',
  },
  {
    id: 'days_on_hand',
    title: 'Days Inventory on Hand',
    value: '69 days',
    change: '-3 days',
    trend: 'down',
    icon: Clock,
    description: 'Average days to sell inventory',
    source: 'Sales Channels',
    category: 'inventory',
  },
  {
    id: 'dead_stock',
    title: 'Dead Stock Value',
    value: '$42,000',
    change: '+$3K',
    trend: 'up',
    icon: AlertCircle,
    description: 'Inventory sitting 90+ days',
    source: 'Sales Channels',
    category: 'inventory',
  },
  // Efficiency
  {
    id: 'platform_fees',
    title: 'Total Platform Fees',
    value: '$36,500',
    change: '-1.2pp',
    trend: 'down',
    icon: CreditCard,
    description: 'Fees as % of revenue across all channels',
    source: 'Sales Channels',
    category: 'efficiency',
  },
  {
    id: 'shipping_per_order',
    title: 'Shipping Cost / Order',
    value: '$6.80',
    change: '-$0.40',
    trend: 'down',
    icon: Package,
    description: 'Average shipping cost per order',
    source: 'Sales Channels + QBO',
    category: 'efficiency',
  },
  {
    id: 'cash_conversion',
    title: 'Cash Conversion Cycle',
    value: '42 days',
    change: '-4 days',
    trend: 'down',
    icon: Clock,
    description: 'DIO + DSO - DPO',
    source: 'QBO',
    category: 'efficiency',
  },
]

// Default visible KPIs (first 4)
const DEFAULT_VISIBLE = ['gmv', 'contribution_margin', 'cac', 'ltv_cac']

export default function DashboardContent({ dashboardData, isLoading, onSync }: DashboardContentProps) {
  const [syncing, setSyncing] = useState(false)
  const [visibleKPIs, setVisibleKPIs] = useState<string[]>(DEFAULT_VISIBLE)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Load saved preferences from localStorage
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('sellercfo_visible_kpis') : null
    if (saved) {
      try { setVisibleKPIs(JSON.parse(saved)) } catch { /* ignore */ }
    }
  }, [])

  const toggleKPI = (id: string) => {
    setVisibleKPIs(prev => {
      const next = prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]
      if (typeof window !== 'undefined') localStorage.setItem('sellercfo_visible_kpis', JSON.stringify(next))
      return next
    })
  }

  const handleSync = async () => {
    setSyncing(true)
    await onSync()
    setSyncing(false)
  }

  const monthlyRevenue = [
    { month: 'Jan', revenue: 285000, orders: 3420, cogs: 142500 },
    { month: 'Feb', revenue: 312000, orders: 3740, cogs: 153000 },
    { month: 'Mar', revenue: 298000, orders: 3575, cogs: 149000 },
    { month: 'Apr', revenue: 325000, orders: 3900, cogs: 159250 },
    { month: 'May', revenue: 342000, orders: 4100, cogs: 164160 },
    { month: 'Jun', revenue: 358000, orders: 4295, cogs: 168760 },
  ]

  const inventoryMetrics = [
    { month: 'Jan', turnover: 4.2, daysOnHand: 87, deadStockPct: 15 },
    { month: 'Feb', turnover: 4.5, daysOnHand: 81, deadStockPct: 14 },
    { month: 'Mar', turnover: 4.1, daysOnHand: 89, deadStockPct: 14.5 },
    { month: 'Apr', turnover: 4.8, daysOnHand: 76, deadStockPct: 13 },
    { month: 'May', turnover: 5.1, daysOnHand: 72, deadStockPct: 12.5 },
    { month: 'Jun', turnover: 5.3, daysOnHand: 69, deadStockPct: 12 },
  ]

  const channelMix = [
    { month: 'Jan', Amazon: 152000, Shopify: 95000, Other: 38000 },
    { month: 'Feb', Amazon: 160000, Shopify: 102000, Other: 50000 },
    { month: 'Mar', Amazon: 155000, Shopify: 98000, Other: 45000 },
    { month: 'Apr', Amazon: 170000, Shopify: 110000, Other: 45000 },
    { month: 'May', Amazon: 178000, Shopify: 118000, Other: 46000 },
    { month: 'Jun', Amazon: 185000, Shopify: 125000, Other: 48000 },
  ]

  const activeKPIs = ALL_KPIS.filter(k => visibleKPIs.includes(k.id))

  const categories = [
    { key: 'revenue', label: 'Revenue' },
    { key: 'profitability', label: 'Profitability' },
    { key: 'acquisition', label: 'Acquisition' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'efficiency', label: 'Efficiency' },
  ]

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
    <div className="flex gap-0">
      {/* Main Content */}
      <div className="flex-1 space-y-6 min-w-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">Performance Hub</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-white bg-gray-800 rounded-lg transition"
              title="Toggle KPI selector"
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              KPIs
            </button>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Data'}
            </button>
          </div>
        </div>

        {/* KPI Cards Grid */}
        {activeKPIs.length > 0 ? (
          <div className={`grid gap-4 ${
            activeKPIs.length <= 2 ? 'grid-cols-1 md:grid-cols-2' :
            activeKPIs.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
          }`}>
            {activeKPIs.map((kpi) => {
              const Icon = kpi.icon
              // Determine if trend direction is good or bad
              const isPositive = (kpi.trend === 'up' && !['return_rate', 'dead_stock', 'platform_fees', 'shipping_per_order', 'cac', 'cash_conversion', 'days_on_hand'].includes(kpi.id)) ||
                (kpi.trend === 'down' && ['return_rate', 'dead_stock', 'platform_fees', 'shipping_per_order', 'cac', 'cash_conversion', 'days_on_hand'].includes(kpi.id))

              return (
                <div key={kpi.id} className="bg-gray-900 rounded-lg p-5 border border-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-5 h-5 text-violet-400" />
                    <span className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {kpi.trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {kpi.change}
                    </span>
                  </div>
                  <h3 className="text-gray-400 text-xs font-medium">{kpi.title}</h3>
                  <p className="text-2xl font-bold text-white mt-1">{kpi.value}</p>
                  <p className="text-[10px] text-gray-600 mt-1" title={kpi.description}>
                    {kpi.source}
                  </p>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-gray-900 rounded-lg p-8 border border-gray-800 text-center">
            <Eye className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No KPIs selected. Open the KPI panel to choose which metrics to display.</p>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue & COGS Trend */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-lg font-medium text-white mb-4">Revenue & COGS Trend</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value: number, name: string) => [`$${(value / 1000).toFixed(1)}K`, name === 'revenue' ? 'Revenue' : 'COGS']}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} strokeWidth={2} />
                  <Area type="monotone" dataKey="cogs" name="COGS" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Channel Mix */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-lg font-medium text-white mb-4">Revenue by Channel</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelMix}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value: number) => [`$${(value / 1000).toFixed(0)}K`, undefined]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Amazon" stackId="a" fill="#FF9900" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Shopify" stackId="a" fill="#96BF48" />
                  <Bar dataKey="Other" stackId="a" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Inventory Metrics - tighter with dual axis */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h3 className="text-lg font-medium text-white mb-4">Inventory Health</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={inventoryMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" stroke="#8B5CF6" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line yAxisId="left" type="monotone" dataKey="turnover" name="Turnover Rate" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="daysOnHand" name="Days on Hand" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="deadStockPct" name="Dead Stock %" stroke="#EF4444" strokeWidth={1.5} strokeDasharray="5 5" dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Metrics Summary */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h3 className="text-lg font-medium text-white mb-4">Quick Metrics</h3>
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

      {/* KPI Toggle Sidebar */}
      {sidebarOpen && (
        <div className="w-64 shrink-0 ml-4 bg-gray-900 border border-gray-800 rounded-lg p-4 h-fit sticky top-4 max-h-[calc(100vh-120px)] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Toggle KPIs</h3>
            <span className="text-[10px] text-gray-500">{visibleKPIs.length} active</span>
          </div>

          {categories.map((cat) => {
            const kpis = ALL_KPIS.filter(k => k.category === cat.key)
            return (
              <div key={cat.key} className="mb-4">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2 font-semibold">{cat.label}</p>
                <div className="space-y-1">
                  {kpis.map((kpi) => (
                    <label
                      key={kpi.id}
                      className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-800 cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={visibleKPIs.includes(kpi.id)}
                        onChange={() => toggleKPI(kpi.id)}
                        className="w-3.5 h-3.5 rounded border-gray-600 text-violet-500 focus:ring-violet-500 focus:ring-offset-0 bg-gray-800"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-gray-300 block truncate">{kpi.title}</span>
                        <span className="text-[10px] text-gray-600 block">{kpi.source}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}

          <button
            onClick={() => {
              setVisibleKPIs(DEFAULT_VISIBLE)
              if (typeof window !== 'undefined') localStorage.setItem('sellercfo_visible_kpis', JSON.stringify(DEFAULT_VISIBLE))
            }}
            className="w-full text-xs text-gray-500 hover:text-gray-300 mt-2 py-1.5 transition"
          >
            Reset to defaults
          </button>
        </div>
      )}
    </div>
  )
}
