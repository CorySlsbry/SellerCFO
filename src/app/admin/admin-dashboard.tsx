'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Loader,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';

interface KPIData {
  totalSubscribers: number;
  activeSubscriptions: number;
  mrr: number;
  unresolvedErrors: number;
}

interface MetricData {
  date: string;
  mrr: number;
  subscribers: number;
}

interface ErrorRecord {
  id: string;
  organization_id: string;
  organization_name?: string;
  error_type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string | null;
  created_at: string;
  resolved: boolean;
}

interface SubscriberRecord {
  id: string;
  name: string;
  plan: 'basic' | 'pro' | 'enterprise';
  subscription_status: 'trialing' | 'active' | 'past_due' | 'canceled';
  integration_count: number;
  created_at: string;
}

export default function AdminDashboard() {
  const [kpiData, setKpiData] = useState<KPIData>({
    totalSubscribers: 0,
    activeSubscriptions: 0,
    mrr: 0,
    unresolvedErrors: 0,
  });
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [errors, setErrors] = useState<ErrorRecord[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriberRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);

        // Fetch metrics
        const metricsRes = await fetch('/api/admin/metrics');
        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          // Map API response shape to frontend state
          if (metricsData.current_stats) {
            setKpiData({
              totalSubscribers: metricsData.current_stats.total_organizations || 0,
              activeSubscriptions: metricsData.current_stats.active_subscriptions || 0,
              mrr: metricsData.current_stats.mrr || 0,
              unresolvedErrors: metricsData.current_stats.total_errors_unresolved || 0,
            });
          } else if (metricsData.kpi) {
            setKpiData(metricsData.kpi);
          }
          setMetrics(metricsData.mrrTrend || metricsData.historical_metrics || []);
        }

        // Fetch errors
        const errorsRes = await fetch('/api/admin/errors');
        if (errorsRes.ok) {
          const errorsData = await errorsRes.json();
          setErrors(errorsData.errors);
        }

        // Fetch subscribers
        const subscribersRes = await fetch('/api/admin/subscribers');
        if (subscribersRes.ok) {
          const subscribersData = await subscribersRes.json();
          setSubscribers(subscribersData.subscribers);
        }
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'danger';
      case 'error':
        return 'danger';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return 'info';
      case 'pro':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'trialing':
        return 'info';
      case 'past_due':
        return 'warning';
      case 'canceled':
        return 'default';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin text-[#06b6d4]" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Platform Overview</h1>
        <p className="text-[#8888a0] mt-2">System metrics and subscriber management</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="metric" className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#8888a0] text-sm font-medium">Total Subscribers</p>
              <p className="text-3xl font-bold mt-2">{kpiData.totalSubscribers}</p>
            </div>
            <Users className="text-[#06b6d4]" size={24} />
          </div>
        </Card>

        <Card variant="metric" className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#8888a0] text-sm font-medium">Active Subscriptions</p>
              <p className="text-3xl font-bold mt-2">{kpiData.activeSubscriptions}</p>
            </div>
            <CheckCircle className="text-[#22c55e]" size={24} />
          </div>
        </Card>

        <Card variant="metric" className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#8888a0] text-sm font-medium">MRR</p>
              <p className="text-3xl font-bold mt-2">
                ${(kpiData.mrr / 1000).toFixed(1)}K
              </p>
            </div>
            <DollarSign className="text-[#eab308]" size={24} />
          </div>
        </Card>

        <Card variant="metric" className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#8888a0] text-sm font-medium">Unresolved Errors</p>
              <p className="text-3xl font-bold mt-2">{kpiData.unresolvedErrors}</p>
            </div>
            <AlertTriangle className="text-[#ef4444]" size={24} />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MRR Trend */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">MRR Trend (30 days)</h2>
          {metrics.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3d" />
                <XAxis dataKey="date" stroke="#8888a0" style={{ fontSize: '12px' }} />
                <YAxis stroke="#8888a0" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#12121a',
                    border: '1px solid #2a2a3d',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => `$${(value as number).toLocaleString()}`}
                />
                <Line
                  type="monotone"
                  dataKey="mrr"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-[#8888a0]">
              No data available
            </div>
          )}
        </Card>

        {/* Subscriber Growth */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Subscriber Growth</h2>
          {metrics.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3d" />
                <XAxis dataKey="date" stroke="#8888a0" style={{ fontSize: '12px' }} />
                <YAxis stroke="#8888a0" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#12121a',
                    border: '1px solid #2a2a3d',
                    borderRadius: '8px',
                  }}
                />
                <Bar
                  dataKey="subscribers"
                  fill="#22c55e"
                  radius={[8, 8, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-[#8888a0]">
              No data available
            </div>
          )}
        </Card>
      </div>

      {/* Recent Errors Table */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Errors</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[#2a2a3d]">
              <tr className="text-[#8888a0]">
                <th className="text-left py-3 px-4 font-medium">Organization</th>
                <th className="text-left py-3 px-4 font-medium">Type</th>
                <th className="text-left py-3 px-4 font-medium">Severity</th>
                <th className="text-left py-3 px-4 font-medium">Message</th>
                <th className="text-left py-3 px-4 font-medium">Timestamp</th>
                <th className="text-left py-3 px-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {errors.length > 0 ? (
                errors.map((error) => (
                  <tr key={error.id} className="border-b border-[#2a2a3d] hover:bg-[#12121a]">
                    <td className="py-3 px-4">{error.organization_name || 'Unknown'}</td>
                    <td className="py-3 px-4 text-[#8888a0]">{error.error_type}</td>
                    <td className="py-3 px-4">
                      <Badge variant={getSeverityColor(error.severity)}>
                        {error.severity}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-[#8888a0] max-w-xs truncate">
                      {error.title}
                    </td>
                    <td className="py-3 px-4 text-[#8888a0]">
                      {new Date(error.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <Link href={`/admin/errors?id=${error.id}`}>
                        <button className="text-[#06b6d4] hover:text-[#a5b4fc] text-xs font-medium">
                          {error.resolved ? 'View' : 'Resolve'}
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#8888a0]">
                    No errors found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Subscriber List */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Subscribers</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[#2a2a3d]">
              <tr className="text-[#8888a0]">
                <th className="text-left py-3 px-4 font-medium">Name</th>
                <th className="text-left py-3 px-4 font-medium">Plan</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium">Integrations</th>
                <th className="text-left py-3 px-4 font-medium">Joined</th>
                <th className="text-left py-3 px-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.length > 0 ? (
                subscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="border-b border-[#2a2a3d] hover:bg-[#12121a]">
                    <td className="py-3 px-4">{subscriber.name}</td>
                    <td className="py-3 px-4">
                      <Badge variant={getPlanColor(subscriber.plan)}>
                        {subscriber.plan}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getStatusColor(subscriber.subscription_status)}>
                        {subscriber.subscription_status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-[#8888a0]">{subscriber.integration_count}</td>
                    <td className="py-3 px-4 text-[#8888a0]">
                      {new Date(subscriber.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <Link href={`/admin/subscribers/${subscriber.id}`}>
                        <button className="text-[#06b6d4] hover:text-[#a5b4fc] text-xs font-medium">
                          View
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#8888a0]">
                    No subscribers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
