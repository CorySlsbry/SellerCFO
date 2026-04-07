"use client"

import { useState, useEffect, useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ComposedChart,
} from 'recharts'
import {
  RefreshCw, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package,
  Users, CreditCard, AlertCircle, Clock, CheckCircle, XCircle,
  Eye, EyeOff, Percent, RotateCcw, Target, ArrowUpRight, ArrowDownRight,
  PanelLeftClose, PanelLeftOpen, Sparkles, ShieldAlert, Trophy, Lightbulb,
  BarChart3, LineChart as LineChartIcon, AreaChart as AreaChartIcon,
  Layers, Ungroup, Megaphone, Wallet, PackageSearch, Gauge, Zap,
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
// KPI trend data for graphs
// ============================================================
const KPI_TRENDS: Record<string, { data: { month: string; value: number }[]; format: (v: number) => string; color: string; unit: string }> = {
  gmv:                { data: [{ month:'Jan', value:285000 },{ month:'Feb', value:312000 },{ month:'Mar', value:298000 },{ month:'Apr', value:325000 },{ month:'May', value:342000 },{ month:'Jun', value:358000 }], format: v => `$${(v/1000).toFixed(0)}K`, color: '#8B5CF6', unit: '$' },
  net_revenue:        { data: [{ month:'Jan', value:265050 },{ month:'Feb', value:290160 },{ month:'Mar', value:277140 },{ month:'Apr', value:302250 },{ month:'May', value:318060 },{ month:'Jun', value:332940 }], format: v => `$${(v/1000).toFixed(0)}K`, color: '#22C55E', unit: '$' },
  aov:                { data: [{ month:'Jan', value:48.20 },{ month:'Feb', value:49.10 },{ month:'Mar', value:49.80 },{ month:'Apr', value:50.50 },{ month:'May', value:51.60 },{ month:'Jun', value:52.75 }], format: v => `$${v.toFixed(2)}`, color: '#06B6D4', unit: '$' },
  total_orders:       { data: [{ month:'Jan', value:5910 },{ month:'Feb', value:6353 },{ month:'Mar', value:5984 },{ month:'Apr', value:6435 },{ month:'May', value:6627 },{ month:'Jun', value:6785 }], format: v => v.toLocaleString(), color: '#F59E0B', unit: '#' },
  contribution_margin:{ data: [{ month:'Jan', value:18.40 },{ month:'Feb', value:19.20 },{ month:'Mar', value:19.80 },{ month:'Apr', value:20.50 },{ month:'May', value:21.40 },{ month:'Jun', value:22.50 }], format: v => `$${v.toFixed(2)}`, color: '#8B5CF6', unit: '$' },
  gross_margin:       { data: [{ month:'Jan', value:48.2 },{ month:'Feb', value:49.1 },{ month:'Mar', value:50.0 },{ month:'Apr', value:51.0 },{ month:'May', value:52.1 },{ month:'Jun', value:52.9 }], format: v => `${v.toFixed(1)}%`, color: '#22C55E', unit: '%' },
  net_margin:         { data: [{ month:'Jan', value:20.1 },{ month:'Feb', value:21.5 },{ month:'Mar', value:22.4 },{ month:'Apr', value:23.8 },{ month:'May', value:25.0 },{ month:'Jun', value:26.1 }], format: v => `${v.toFixed(1)}%`, color: '#06B6D4', unit: '%' },
  blended_roas:       { data: [{ month:'Jan', value:2.4 },{ month:'Feb', value:2.6 },{ month:'Mar', value:2.7 },{ month:'Apr', value:2.9 },{ month:'May', value:3.0 },{ month:'Jun', value:3.2 }], format: v => `${v.toFixed(1)}x`, color: '#F59E0B', unit: 'x' },
  mer:                { data: [{ month:'Jan', value:3.1 },{ month:'Feb', value:3.2 },{ month:'Mar', value:3.3 },{ month:'Apr', value:3.5 },{ month:'May', value:3.6 },{ month:'Jun', value:3.8 }], format: v => `${v.toFixed(1)}x`, color: '#8B5CF6', unit: 'x' },
  cac:                { data: [{ month:'Jan', value:52 },{ month:'Feb', value:48 },{ month:'Mar', value:46 },{ month:'Apr', value:43 },{ month:'May', value:41 },{ month:'Jun', value:38 }], format: v => `$${v}`, color: '#EF4444', unit: '$' },
  ltv_cac:            { data: [{ month:'Jan', value:2.8 },{ month:'Feb', value:3.1 },{ month:'Mar', value:3.4 },{ month:'Apr', value:3.6 },{ month:'May', value:3.9 },{ month:'Jun', value:4.2 }], format: v => `${v.toFixed(1)}:1`, color: '#22C55E', unit: 'x' },
  repeat_rate:        { data: [{ month:'Jan', value:22.1 },{ month:'Feb', value:23.5 },{ month:'Mar', value:24.8 },{ month:'Apr', value:26.0 },{ month:'May', value:27.2 },{ month:'Jun', value:28.5 }], format: v => `${v.toFixed(1)}%`, color: '#06B6D4', unit: '%' },
  return_rate:        { data: [{ month:'Jan', value:5.8 },{ month:'Feb', value:6.1 },{ month:'Mar', value:6.3 },{ month:'Apr', value:6.5 },{ month:'May', value:6.9 },{ month:'Jun', value:7.2 }], format: v => `${v.toFixed(1)}%`, color: '#EF4444', unit: '%' },
  inventory_turnover: { data: [{ month:'Jan', value:4.2 },{ month:'Feb', value:4.5 },{ month:'Mar', value:4.1 },{ month:'Apr', value:4.8 },{ month:'May', value:5.1 },{ month:'Jun', value:5.3 }], format: v => `${v.toFixed(1)}x`, color: '#8B5CF6', unit: 'x' },
  days_on_hand:       { data: [{ month:'Jan', value:87 },{ month:'Feb', value:81 },{ month:'Mar', value:89 },{ month:'Apr', value:76 },{ month:'May', value:72 },{ month:'Jun', value:69 }], format: v => `${v}d`, color: '#F59E0B', unit: 'd' },
  dead_stock:         { data: [{ month:'Jan', value:35000 },{ month:'Feb', value:36500 },{ month:'Mar', value:37200 },{ month:'Apr', value:38800 },{ month:'May', value:40100 },{ month:'Jun', value:42000 }], format: v => `$${(v/1000).toFixed(0)}K`, color: '#EF4444', unit: '$' },
  platform_fees:      { data: [{ month:'Jan', value:31200 },{ month:'Feb', value:33500 },{ month:'Mar', value:32800 },{ month:'Apr', value:34900 },{ month:'May', value:35700 },{ month:'Jun', value:36500 }], format: v => `$${(v/1000).toFixed(1)}K`, color: '#F59E0B', unit: '$' },
  shipping_per_order: { data: [{ month:'Jan', value:7.80 },{ month:'Feb', value:7.50 },{ month:'Mar', value:7.30 },{ month:'Apr', value:7.10 },{ month:'May', value:6.95 },{ month:'Jun', value:6.80 }], format: v => `$${v.toFixed(2)}`, color: '#06B6D4', unit: '$' },
  cash_conversion:    { data: [{ month:'Jan', value:54 },{ month:'Feb', value:51 },{ month:'Mar', value:49 },{ month:'Apr', value:47 },{ month:'May', value:44 },{ month:'Jun', value:42 }], format: v => `${v}d`, color: '#8B5CF6', unit: 'd' },
}

// ============================================================
// Chart Groups — smart groupings with recommended chart types
// Based on Klipfolio PowerMetrics + e-commerce best practices:
//   Revenue: Area chart (shows volume/accumulation over time)
//   Profitability: Line chart (compare rate trends side by side)
//   Acquisition: Bar chart (compare discrete costs & ratios)
//   Inventory: Composed (bar for values + line for rates)
//   Efficiency: Line chart (track cost trends downward)
// ============================================================
type ChartType = 'line' | 'area' | 'bar'

interface ChartGroup {
  key: string
  label: string
  icon: any
  ids: string[]
  defaultChart: ChartType
  description: string
}

const CHART_GROUPS: ChartGroup[] = [
  { key: 'revenue',       label: 'Revenue',       icon: DollarSign,    ids: ['gmv', 'net_revenue', 'aov', 'total_orders'],                                     defaultChart: 'area',  description: 'Sales volume & order trends' },
  { key: 'profitability', label: 'Profitability',  icon: TrendingUp,    ids: ['contribution_margin', 'gross_margin', 'net_margin', 'blended_roas', 'mer'],       defaultChart: 'line',  description: 'Margins, ROAS & efficiency ratios' },
  { key: 'marketing',     label: 'Marketing',      icon: Megaphone,     ids: ['cac', 'blended_roas', 'mer', 'ltv_cac'],                                         defaultChart: 'bar',   description: 'Ad spend efficiency & LTV' },
  { key: 'acquisition',   label: 'Customers',      icon: Users,         ids: ['cac', 'ltv_cac', 'repeat_rate', 'return_rate'],                                  defaultChart: 'line',  description: 'Acquisition costs & retention' },
  { key: 'inventory',     label: 'Inventory',      icon: PackageSearch, ids: ['inventory_turnover', 'days_on_hand', 'dead_stock'],                               defaultChart: 'bar',   description: 'Stock health & turnover' },
  { key: 'efficiency',    label: 'Efficiency',     icon: Zap,           ids: ['platform_fees', 'shipping_per_order', 'cash_conversion'],                         defaultChart: 'line',  description: 'Fees, shipping & cash cycle' },
]

// ============================================================
// Preset Sections for custom dashboards (one-click add entire group)
// ============================================================
interface PresetSection {
  key: string
  label: string
  icon: any
  kpiIds: string[]
  color: string
  description: string
}

const PRESET_SECTIONS: PresetSection[] = [
  { key: 'marketing',      label: 'Marketing',          icon: Megaphone,     kpiIds: ['cac', 'blended_roas', 'mer', 'ltv_cac', 'repeat_rate'],                              color: 'violet',  description: 'Ad spend, ROAS, CAC, LTV & retention' },
  { key: 'revenue',        label: 'Revenue & Sales',    icon: DollarSign,    kpiIds: ['gmv', 'net_revenue', 'aov', 'total_orders'],                                         color: 'emerald', description: 'GMV, net revenue, AOV & orders' },
  { key: 'profitability',  label: 'Profitability',      icon: TrendingUp,    kpiIds: ['contribution_margin', 'gross_margin', 'net_margin'],                                  color: 'cyan',    description: 'Margins & contribution per order' },
  { key: 'inventory',      label: 'Inventory Health',   icon: PackageSearch, kpiIds: ['inventory_turnover', 'days_on_hand', 'dead_stock'],                                   color: 'amber',   description: 'Turnover, days on hand & dead stock' },
  { key: 'efficiency',     label: 'Cost Efficiency',    icon: Zap,           kpiIds: ['platform_fees', 'shipping_per_order', 'cash_conversion'],                              color: 'rose',    description: 'Fees, shipping costs & cash cycle' },
  { key: 'full_picture',   label: 'Full Picture',       icon: Gauge,         kpiIds: ['gmv', 'net_revenue', 'gross_margin', 'cac', 'blended_roas', 'inventory_turnover'],     color: 'purple',  description: 'Top KPI from each category' },
]

// Default visible KPIs
const DEFAULT_VISIBLE = ['gmv', 'contribution_margin', 'cac', 'ltv_cac']

// Storage helpers for custom views
const storageKey = (viewId: string) => viewId === 'main' ? 'sellercfo_visible_kpis' : `sellercfo_custom_view_${viewId}_kpis`
const nameKey = (viewId: string) => `sellercfo_custom_view_${viewId}_name`
const chartModeKey = (viewId: string) => `sellercfo_chart_mode_${viewId}`
const chartTypeOverrideKey = (viewId: string, groupKey: string) => `sellercfo_chart_type_${viewId}_${groupKey}`

// ============================================================
// Color palette for multi-line charts
// ============================================================
const LINE_COLORS = ['#8B5CF6', '#22C55E', '#06B6D4', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6']

export default function DashboardContent({ dashboardData, isLoading, onSync, viewId = 'main' }: DashboardContentProps) {
  const [syncing, setSyncing] = useState(false)
  const [visibleKPIs, setVisibleKPIs] = useState<string[]>(DEFAULT_VISIBLE)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewName, setViewName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [chartMode, setChartMode] = useState<'combined' | 'individual'>('combined')
  const [chartTypeOverrides, setChartTypeOverrides] = useState<Record<string, ChartType>>({})

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
    // Load chart mode
    const savedMode = localStorage.getItem(chartModeKey(viewId))
    if (savedMode === 'combined' || savedMode === 'individual') setChartMode(savedMode)
    // Load chart type overrides
    const overrides: Record<string, ChartType> = {}
    CHART_GROUPS.forEach(g => {
      const val = localStorage.getItem(chartTypeOverrideKey(viewId, g.key))
      if (val === 'line' || val === 'area' || val === 'bar') overrides[g.key] = val
    })
    if (Object.keys(overrides).length) setChartTypeOverrides(overrides)
  }, [viewId])

  const toggleKPI = (id: string) => {
    setVisibleKPIs(prev => {
      const next = prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]
      if (typeof window !== 'undefined') localStorage.setItem(storageKey(viewId), JSON.stringify(next))
      return next
    })
  }

  const addPresetSection = (preset: PresetSection) => {
    setVisibleKPIs(prev => {
      const merged = Array.from(new Set([...prev, ...preset.kpiIds]))
      if (typeof window !== 'undefined') localStorage.setItem(storageKey(viewId), JSON.stringify(merged))
      return merged
    })
  }

  const setOnlyPreset = (preset: PresetSection) => {
    setVisibleKPIs(preset.kpiIds)
    if (typeof window !== 'undefined') localStorage.setItem(storageKey(viewId), JSON.stringify(preset.kpiIds))
  }

  const saveViewName = (name: string) => {
    setViewName(name)
    if (typeof window !== 'undefined') {
      localStorage.setItem(nameKey(viewId), name)
      window.dispatchEvent(new CustomEvent('customViewRenamed', { detail: { viewId, name } }))
    }
    setEditingName(false)
  }

  const toggleChartMode = () => {
    const next = chartMode === 'combined' ? 'individual' : 'combined'
    setChartMode(next)
    if (typeof window !== 'undefined') localStorage.setItem(chartModeKey(viewId), next)
  }

  const setGroupChartType = (groupKey: string, type: ChartType) => {
    setChartTypeOverrides(prev => {
      const next = { ...prev, [groupKey]: type }
      if (typeof window !== 'undefined') localStorage.setItem(chartTypeOverrideKey(viewId, groupKey), type)
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

  // ============================================================
  // Build chart panels from active KPIs
  // ============================================================
  const chartPanels = useMemo(() => {
    if (chartMode === 'individual') {
      // One chart per KPI
      return activeKPIs.map(kpi => ({
        key: kpi.id,
        label: kpi.title,
        kpis: [kpi],
        chartType: (chartTypeOverrides[kpi.category] || 'area') as ChartType,
        groupKey: kpi.category,
      }))
    }
    // Combined mode: group by CHART_GROUPS
    const panels: { key: string; label: string; kpis: KPIDef[]; chartType: ChartType; groupKey: string }[] = []
    const assigned = new Set<string>()

    CHART_GROUPS.forEach(group => {
      const matched = activeKPIs.filter(k => group.ids.includes(k.id) && !assigned.has(k.id))
      if (matched.length > 0) {
        panels.push({
          key: group.key,
          label: group.label,
          kpis: matched,
          chartType: chartTypeOverrides[group.key] || group.defaultChart,
          groupKey: group.key,
        })
        matched.forEach(k => assigned.add(k.id))
      }
    })
    // Orphans
    activeKPIs.filter(k => !assigned.has(k.id)).forEach(k => {
      panels.push({ key: k.id, label: k.title, kpis: [k], chartType: 'area', groupKey: k.category })
    })
    return panels
  }, [activeKPIs, chartMode, chartTypeOverrides])

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

  // ============================================================
  // Chart Type Selector (mini toolbar per chart panel)
  // ============================================================
  const ChartTypeSelector = ({ groupKey, current }: { groupKey: string; current: ChartType }) => (
    <div className="flex items-center gap-0.5 bg-gray-800 rounded-md p-0.5">
      {([
        { type: 'line' as ChartType, icon: LineChartIcon, tip: 'Line' },
        { type: 'area' as ChartType, icon: AreaChartIcon, tip: 'Area' },
        { type: 'bar' as ChartType, icon: BarChart3, tip: 'Bar' },
      ]).map(({ type, icon: Icon, tip }) => (
        <button
          key={type}
          onClick={() => setGroupChartType(groupKey, type)}
          className={`p-1 rounded transition ${current === type ? 'bg-violet-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
          title={tip}
        >
          <Icon className="w-3 h-3" />
        </button>
      ))}
    </div>
  )

  // ============================================================
  // Render a single chart panel (handles all chart types)
  // ============================================================
  const renderChartPanel = (panel: { key: string; label: string; kpis: KPIDef[]; chartType: ChartType; groupKey: string }) => {
    const isSingle = panel.kpis.length === 1
    const months = KPI_TRENDS[panel.kpis[0]?.id]?.data.map(d => d.month) ?? []

    // Merge trend data
    const mergedData = months.map((month, idx) => {
      const row: Record<string, string | number> = { month }
      panel.kpis.forEach(kpi => {
        const trend = KPI_TRENDS[kpi.id]
        if (trend?.data[idx]) row[kpi.id] = trend.data[idx].value
      })
      return row
    })

    // Check if dual Y-axis is needed
    const maxValues = panel.kpis.map(k => Math.max(...(KPI_TRENDS[k.id]?.data.map(d => d.value) ?? [0])))
    const scaleRatio = maxValues.length > 1 ? Math.max(...maxValues) / Math.max(Math.min(...maxValues), 0.01) : 1
    const needsDualAxis = scaleRatio > 8 && panel.kpis.length >= 2

    // Split into left/right axis groups
    const sortedByScale = [...panel.kpis].sort((a, b) => {
      const aMax = Math.max(...(KPI_TRENDS[a.id]?.data.map(d => d.value) ?? [0]))
      const bMax = Math.max(...(KPI_TRENDS[b.id]?.data.map(d => d.value) ?? [0]))
      return bMax - aMax
    })
    const midpoint = Math.ceil(sortedByScale.length / 2)
    const leftAxisKPIs = new Set(needsDualAxis ? sortedByScale.slice(0, midpoint).map(k => k.id) : panel.kpis.map(k => k.id))

    const tooltipStyle = { backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', fontSize: '11px' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tooltipFormatter = ((value: number, name: string) => {
      const kpi = panel.kpis.find(k => k.id === name)
      const trend = kpi ? KPI_TRENDS[kpi.id] : null
      return [trend ? trend.format(value) : value, kpi?.title ?? name]
    }) as any

    // Render chart content based on type
    const renderChartContent = () => {
      const chartType = panel.chartType

      if (chartType === 'area') {
        return (
          <AreaChart data={mergedData}>
            <defs>
              {panel.kpis.map((kpi, i) => (
                <linearGradient key={kpi.id} id={`grad-${panel.key}-${kpi.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={LINE_COLORS[i % LINE_COLORS.length]} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={LINE_COLORS[i % LINE_COLORS.length]} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis dataKey="month" stroke="#4B5563" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis
              yAxisId="left" stroke="#4B5563" tick={{ fontSize: 9 }} axisLine={false} tickLine={false}
              tickFormatter={(v: number) => { const k = panel.kpis.find(k2 => leftAxisKPIs.has(k2.id)); return k ? KPI_TRENDS[k.id]?.format(v) ?? String(v) : String(v) }}
            />
            {needsDualAxis && (
              <YAxis
                yAxisId="right" orientation="right" stroke="#4B5563" tick={{ fontSize: 9 }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => { const k = panel.kpis.find(k2 => !leftAxisKPIs.has(k2.id)); return k ? KPI_TRENDS[k.id]?.format(v) ?? String(v) : String(v) }}
              />
            )}
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#9CA3AF' }} formatter={tooltipFormatter} />
            {panel.kpis.map((kpi, i) => (
              <Area
                key={kpi.id}
                yAxisId={leftAxisKPIs.has(kpi.id) ? 'left' : 'right'}
                type="monotone"
                dataKey={kpi.id}
                name={kpi.id}
                stroke={LINE_COLORS[i % LINE_COLORS.length]}
                fill={`url(#grad-${panel.key}-${kpi.id})`}
                strokeWidth={2}
                dot={{ r: 2, fill: LINE_COLORS[i % LINE_COLORS.length] }}
              />
            ))}
          </AreaChart>
        )
      }

      if (chartType === 'bar') {
        return (
          <BarChart data={mergedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis dataKey="month" stroke="#4B5563" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis
              yAxisId="left" stroke="#4B5563" tick={{ fontSize: 9 }} axisLine={false} tickLine={false}
              tickFormatter={(v: number) => { const k = panel.kpis.find(k2 => leftAxisKPIs.has(k2.id)); return k ? KPI_TRENDS[k.id]?.format(v) ?? String(v) : String(v) }}
            />
            {needsDualAxis && (
              <YAxis
                yAxisId="right" orientation="right" stroke="#4B5563" tick={{ fontSize: 9 }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => { const k = panel.kpis.find(k2 => !leftAxisKPIs.has(k2.id)); return k ? KPI_TRENDS[k.id]?.format(v) ?? String(v) : String(v) }}
              />
            )}
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#9CA3AF' }} formatter={tooltipFormatter} />
            {panel.kpis.map((kpi, i) => (
              <Bar
                key={kpi.id}
                yAxisId={leftAxisKPIs.has(kpi.id) ? 'left' : 'right'}
                dataKey={kpi.id}
                name={kpi.id}
                fill={LINE_COLORS[i % LINE_COLORS.length]}
                radius={[4, 4, 0, 0]}
                fillOpacity={0.85}
              />
            ))}
          </BarChart>
        )
      }

      // Default: line
      return (
        <LineChart data={mergedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
          <XAxis dataKey="month" stroke="#4B5563" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis
            yAxisId="left" stroke="#4B5563" tick={{ fontSize: 9 }} axisLine={false} tickLine={false}
            tickFormatter={(v: number) => { const k = panel.kpis.find(k2 => leftAxisKPIs.has(k2.id)); return k ? KPI_TRENDS[k.id]?.format(v) ?? String(v) : String(v) }}
          />
          {needsDualAxis && (
            <YAxis
              yAxisId="right" orientation="right" stroke="#4B5563" tick={{ fontSize: 9 }} axisLine={false} tickLine={false}
              tickFormatter={(v: number) => { const k = panel.kpis.find(k2 => !leftAxisKPIs.has(k2.id)); return k ? KPI_TRENDS[k.id]?.format(v) ?? String(v) : String(v) }}
            />
          )}
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#9CA3AF' }} formatter={tooltipFormatter} />
          {panel.kpis.map((kpi, i) => (
            <Line
              key={kpi.id}
              yAxisId={leftAxisKPIs.has(kpi.id) ? 'left' : 'right'}
              type="monotone"
              dataKey={kpi.id}
              name={kpi.id}
              stroke={LINE_COLORS[i % LINE_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 2.5, fill: LINE_COLORS[i % LINE_COLORS.length] }}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      )
    }

    return (
      <div key={`chart-${panel.key}`} className={`bg-gray-900 rounded-lg p-4 border border-gray-800 ${isSingle && chartMode === 'individual' ? '' : ''}`}>
        {/* Chart header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{panel.label}</h4>
            {isSingle && (
              <span className={`text-[10px] font-mono ${
                (panel.kpis[0].trend === 'up' && !inverseKPIs.includes(panel.kpis[0].id)) ||
                (panel.kpis[0].trend === 'down' && inverseKPIs.includes(panel.kpis[0].id))
                  ? 'text-green-400' : 'text-red-400'
              }`}>{panel.kpis[0].change}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Legend for multi-KPI charts */}
            {!isSingle && (
              <div className="flex items-center gap-2.5 flex-wrap justify-end">
                {panel.kpis.map((kpi, i) => (
                  <span key={kpi.id} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: LINE_COLORS[i % LINE_COLORS.length] }} />
                    <span className="text-[10px] text-gray-500">{kpi.title}</span>
                  </span>
                ))}
              </div>
            )}
            {/* Chart type switcher */}
            <ChartTypeSelector groupKey={panel.groupKey} current={panel.chartType} />
          </div>
        </div>
        {/* Chart */}
        <div className={isSingle && chartMode === 'individual' ? 'h-28' : 'h-44'}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChartContent()}
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

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
            {/* Combined / Individual toggle (custom views only) */}
            {viewId !== 'main' && activeKPIs.length > 1 && (
              <button
                onClick={toggleChartMode}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-white bg-gray-800 rounded-lg transition"
                title={chartMode === 'combined' ? 'Switch to individual charts' : 'Switch to combined charts'}
              >
                {chartMode === 'combined' ? <Layers className="w-4 h-4" /> : <Ungroup className="w-4 h-4" />}
                <span className="text-xs">{chartMode === 'combined' ? 'Combined' : 'Individual'}</span>
              </button>
            )}
            {/* KPI selector (custom views only) */}
            {viewId !== 'main' && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-white bg-gray-800 rounded-lg transition"
                title="Toggle KPI selector"
              >
                {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
                KPIs
              </button>
            )}
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
        {/* Preset Section Buttons (custom views only) */}
        {/* ============================================================ */}
        {viewId !== 'main' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Quick Add Sections</span>
              <span className="text-[10px] text-gray-700">Click to add • Hold shift to replace all</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_SECTIONS.map((preset) => {
                const Icon = preset.icon
                const isFullyActive = preset.kpiIds.every(id => visibleKPIs.includes(id))
                const colorMap: Record<string, string> = {
                  violet: isFullyActive ? 'bg-violet-600 text-white border-violet-500' : 'bg-gray-800 text-gray-300 border-gray-700 hover:border-violet-500 hover:text-violet-300',
                  emerald: isFullyActive ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-gray-800 text-gray-300 border-gray-700 hover:border-emerald-500 hover:text-emerald-300',
                  cyan: isFullyActive ? 'bg-cyan-600 text-white border-cyan-500' : 'bg-gray-800 text-gray-300 border-gray-700 hover:border-cyan-500 hover:text-cyan-300',
                  amber: isFullyActive ? 'bg-amber-600 text-white border-amber-500' : 'bg-gray-800 text-gray-300 border-gray-700 hover:border-amber-500 hover:text-amber-300',
                  rose: isFullyActive ? 'bg-rose-600 text-white border-rose-500' : 'bg-gray-800 text-gray-300 border-gray-700 hover:border-rose-500 hover:text-rose-300',
                  purple: isFullyActive ? 'bg-purple-600 text-white border-purple-500' : 'bg-gray-800 text-gray-300 border-gray-700 hover:border-purple-500 hover:text-purple-300',
                }
                return (
                  <button
                    key={preset.key}
                    onClick={(e) => e.shiftKey ? setOnlyPreset(preset) : addPresetSection(preset)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition ${colorMap[preset.color] ?? colorMap.violet}`}
                    title={preset.description}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {preset.label}
                    {isFullyActive && <CheckCircle className="w-3 h-3 opacity-70" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

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
        {/* Fixed Hero KPI Cards (main view only) */}
        {/* ============================================================ */}
        {viewId === 'main' && (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {ALL_KPIS.filter(k => ['gmv', 'net_revenue', 'gross_margin', 'cac', 'blended_roas', 'inventory_turnover', 'aov', 'total_orders'].includes(k.id)).map((kpi) => {
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
        )}

        {/* ============================================================ */}
        {/* Customizable KPI Cards Grid (custom views only) */}
        {/* ============================================================ */}
        {viewId !== 'main' && (
          activeKPIs.length > 0 ? (
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
              <p className="text-gray-400 text-sm">
                No KPIs selected. Use the Quick Add buttons above or open the KPI panel.
              </p>
            </div>
          )
        )}

        {/* ============================================================ */}
        {/* Smart KPI Charts (custom views only) */}
        {/* ============================================================ */}
        {viewId !== 'main' && chartPanels.length > 0 && (
          <div className={`grid gap-4 ${
            chartPanels.length === 1 ? 'grid-cols-1' :
            chartMode === 'individual' && chartPanels.length > 2 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
            'grid-cols-1 lg:grid-cols-2'
          }`}>
            {chartPanels.map(panel => renderChartPanel(panel))}
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
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={((value: number, name: string) => [`$${(value / 1000).toFixed(1)}K`, name === 'revenue' ? 'Revenue' : 'COGS']) as any}
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
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={((value: number) => [`$${(value / 1000).toFixed(0)}K`, undefined]) as any}
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
      {/* KPI Toggle Sidebar (custom views only) */}
      {/* ============================================================ */}
      {viewId !== 'main' && sidebarOpen && (
        <div className="w-64 shrink-0 ml-4 bg-gray-900 border border-gray-800 rounded-lg p-4 h-fit sticky top-4 max-h-[calc(100vh-120px)] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Toggle KPIs</h3>
            <span className="text-[10px] text-gray-500">{visibleKPIs.length} active</span>
          </div>

          {categories.map((cat) => {
            const kpis = ALL_KPIS.filter(k => k.category === cat.key)
            const allActive = kpis.every(k => visibleKPIs.includes(k.id))
            return (
              <div key={cat.key} className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{cat.label}</p>
                  <button
                    onClick={() => {
                      if (allActive) {
                        // Remove all in category
                        const next = visibleKPIs.filter(id => !kpis.find(k => k.id === id))
                        setVisibleKPIs(next)
                        if (typeof window !== 'undefined') localStorage.setItem(storageKey(viewId), JSON.stringify(next))
                      } else {
                        // Add all in category
                        const next = Array.from(new Set([...visibleKPIs, ...kpis.map(k => k.id)]))
                        setVisibleKPIs(next)
                        if (typeof window !== 'undefined') localStorage.setItem(storageKey(viewId), JSON.stringify(next))
                      }
                    }}
                    className="text-[10px] text-violet-500 hover:text-violet-300 transition"
                  >
                    {allActive ? 'remove all' : 'add all'}
                  </button>
                </div>
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
