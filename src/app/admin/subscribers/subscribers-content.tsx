'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronLeft, ChevronRight, Loader } from 'lucide-react';
import Link from 'next/link';

interface Subscriber {
  id: string;
  name: string;
  plan: 'basic' | 'pro' | 'enterprise';
  subscription_status: 'trialing' | 'active' | 'past_due' | 'canceled';
  user_count: number;
  integration_count: number;
  last_sync_at: string | null;
  error_count: number;
  created_at: string;
}

const ITEMS_PER_PAGE = 20;

export default function SubscribersContent() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [filteredSubscribers, setFilteredSubscribers] = useState<Subscriber[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/subscribers?limit=1000');
        if (res.ok) {
          const data = await res.json();
          // Map API response keys to frontend interface
          setSubscribers((data.subscribers || []).map((s: any) => ({
            ...s,
            last_sync_at: s.last_sync || null,
            error_count: s.unresolved_error_count || 0,
          })));
        }
      } catch (error) {
        console.error('Failed to fetch subscribers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscribers();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = subscribers;

    if (searchQuery) {
      filtered = filtered.filter((sub) =>
        sub.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter === 'active') {
      // "Active" view shows both active and trialing subscribers
      filtered = filtered.filter((sub) => sub.subscription_status === 'active' || sub.subscription_status === 'trialing');
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter((sub) => sub.subscription_status === statusFilter);
    }

    if (planFilter !== 'all') {
      filtered = filtered.filter((sub) => sub.plan === planFilter);
    }

    setFilteredSubscribers(filtered);
    setCurrentPage(1);
  }, [subscribers, searchQuery, statusFilter, planFilter]);

  const totalPages = Math.ceil(filteredSubscribers.length / ITEMS_PER_PAGE);
  const paginatedSubscribers = filteredSubscribers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
        <h1 className="text-3xl font-bold">Subscribers</h1>
        <p className="text-[#8888a0] mt-2">
          {statusFilter === 'canceled'
            ? `Canceled subscribers (${filteredSubscribers.length})`
            : statusFilter === 'all'
            ? `All subscribers (${filteredSubscribers.length})`
            : `Active subscribers (${filteredSubscribers.length})`}
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-3 text-[#8888a0]" size={20} />
            <input
              type="text"
              placeholder="Search by organization name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-[#2a2a3d] rounded-lg pl-10 pr-4 py-2 text-[#e8e8f0] placeholder-[#8888a0] focus:outline-none focus:border-[#06b6d4]"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0a0a0f] border border-[#2a2a3d] rounded-lg px-4 py-2 text-[#e8e8f0] focus:outline-none focus:border-[#06b6d4]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="trialing">Trialing</option>
            <option value="past_due">Past Due</option>
            <option value="canceled">Canceled</option>
          </select>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="bg-[#0a0a0f] border border-[#2a2a3d] rounded-lg px-4 py-2 text-[#e8e8f0] focus:outline-none focus:border-[#06b6d4]"
          >
            <option value="all">All Plans</option>
            <option value="basic">Starter</option>
            <option value="pro">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </Card>

      {/* Subscribers Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[#2a2a3d]">
              <tr className="text-[#8888a0]">
                <th className="text-left py-3 px-4 font-medium">Name</th>
                <th className="text-left py-3 px-4 font-medium">Plan</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium">Users</th>
                <th className="text-left py-3 px-4 font-medium">Integrations</th>
                <th className="text-left py-3 px-4 font-medium">Last Sync</th>
                <th className="text-left py-3 px-4 font-medium">Errors</th>
                <th className="text-left py-3 px-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSubscribers.length > 0 ? (
                paginatedSubscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="border-b border-[#2a2a3d] hover:bg-[#12121a]">
                    <td className="py-3 px-4">{subscriber.name}</td>
                    <td className="py-3 px-4">
                      <Badge variant={getPlanColor(subscriber.plan)}>
                        {subscriber.plan === 'basic' ? 'Starter' : subscriber.plan === 'pro' ? 'Professional' : 'Enterprise'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getStatusColor(subscriber.subscription_status)}>
                        {subscriber.subscription_status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-[#8888a0]">{subscriber.user_count}</td>
                    <td className="py-3 px-4 text-[#8888a0]">{subscriber.integration_count}</td>
                    <td className="py-3 px-4 text-[#8888a0]">
                      {subscriber.last_sync_at
                        ? new Date(subscriber.last_sync_at).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="py-3 px-4">
                      {subscriber.error_count > 0 ? (
                        <Badge variant="danger">{subscriber.error_count}</Badge>
                      ) : (
                        <span className="text-[#8888a0]">0</span>
                      )}
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
                  <td colSpan={8} className="py-8 text-center text-[#8888a0]">
                    No subscribers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-[#2a2a3d]">
            <p className="text-sm text-[#8888a0]">
              Page {currentPage} of {totalPages} ({filteredSubscribers.length} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-[#2a2a3d] hover:border-[#06b6d4] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-[#2a2a3d] hover:border-[#06b6d4] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
