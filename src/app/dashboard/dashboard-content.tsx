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
  PanelLeftClose, PanelLeftOpen, Sparkles, ShieldAlert, Trophy, Lightbulb,
} from 'lucide-react'

interface DashboardContentProps {
  dashboardData: any
  isLoading: boolean
  onSync: () => void
  viewId?: string // 'main' | '1' | '2' — for custom dashboard views
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
  source: string
  category: 'revenue' | 'profitability' | 'acquisition' | 'inventory' | 'efficiency'
}

const ALL_KPIS: KPIDef[] = [
  // Revenue
  { id: 'gmv', title: 'Gross Merchandise Volume', value: '$358,000', change: '+18.5%', trend: 'up', icon: ShoppingCart, description: 'Total sales across all channels (last 30 days)', source: 'Sales Channels', category: 'revenue' },
  { id: 'net_revenue', title: 'Net Revenue', value: '$332,940', change: '+16.2%', trend: 'up', icon: DollarSign, description: 'GMV minus returns & refunds', source: 'Sales Channels + QBO', category: 'revenue' },
  { id: 'aov', title: 'Average Order Value', value: '$52.75', change: '+4.2%', trend: 'up', icon: Target, description: 'Average revenue per order', source: 'Sales Channels', category: 'revenue' },
  { id: 'total_orders', title: 'Total Orders', value: '6,785', change: '+12.8%', trend: 'up', icon: ShoppingCart, description: 'Orders processed last 30 days', source: 'Sales Channels', category: 'revenue' },
  // Profitability
  { id: 'contribution_margin', title: 'Contribution Margin / Order', value: '$22.50', change: '+12.3%', trend: 'up', icon: DollarSign, description: 'Revenue minus COGS, fees, shipping per order', source: 'Sales Channels + QBO', category: 'profitability' },
  { id: 'gross_margin', title: 'Gross Margin', value: '52.9%', change: '+2.1pp', trend: 'up', icon: Percent, description: '(Revenue - COGS) / Revenue', source: 'QBO', category: 'profitability' },
  { id: 'net_margin', title: 'Net Margin', value: '26.1%', change: '+3.4pp', trend: 'up', icon: TrendingUp, description: 'Net income / Revenue', source: 'QBO', category: 'profitability' },
  { id: 'blended_roas', title: 'Blended ROAS', value: '3.2x', change: '+0.4', trend: 'up', icon: Target, description: 'Revenue / total ad spend across all channels', source: 'Sales Channels', category: 'profitability' },
  { id: 'mer', title: 'Marketing Efficiency Ratio', value: '3.8x', change: '+0.3', trend: 'up', icon: TrendingUp, description: 'Total revenue / total marketing spend', source: 'Sales Channels + QBO', category: 'profitability' },
  // Acquisition
  { id: 'cac', title: 'Customer Acquisition Cost', value: '$38', change: '-15.6%', trend: 'down', icon: Users, description: 'Blended cost to acquire one customer', source: 'Sales Channels', category: 'acquisition' },
  { id: 'ltv_cac', title: 'LTV:CAC Ratio', value: '4.2:1', change: '+0.8', trend: 'up', icon: TrendingUp, description: 'Customer lifetime value to acquisition cost', source: 'Sales Channels', category: 'acquisition' },
  { id: 'repeat_rate', title: 'Repeat Purchase Rate', value: '28.5%', change: '+3.2pp', trend: 'up', icon: RotateCcw, description: 'Percentage of customers who reorder', source: 'Sales Channels', category: 'acquisition' },
  { id: 'return_rate', title: 'Return Rate', value: '7.2%', change: '+0.8pp', trend: 'up', icon: ArrowDownRight, description: 'Percentage of orders returned', source: 'Sales Channels', category: 'acquisition' },
  // Inventory
  { id: 'inventory_turnover', title: 'Inventory Turnover', value: '5.3x', change: '+0.5', trend: 'up', icon: RotateCcw, description: 'COGS / average inventory value', source: 'Sales Channels + QBO', category: 'inventory' },
  { id: 'days_on_hand', title: 'Days Inventory on Hand', value: '69 days', change: '-3 days', trend: 'down', icon: Clock, description: 'Average days to sell inventory', source: 'Sales Channels', category: 'inventory' },
  { id: 'dead_stock', title: 'Dead Stock Value', value: '$42,000', change: '+$3K', trend: 'up', icon: AlertCircle, description: 'Inventory sitting 90+ days', source: 'Sales Channels', category: 'inventory' },
  // Efficiency
  { id: 'platform_fees', title: 'Total Platform Fees', value: '$36,500', change: '-1.2pp', trend: 'down', icon: CreditCard, description: 'Fees as % of revenue across all channels', source: 'Sales Channels', category: 'efficiency' },
  { id: 'shipping_per_order', title: 'Shipping Cost / Order', value: '$6.80', change: '-$0.40', trend: 'down', icon: Package, description: 'Average shipping cost per order', source: 'Sales Channels + QBO', category: 'efficiency' },
  { id: 'cash_conversion', title: 'Cash Conversion Cycle', value: '42 days', change: '-4 days', trend: 'down', icon: Clock, description: 'DIO + DSO - DPO', source: 'QBO', category: 'efficiency' },
]

// ============================================================
// AI Insights — wins & watchouts
// ============================================================
interface AIInsight {
  type: 'win' | 'watchout'
  title: string
  detail: string
  metric?: string
}

const AI_INSIGHTS: AIInsight[] = [
  { type: 'win', title: 'Shopify AOV up 11% this month', detail: 'Bundle offers on Shopify are driving higher cart values — your "Complete Kit" SKU accounts for 34% of this lift.', metric: '+$5.80/order' },
  { type: 'win', title: 'CAC dropped below $40 target', detail: 'Meta retargeting campaigns hit a 4.1x ROAS, pulling blended CAC down to $38. Consider scaling budget by 15%.', metric: '$38 vs $45 target' },
  { type: 'watchout', title: 'Dead stock creeping up — now $42K', detail: '23 SKUs haven\'t moved in 90+ days. Top offender: SKU-4481 ($8.2K tied up). Consider a flash sale or liquidation.', metric: '+$3K vs last month' },
  { type: 'watchout', title: 'Amazon return rate spiking on 3 ASINs', detail: 'Return rate hit 12.4% on your top 3 FBA ASINs (vs 7.2% blended). Check recent negative reviews for defect patterns.', metric: '12.4% vs 7.2% avg' },
]

// ============================================================
// KPI trend data for mini graphs
// ============================================================
const KPI_TRENDS: Record<string, { data: { month: string; value: number }[]; format: (v: number) => string; color: string }> = {
  gmv:                { data: [{ month:'J', value:285000 },{ month:'F', value:312000 },{ month:'M', value:298000 },{ month:'A', value:325000 },{ month:'M2', value:342000 },{ month:'J2', value:358000 }], format: v => `$${(v/1000).toFixed(0)}K`, color: '#8B5CF6' },
  net_revenue:        { data: [{ month:'J', value:265050 },{ month:'F', value:290160 },{ month:'M', value:277140 },{ month:'A', value:302250 },{ month:'M2', value:318060 },{ month:'J2', value:332940 }], format: v => `$${(v/1000).toFixed(0)}K`, color: '#22C55E' },
  aov:                { data: [{ month:'J', value:48.20 },{ month:'F', value:49.10 },{ month:'M', value:49.80 },{ month:'A', value:50.50 },{ month:'M2', value:51.60 },{ month:'J2', value:52.75 }], format: v => `$${v.toFixed(2)}`, color: '#06B6D4' },
  total_orders:       { data: [{ month:'J', value:5910 },{ month:'F', value:6353 },{ month:'M', value:5984 },{ month:'A', value:6435 },{ month:'M2', value:6627 },{ month:'J2', value:6785 }], format: v => v.toLocaleString(), color: '#F59E0B' },
  contribution_margin:{ data: [{ month:'J', value:18.40 },{ month:'F', value:19.20 },{ month:'M', value:19.80 },{ month:'A', value:20.50 },{ month:'M2', value:21.40 },{ month:'J2', value:22.50 }], format: v => `$${v.toFixed(2)}`, color: '#8B5CF6' },
  gross_margin:       { data: [{ month:'J', value:48.2 },{ month:'F', value:49.1 },{ month:'M', value:50.0 },{ month:'A', value:51.0 },{ month:'M2', value:52.1 },{ month:'J2', value:52.9 }], format: v => `${v.toFixed(1)}%`, color: '#22C55E' },
  net_margin:         { data: [{ month:'J', value:20.1 },{ month:'F', value:21.5 },{ month:'M', value:22.4 },{ month:'A', value:23.8 },{ month:'M2', value:25.0 },{ month:'J2', value:26.1 }], format: v => `${v.toFixed(1)}%`, color: '#06B6D4' },
  blended_roas:       { data: [{ month:'J', value:2.4 },{ month:'F', value:2.6 },{ month:'M', value:2.7 },{ month:'A', value:2.9 },{ month:'M2', value:3.0 },{ month:'J2', value:3.2 }], format: v => `${v.toFixed(1)}x`, color: '#F59E0B' },
  mer:                { data: [{ month:'J', value:3.1 },{ month:'F', value:3.2 },{ month:'M', value:3.3 },{ month:'A', value:3.5 },{ month:'M2', value:3.6 },{ month:'J2', value:3.8 }], format: v => `${v.toFixed(1)}x`, color: '#8B5CF6' },
  cac:                { data: [{ month:'J', value:52 },{ month:'F', value:48 },{ month:'M', value:46 },{ month:'A', value:43 },{ month:'M2', value:41 },{ month:'J2', value:38 }], format: v => `$${v}`, color: '#EF4444' },
  ltv_cac:            { data: [{ month:'J', value:2.8 },{ month:'F', value:3.1 },{ month:'M', value:3.4 },{ month:'A', value:3.6 },{ month:'M2', value:3.9 },{ month:'J2', value:4.2 }], format: v => `${v.toFixed(1)}:1`, color: '#22C55E' },
  repeat_rate:        { data: [{ month:'J', value:22.1 },{ month:'F', value:23.5 },{ month:'M', value:24.8 },{ month:'A', value:26.0 },{ month:'M2', value:27.2 },{ month:'J2', value:28.5 }], format: v => `${v.toFixed(1)}%`, color: '#06B6D4' },
  return_rate:        { data: [{ month:'J', value:5.8 },{ month:'F', value:6.1 },{ month:'M', value:6.3 },{ month:'A', value:6.5 },{ month:'M2', value:6.9 },{ month:'J2', value:7.2 }], format: v => `${v.toFixed(1)}%`, color: '#EF4444' },
  inventory_turnover: { data: [{ month:'J', value:4.2 },{ month:'F', value:4.5 },{ month:'M', value:4.1 },{ month:'A', value:4.8 },{ month:'M2', value:5.1 },{ month:'J2', value:5.3 }], format: v => `${v.toFixed(1)}x`, color: '#8B5CF6' },
  days_on_hand:       { data: [{ month:'J', value:87 },{ month:'F', value:81 },{ month:'M', value:89 },{ month:'A', value:76 },{ month:'M2', value:72 },{ month:'J2', value:69 }], format: v => `${v}d`, color: '#F59E0B' },
  dead_stock:         { data: [{ month:'J', value:35000 },{ month:'F', value:36500 },{ month:'M', value:37200 },{ month:'A', value:38800 },{ month:'M2', value:40100 },{ month:'J2', value:42000 }], format: v => `$${(v/1000).toFixed(0)}K`, color: '#EF4444' },
  platform_fees:      { data: [{ month:'J', value:31200 },{ month:'F', value:33500 },{ month:'M', value:32800 },{ month:'A', value:34900 },{ month:'M2', value:35700 },{ month:'J2', value:36500 }], format: v => `$${(v/1000).toFixed(1)}K`, color: '#F59E0B' },
  shipping_per_order: { data: [{ month:'J', value:7.80 },{ month:'F', value:7.50 },{ month:'M', value:7.30 },{ month:'A', value:7.10 },{ month:'M2', value:6.95 },{ month:'J2', value:6.80 }], format: v => `$${v.toFixed(2)}`, color: '#06B6D4' },
  cash_conversion:    { data: [{ month:'J', value:54 },{ month:'F', value:51 },{ month:'M', value:49 },{ month:'A', value:47 },{ month:'M2', value:44 },{ month:'J2', value:42 }], format: v => `${v}d`, color: '#8B5CF6' },
}

// Default visible KPIs
const DEFAULT_VISIBLE = ['gmv', 'contribution_margin', 'cac', 'ltv_cac']

// Storage helpers for custom views
const storageKey = (viewId: string) => viewId === 'main' ? 'sellercfo_visible_kpis' : `sellercfo_custom_view_${viewId}_kpis`
const nameKey = (viewId: string) => `sellercfo_custom_view_${viewId}_name`

export default function DashboardContent({ dashboardData, isLoading, onSync, viewId = 'main' }: DashboardContentProps) {
  const [syncing, setSyncing] = useState(false)
  const [visibleKPIs, setVisibleKPIs] = useState<string[]>(DEFAULT_VISIBLE)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewName, setViewName] = useState('')
  const [editingName, setEditingName] = useState(false)

  // Load saved preferences
  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem(storageKey(viewId))
    if (saved) {
      try { setVisibleKPIs(JSON.parse(saved)) } catch { /* ignore */ }
    } else if (viewId !== 'main') {
      setVisibleKPIs([]) // Custom views start empty
    }
    if (viewId !== 'main') {
      setViewName(localStorage.getItem(nameKey(viewId)) || `Custom View ${viewId}`)
    }
  }, [viewId])

  const toggleKPI = (id: string) => {
    setVisibleKPIs(prev => {
      const next = prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]
      if (typeof window !== 'undefined') localStorage.setItem(storageKey(viewId), JSON.stringify(next))
      return next
    })
  }

  const saveViewName = (name: string) => {
    setViewName(name)
    if (typeof window !== 'undefined') {
      localStorage.setItem(nameKey(viewId), name)
      // Dispatch event so sidebar can update the label
      window.dispatchEvent(new CustomEvent('customViewRenamed', { detail: { viewId, name } }))
    }
    setEditingName(false)
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

  const channelMix = [
    { month: 'Jan', Amazon: 152000, Shopify: 95000, Other: 38000 },
    { month: 'Feb', Amazon: 160000, Shopify: 102000, Other: 50000 },
    { month: 'Mar', Amazon: 155000, Shopify: 98000, Other: 45000 },
    { month: 'Apr', Amazon: 170000, Shopify: 110000, Other: 45000 },
    { month: 'May', Amazon: 178000, Shopify: 118000, Other: 46000 },
    { month: 'Jun', Amazon: 185000, Shopify: 125000, Other: 48000 },
  ]

  const inventoryMetrics = [
    { month: 'Jan', turnover: 4.2, daysOnHand: 87, deadStockPct: 15 },
    { month: 'Feb', turnover: 4.5, daysOnHand: 81, deadStockPct: 14 },
    { month: 'Mar', turnover: 4.1, daysOnHand: 89, deadStockPct: 14.5 },
    { month: 'Apr', turnover: 4.8, daysOnHand: 76, deadStockPct: 13 },
    { month: 'May', turnover: 5.1, daysOnHand: 72, deadStockPct: 12.5 },
    { month: 'Jun', turnover: 5.3, daysOnHand: 69, deadStockPct: 12 },
  ]

  const activeKPIs = ALL_KPIS.filter(k => visibleKPIs.includes(k.id))

  const categories = [
    { key: 'revenue', label: 'Revenue' },
    { key: 'profitability', label: 'Profitability' },
    { key: 'acquisition', label: 'Acquisition' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'efficiency', label: 'Efficiency' },
  ]

  // Determine which KPIs are "inverse" (lower = better)
  const inverseKPIs = ['return_rate', 'dead_stock', 'platform_fees', 'shipping_per_order', 'cac', 'cash_conversion', 'days_on_hand']

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

  const wins = AI_INSIGHTS.filter(i => i.type === 'win')
  const watchouts = AI_INSIGHTS.filter(i => i.type === 'watchout')

  return (
    <div className="flex gap-0">
      {/* Main Content */}
      <div className="flex-1 space-y-6 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {viewId !== 'main' && editingName ? (
              <input
                autoFocus
                defaultValue={viewName}
                onBlur={(e) => saveViewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveViewName((e.target as HTMLInputElement).value) }}
                className="text-2xl font-semibold text-white bg-transparent border-b border-violet-500 outline-none px-1"
              />
            ) : (
              <h1
                className={`text-2xl font-semibold text-white ${viewId !== 'main' ? 'cursor-pointer hover:text-violet-300 transition' : ''}`}
                onClick={() => viewId !== 'main' && setEditingName(true)}
                title={viewId !== 'main' ? 'Click to rename' : undefined}
              >
                {viewId === 'main' ? 'Performance Hub' : viewName}
              </h1>
            )}
            {viewId !== 'main' && !editingName && (
              <span className="text-[10px] text-gray-600 bg-gray-800 px-2 py-0.5 rounded">click name to rename</span>
            )}
          </div>
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

        {/* ============================================================ */}
        {/* AI Wins & Watchouts */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Wins */}
          <div className="bg-gradient-to-br from-emerald-950/40 to-gray-900 rounded-lg border border-emerald-800/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-400">Wins</span>
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span className="text-[10px] text-emerald-700 ml-auto">AI-generated</span>
            </div>
            <div className="space-y-3">
              {wins.map((insight, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-1 rounded-full bg-emerald-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-white">{insight.title}</span>
                      {insight.metric && (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">{insight.metric}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{insight.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Watchouts */}
          <div className="bg-gradient-to-br from-amber-950/40 to-gray-900 rounded-lg border border-amber-800/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400">Watch Outs</span>
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span className="text-[10px] text-amber-700 ml-auto">AI-generated</span>
            </div>
            <div className="space-y-3">
              {watchouts.map((insight, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-1 rounded-full bg-amber-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-white">{insight.title}</span>
                      {insight.metric && (
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">{insight.metric}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{insight.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* KPI Cards Grid */}
        {/* ============================================================ */}
        {activeKPIs.length > 0 ? (
          <div className={`grid gap-4 ${
            activeKPIs.length <= 2 ? 'grid-cols-1 md:grid-cols-2' :
            activeKPIs.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
          }`}>
            {activeKPIs.map((kpi) => {
              const Icon = kpi.icon
              const isPositive = (kpi.trend === 'up' && !inverseKPIs.includes(kpi.id)) ||
                (kpi.trend === 'down' && inverseKPIs.includes(kpi.id))

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
                  <p className="text-[10px] text-gray-600 mt-1" title={kpi.description}>{kpi.source}</p>
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

        {/* ============================================================ */}
        {/* KPI Trend Mini-Charts — one per selected KPI */}
        {/* ============================================================ */}
        {activeKPIs.length > 0 && (
          <div className={`grid gap-4 ${
            activeKPIs.length === 1 ? 'grid-cols-1' :
            activeKPIs.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {activeKPIs.map((kpi) => {
              const trend = KPI_TRENDS[kpi.id]
              if (!trend) return null
              const isPositive = (kpi.trend === 'up' && !inverseKPIs.includes(kpi.id)) ||
                (kpi.trend === 'down' && inverseKPIs.includes(kpi.id))
              return (
                <div key={`chart-${kpi.id}`} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-medium text-gray-400">{kpi.title}</h4>
                    <span className={`text-[10px] font-mono ${isPositive ? 'text-green-400' : 'text-red-400'}`}>{kpi.change}</span>
                  </div>
                  <div className="h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trend.data}>
                        <defs>
                          <linearGradient id={`grad-${kpi.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={trend.color} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={trend.color} stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" stroke="#4B5563" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis hide domain={['auto', 'auto']} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', fontSize: '11px' }}
                          formatter={(value: number) => [trend.format(value), kpi.title]}
                          labelStyle={{ color: '#9CA3AF' }}
                        />
                        <Area type="monotone" dataKey="value" stroke={trend.color} fill={`url(#grad-${kpi.id})`} strokeWidth={2} dot={{ r: 2, fill: trend.color }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ============================================================ */}
        {/* Main Charts (only on main view) */}
        {/* ============================================================ */}
        {viewId === 'main' && (
          <>
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

            {/* Inventory Health */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h3 className="text-lg font-medium text-white mb-4">Inventory Health</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={inventoryMetrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" stroke="#8B5CF6" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line yAxisId="left" type="monotone" dataKey="turnover" name="Turnover Rate" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} />
                    <Line yAxisId="right" type="monotone" dataKey="daysOnHand" name="Days on Hand" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                    <Line yAxisId="right" type="monotone" dataKey="deadStockPct" name="Dead Stock %" stroke="#EF4444" strokeWidth={1.5} strokeDasharray="5 5" dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ============================================================ */}
      {/* KPI Toggle Sidebar */}
      {/* ============================================================ */}
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
                    <label key={kpi.id} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-800 cursor-pointer transition">
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
              const defaults = viewId === 'main' ? DEFAULT_VISIBLE : []
              setVisibleKPIs(defaults)
              if (typeof window !== 'undefined') localStorage.setItem(storageKey(viewId), JSON.stringify(defaults))
            }}
            className="w-full text-xs text-gray-500 hover:text-gray-300 mt-2 py-1.5 transition"
          >
            {viewId === 'main' ? 'Reset to defaults' : 'Clear all'}
          </button>
        </div>
      )}
    </div>
  )
}
