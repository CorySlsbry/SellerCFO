'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Sparkles, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Lightbulb, DollarSign, Package, ShoppingCart, BarChart3,
  ArrowRight, RefreshCw,
} from 'lucide-react';

interface Insight {
  id: string;
  type: 'opportunity' | 'warning' | 'success' | 'info';
  title: string;
  description: string;
  impact: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

const insights: Insight[] = [
  {
    id: '1',
    type: 'opportunity',
    title: 'Increase Shopify ad spend — strong LTV:CAC',
    description: 'Your Shopify channel has a 5.8:1 LTV:CAC ratio, well above the 3:1 minimum. The channel is underspending on acquisition relative to its efficiency.',
    impact: 'Potential $15K-25K additional monthly revenue',
    action: 'Increase Shopify ad budget by 30%',
    priority: 'high',
    category: 'Growth',
  },
  {
    id: '2',
    type: 'warning',
    title: 'Amazon return rate trending up',
    description: 'Return rate on Amazon has increased from 6.2% to 8.1% over the last 60 days. Top returned products: Vitamin C Moisturizer (12.3% return rate) and Eye Cream Deluxe (9.8%).',
    impact: 'Estimated $3.2K/month in lost margin',
    action: 'Review product listings and packaging for top returned items',
    priority: 'high',
    category: 'Operations',
  },
  {
    id: '3',
    type: 'success',
    title: 'Contribution margin improving',
    description: 'Blended contribution margin per order has increased from $18.20 to $22.50 over the past quarter, driven by better COGS negotiations and shipping rate optimization.',
    impact: '+23.6% improvement in unit economics',
    action: 'Continue current optimization strategy',
    priority: 'low',
    category: 'Profitability',
  },
  {
    id: '4',
    type: 'warning',
    title: 'Dead inventory growing — 90+ day stock at $42K',
    description: '12% of your inventory ($42K) has been sitting for 90+ days. Top slow movers: Body Oil Luxe (180 days avg), Eye Cream Deluxe bundle (120 days avg).',
    impact: '$42K in tied-up capital + storage costs',
    action: 'Run clearance promotion or liquidate slow movers',
    priority: 'high',
    category: 'Inventory',
  },
  {
    id: '5',
    type: 'opportunity',
    title: 'TikTok Shop showing fastest growth',
    description: 'TikTok Shop revenue grew 120% month-over-month. While still small ($5K/mo), the channel has the lowest CAC of any channel at $12.',
    impact: 'Fastest-growing acquisition channel',
    action: 'Allocate more product catalog to TikTok Shop',
    priority: 'medium',
    category: 'Growth',
  },
  {
    id: '6',
    type: 'info',
    title: 'Cash conversion cycle at 42 days — within target',
    description: 'Your cash conversion cycle is 42 days, well within the optimal 30-60 day range for e-commerce. DIO is 69 days, DSO is 12 days, DPO is 39 days.',
    impact: 'Healthy working capital position',
    action: 'Negotiate extended payment terms with suppliers to improve further',
    priority: 'low',
    category: 'Cash Flow',
  },
  {
    id: '7',
    type: 'opportunity',
    title: 'Walmart Marketplace margin opportunity',
    description: 'Your top 5 Shopify SKUs are not listed on Walmart. Given their 45% growth rate and similar fee structure, expanding catalog could capture incremental revenue.',
    impact: 'Estimated $8K-12K/month additional revenue',
    action: 'List top 5 Shopify SKUs on Walmart Marketplace',
    priority: 'medium',
    category: 'Growth',
  },
  {
    id: '8',
    type: 'warning',
    title: 'Shipping costs above benchmark',
    description: 'Your shipping cost per order is $6.80, which is 15% above the $5.90 benchmark for your category. FBM orders are particularly high at $8.20/order.',
    impact: '$0.90/order margin leak across 6,785 orders = $6.1K/month',
    action: 'Renegotiate carrier rates or shift more volume to FBA',
    priority: 'medium',
    category: 'Operations',
  },
];

const iconMap = {
  opportunity: Lightbulb,
  warning: AlertTriangle,
  success: CheckCircle,
  info: BarChart3,
};

const colorMap = {
  opportunity: { bg: 'bg-blue-900/20', border: 'border-blue-900', text: 'text-blue-400', icon: 'text-blue-400' },
  warning: { bg: 'bg-yellow-900/20', border: 'border-yellow-900', text: 'text-yellow-400', icon: 'text-yellow-400' },
  success: { bg: 'bg-green-900/20', border: 'border-green-900', text: 'text-green-400', icon: 'text-green-400' },
  info: { bg: 'bg-violet-900/20', border: 'border-violet-900', text: 'text-violet-400', icon: 'text-violet-400' },
};

export default function InsightsPage() {
  const [filter, setFilter] = useState<string>('all');

  const filteredInsights = filter === 'all'
    ? insights
    : insights.filter(i => i.type === filter);

  const highPriority = insights.filter(i => i.priority === 'high').length;
  const opportunities = insights.filter(i => i.type === 'opportunity').length;
  const warnings = insights.filter(i => i.type === 'warning').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-400" />
            AI Insights
          </h1>
          <p className="text-gray-400 text-sm mt-1">AI-powered analysis of your e-commerce performance</p>
        </div>
        <Button variant="secondary" size="sm" className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh Analysis
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 bg-gray-900 border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-900/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{highPriority}</p>
              <p className="text-xs text-gray-400">High Priority Items</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 bg-gray-900 border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-900/20 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{opportunities}</p>
              <p className="text-xs text-gray-400">Growth Opportunities</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 bg-gray-900 border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-900/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{warnings}</p>
              <p className="text-xs text-gray-400">Warnings to Address</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { value: 'all', label: 'All' },
          { value: 'opportunity', label: 'Opportunities' },
          { value: 'warning', label: 'Warnings' },
          { value: 'success', label: 'Wins' },
          { value: 'info', label: 'Info' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              filter === tab.value
                ? 'bg-violet-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {filteredInsights.map((insight) => {
          const Icon = iconMap[insight.type];
          const colors = colorMap[insight.type];
          return (
            <Card key={insight.id} className={`p-5 ${colors.bg} border ${colors.border}`}>
              <div className="flex items-start gap-4">
                <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${colors.icon}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`text-sm font-semibold ${colors.text}`}>{insight.title}</h3>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      insight.priority === 'high' ? 'bg-red-900/30 text-red-400' :
                      insight.priority === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-gray-800 text-gray-400'
                    }`}>
                      {insight.priority}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-500">
                      {insight.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-2">{insight.description}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-gray-500">Impact: <span className="text-gray-300">{insight.impact}</span></span>
                    <span className="text-gray-500">Action: <span className={colors.text}>{insight.action}</span></span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
