'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Loader,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Eye,
  EyeOff,
} from 'lucide-react';
import Link from 'next/link';

interface SubscriberDetail {
  id: string;
  name: string;
  plan: 'basic' | 'pro' | 'enterprise';
  subscription_status: 'trialing' | 'active' | 'past_due' | 'canceled';
  stripe_customer_id: string | null;
  qbo_connected: boolean;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
}

interface Integration {
  id: string;
  provider: string;
  status: string;
  external_account_name: string | null;
  last_sync_at: string | null;
  last_sync_error: string | null;
}

interface ErrorRecord {
  id: string;
  error_type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string | null;
  created_at: string;
  resolved: boolean;
}

export default function SubscriberDetail() {
  const params = useParams();
  const router = useRouter();
  const subscriberId = params.id as string;

  const [subscriber, setSubscriber] = useState<SubscriberDetail | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [errors, setErrors] = useState<ErrorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);

        // Fetch subscriber details
        const subRes = await fetch(`/api/admin/subscribers/${subscriberId}`);
        if (subRes.ok) {
          const subData = await subRes.json();
          // API returns { organization, profiles, integrations, error_logs }
          const org = subData.organization;
          if (org) {
            setSubscriber({
              id: org.id,
              name: org.name,
              plan: org.plan,
              subscription_status: org.subscription_status,
              stripe_customer_id: org.stripe_customer_id,
              qbo_connected: !!org.qbo_realm_id,
              created_at: org.created_at,
              updated_at: org.updated_at,
            });
          }
          setUsers((subData.profiles || []).map((p: any) => ({
            id: p.id,
            email: p.email || '',
            full_name: p.full_name,
            role: p.role,
            created_at: p.created_at,
          })));
          setIntegrations(subData.integrations || []);
          setErrors(subData.error_logs || []);
        }
      } catch (error) {
        console.error('Failed to fetch subscriber details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [subscriberId]);

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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'error':
        return 'danger';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin text-[#06b6d4]" size={40} />
      </div>
    );
  }

  if (!subscriber) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/subscribers">
            <button className="flex items-center gap-2 text-[#8888a0] hover:text-[#e8e8f0]">
              <ArrowLeft size={20} />
              Back to Subscribers
            </button>
          </Link>
        </div>
        <Card className="p-6 text-center text-[#8888a0]">
          <p>Subscriber not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/subscribers">
            <button className="flex items-center gap-2 text-[#8888a0] hover:text-[#e8e8f0]">
              <ArrowLeft size={20} />
              Back
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              Viewing subscriber: <span className="text-[#06b6d4]">{subscriber.name}</span>
            </h1>
            <div className="flex gap-2 mt-2">
              <Badge variant={getPlanColor(subscriber.plan)}>
                {subscriber.plan}
              </Badge>
              <Badge variant={getStatusColor(subscriber.subscription_status)}>
                {subscriber.subscription_status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-[#8888a0] text-sm font-medium">Plan</p>
          <p className="text-lg font-semibold mt-2 capitalize">{subscriber.plan}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[#8888a0] text-sm font-medium">Status</p>
          <p className="text-lg font-semibold mt-2 capitalize">
            {subscriber.subscription_status}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[#8888a0] text-sm font-medium">Created Date</p>
          <p className="text-lg font-semibold mt-2">
            {new Date(subscriber.created_at).toLocaleDateString()}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[#8888a0] text-sm font-medium">QBO Connected</p>
          <div className="mt-2">
            {subscriber.qbo_connected ? (
              <CheckCircle className="text-[#22c55e]" size={24} />
            ) : (
              <AlertTriangle className="text-[#eab308]" size={24} />
            )}
          </div>
        </Card>
      </div>

      {subscriber.stripe_customer_id && (
        <Card className="p-4 bg-[#1a1a26] border-[#06b6d4]/30">
          <p className="text-[#8888a0] text-sm font-medium">Stripe Customer ID</p>
          <p className="text-sm font-mono mt-2 text-[#06b6d4] break-all">
            {subscriber.stripe_customer_id}
          </p>
        </Card>
      )}

      {/* Users Table */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Users ({users.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[#2a2a3d]">
              <tr className="text-[#8888a0]">
                <th className="text-left py-3 px-4 font-medium">Email</th>
                <th className="text-left py-3 px-4 font-medium">Name</th>
                <th className="text-left py-3 px-4 font-medium">Role</th>
                <th className="text-left py-3 px-4 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-[#2a2a3d] hover:bg-[#12121a]">
                    <td className="py-3 px-4">{user.email}</td>
                    <td className="py-3 px-4 text-[#8888a0]">{user.full_name || '-'}</td>
                    <td className="py-3 px-4">
                      <Badge variant="info">{user.role}</Badge>
                    </td>
                    <td className="py-3 px-4 text-[#8888a0]">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#8888a0]">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Integrations Table */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Integrations ({integrations.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[#2a2a3d]">
              <tr className="text-[#8888a0]">
                <th className="text-left py-3 px-4 font-medium">Provider</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium">Account</th>
                <th className="text-left py-3 px-4 font-medium">Last Sync</th>
                <th className="text-left py-3 px-4 font-medium">Last Error</th>
              </tr>
            </thead>
            <tbody>
              {integrations.length > 0 ? (
                integrations.map((integration) => (
                  <tr key={integration.id} className="border-b border-[#2a2a3d] hover:bg-[#12121a]">
                    <td className="py-3 px-4 font-medium capitalize">{integration.provider}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          integration.status === 'connected' ? 'success' : 'warning'
                        }
                      >
                        {integration.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-[#8888a0]">
                      {integration.external_account_name || '-'}
                    </td>
                    <td className="py-3 px-4 text-[#8888a0]">
                      {integration.last_sync_at
                        ? new Date(integration.last_sync_at).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="py-3 px-4 text-[#8888a0] text-xs">
                      {integration.last_sync_error
                        ? integration.last_sync_error.substring(0, 40) + '...'
                        : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#8888a0]">
                    No integrations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Error Log */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Errors ({errors.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[#2a2a3d]">
              <tr className="text-[#8888a0]">
                <th className="text-left py-3 px-4 font-medium">Type</th>
                <th className="text-left py-3 px-4 font-medium">Severity</th>
                <th className="text-left py-3 px-4 font-medium">Message</th>
                <th className="text-left py-3 px-4 font-medium">Timestamp</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {errors.length > 0 ? (
                errors.map((error) => (
                  <tr key={error.id} className="border-b border-[#2a2a3d] hover:bg-[#12121a]">
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
                      <Badge variant={error.resolved ? 'success' : 'warning'}>
                        {error.resolved ? 'Resolved' : 'Unresolved'}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#8888a0]">
                    No errors found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* View Dashboard Button */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowDashboard(!showDashboard)}
          className="flex items-center gap-2 px-6 py-3 bg-[#06b6d4] hover:bg-[#06b6d4]/90 text-white font-medium rounded-lg transition-all"
        >
          {showDashboard ? (
            <>
              <EyeOff size={20} />
              Hide Dashboard
            </>
          ) : (
            <>
              <Eye size={20} />
              View Dashboard
            </>
          )}
        </button>
      </div>

      {/* Dashboard Preview */}
      {showDashboard && (
        <Card className="p-6 border-2 border-[#06b6d4]/50">
          <div className="mb-4 p-4 bg-[#ef4444]/20 border border-[#ef4444]/30 rounded-lg">
            <p className="text-[#fca5a5] font-medium">
              ADMIN VIEW — Viewing as: <span className="font-bold">{subscriber.name}</span> — Read Only
            </p>
          </div>
          <div className="bg-[#0a0a0f] rounded-lg p-6 border border-[#2a2a3d] min-h-96">
            <p className="text-[#8888a0] text-center py-12">
              Dashboard preview for {subscriber.name} would be rendered here
            </p>
            <p className="text-[#8888a0] text-center text-sm">
              This would display the subscriber's actual dashboard data in read-only mode
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
