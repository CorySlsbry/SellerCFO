'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Eye,
  UserPlus,
  TrendingUp,
  Globe,
  Loader,
  ArrowUpRight,
  ArrowDownRight,
  MousePointerClick,
  BarChart3,
  RefreshCw,
} from 'lucide-react';

interface AnalyticsData {
  summary: {
    total_views: number;
    total_page_views: number;
    landing_page_views: number;
    signup_page_views: number;
    total_signups: number;
    conversion_rate: number;
    active_subscriptions: number;
    total_organizations: number;
  };
  daily: { date: string; views: number; unique_pages: number; signups: number }[];
  top_pages: { page: string; count: number }[];
  top_referrers: { referrer: string; count: number }[];
  events: Record<string, number>;
  utm_sources: Record<string, number>;
  period_days: number;
}

const CHART_COLORS = ['#06b6d4', '#22c55e', '#eab308', '#ef4444', '#06b6d4', '#f97316', '#8b5cf6', '#ec4899'];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (period: number) => {
    try {
      const res = await fetch(`/api/admin/analytics?days=${period}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData(days).finally(() => setLoading(false));
  }, [days]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData(days);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="animate-spin text-[#06b6d4]" size={40} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-[#8888a0]">
        Failed to load analytics data
      </div>
    );
  }

  const s = data.summary;

  // Calculate week-over-week changes from daily data
  const dailyData = data.daily || [];
  const midpoint = Math.floor(dailyData.length / 2);
  const firstHalf = dailyData.slice(0, midpoint);
  const secondHalf = dailyData.slice(midpoint);
  const firstHalfViews = firstHalf.reduce((sum, d) => sum + d.views, 0);
  const secondHalfViews = secondHalf.reduce((sum, d) => sum + d.views, 0);
  const viewsTrend = firstHalfViews > 0 ? ((secondHalfViews - firstHalfViews) / firstHalfViews) * 100 : 0;

  // Funnel data for pie chart
  const funnelData = [
    { name: 'Landing Views', value: s.landing_page_views, color: '#06b6d4' },
    { name: 'Signup Page', value: s.signup_page_views, color: '#eab308' },
    { name: 'Signups', value: s.total_signups, color: '#22c55e' },
    { name: 'Subscribed', value: s.active_subscriptions, color: '#06b6d4' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Site Analytics</h1>
          <p className="text-[#8888a0] mt-2">Landing page traffic, signups &amp; conversion tracking</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className="flex bg-[#12121a] border border-[#2a2a3d] rounded-lg overflow-hidden">
            {[7, 14, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 text-sm font-medium transition-all ${
                  days === d
                    ? 'bg-[#06b6d4] text-white'
                    : 'text-[#8888a0] hover:text-[#e8e8f0]'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg border border-[#2a2a3d] text-[#8888a0] hover:text-[#e8e8f0] hover:bg-[#2a2a3d] transition-all"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="metric" className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#8888a0] text-sm font-medium">Total Page Views</p>
              <p className="text-3xl font-bold mt-2">{s.total_views.toLocaleString()}</p>
              {viewsTrend !== 0 && (
                <div className={`flex items-center gap-1 mt-2 text-sm ${viewsTrend > 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                  {viewsTrend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  <span>{Math.abs(viewsTrend).toFixed(1)}% vs prior period</span>
                </div>
              )}
            </div>
            <div className="p-2.5 rounded-xl bg-[#06b6d4]/10">
              <Eye className="text-[#06b6d4]" size={22} />
            </div>
          </div>
        </Card>

        <Card variant="metric" className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#8888a0] text-sm font-medium">Total Signups</p>
              <p className="text-3xl font-bold mt-2">{s.total_signups.toLocaleString()}</p>
              <p className="text-sm text-[#8888a0] mt-2">Last {days} days</p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#22c55e]/10">
              <UserPlus className="text-[#22c55e]" size={22} />
            </div>
          </div>
        </Card>

        <Card variant="metric" className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#8888a0] text-sm font-medium">Conversion Rate</p>
              <p className="text-3xl font-bold mt-2">{s.conversion_rate}%</p>
              <p className="text-sm text-[#8888a0] mt-2">Landing → Signup</p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#eab308]/10">
              <TrendingUp className="text-[#eab308]" size={22} />
            </div>
          </div>
        </Card>

        <Card variant="metric" className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#8888a0] text-sm font-medium">Active Subscriptions</p>
              <p className="text-3xl font-bold mt-2">{s.active_subscriptions}</p>
              <p className="text-sm text-[#8888a0] mt-2">{s.total_organizations} total orgs</p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#06b6d4]/10">
              <MousePointerClick className="text-[#06b6d4]" size={22} />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Traffic + Signups (takes 2 cols) */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Daily Traffic &amp; Signups</h2>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="signupsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3d" />
                <XAxis
                  dataKey="date"
                  stroke="#8888a0"
                  style={{ fontSize: '11px' }}
                  tickFormatter={(v) => {
                    const d = new Date(v + 'T00:00:00');
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis stroke="#8888a0" style={{ fontSize: '11px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#12121a',
                    border: '1px solid #2a2a3d',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                  labelFormatter={(v) => {
                    const d = new Date(v + 'T00:00:00');
                    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fill="url(#viewsGrad)"
                  name="Page Views"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="signups"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#signupsGrad)"
                  name="Signups"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-[#8888a0]">
              No traffic data yet. Add the tracking script to your landing page.
            </div>
          )}
        </Card>

        {/* Conversion Funnel */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Conversion Funnel</h2>
          {funnelData.length > 0 ? (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={funnelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {funnelData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#12121a',
                      border: '1px solid #2a2a3d',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {funnelData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[#8888a0]">{item.name}</span>
                    </div>
                    <span className="font-medium">{item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-[#8888a0]">
              No funnel data yet
            </div>
          )}
        </Card>
      </div>

      {/* Bottom Row: Top Pages, Referrers, UTM Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Pages */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-[#06b6d4]" />
            Top Pages
          </h2>
          {data.top_pages.length > 0 ? (
            <div className="space-y-3">
              {data.top_pages.map((p, i) => {
                const maxCount = data.top_pages[0]?.count || 1;
                const pct = (p.count / maxCount) * 100;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-[#e8e8f0] truncate max-w-[200px]" title={p.page}>
                        {p.page}
                      </span>
                      <span className="text-[#8888a0] font-medium ml-2">{p.count}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#2a2a3d] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#06b6d4]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[#8888a0] text-sm">No page data yet</p>
          )}
        </Card>

        {/* Top Referrers */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe size={18} className="text-[#22c55e]" />
            Top Referrers
          </h2>
          {data.top_referrers.length > 0 ? (
            <div className="space-y-3">
              {data.top_referrers.map((r, i) => {
                const maxCount = data.top_referrers[0]?.count || 1;
                const pct = (r.count / maxCount) * 100;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-[#e8e8f0] truncate max-w-[200px]" title={r.referrer}>
                        {r.referrer}
                      </span>
                      <span className="text-[#8888a0] font-medium ml-2">{r.count}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#2a2a3d] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#22c55e]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[#8888a0] text-sm">No referrer data yet</p>
          )}
        </Card>

        {/* UTM Sources */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-[#eab308]" />
            UTM Sources
          </h2>
          {Object.keys(data.utm_sources).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(data.utm_sources)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([source, count], i) => {
                  const maxCount = Object.values(data.utm_sources).sort((a, b) => b - a)[0] || 1;
                  const pct = (count / maxCount) * 100;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-[#e8e8f0] truncate max-w-[200px]">{source}</span>
                        <span className="text-[#8888a0] font-medium ml-2">{count}</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#2a2a3d] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#eab308]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-[#8888a0] text-sm">No UTM-tagged traffic yet. Add ?utm_source= to your links.</p>
          )}
        </Card>
      </div>

      {/* Event Breakdown */}
      {Object.keys(data.events).length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Event Breakdown</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={Object.entries(data.events)
                .sort(([, a], [, b]) => b - a)
                .map(([event, count]) => ({ event, count }))}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3d" />
              <XAxis type="number" stroke="#8888a0" style={{ fontSize: '11px' }} />
              <YAxis type="category" dataKey="event" stroke="#8888a0" style={{ fontSize: '11px' }} width={120} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#12121a',
                  border: '1px solid #2a2a3d',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              />
              <Bar dataKey="count" fill="#06b6d4" radius={[0, 8, 8, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
