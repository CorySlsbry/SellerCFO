'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ImpersonatedDashboardData {
  organizationName: string;
  data: Record<string, any>;
}

export default function ImpersonateDashboardPage() {
  const params = useParams();
  const organizationId = params.id as string;

  const [dashboardData, setDashboardData] = useState<ImpersonatedDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/impersonate?org_id=${organizationId}`);
        if (res.ok) {
          const data = await res.json();
          setDashboardData(data);
        }
      } catch (error) {
        console.error('Failed to fetch impersonated dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [organizationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin text-[#06b6d4]" size={40} />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="space-y-6 p-6">
        <Link href={`/admin/subscribers/${organizationId}`}>
          <button className="flex items-center gap-2 text-[#8888a0] hover:text-[#e8e8f0]">
            <ArrowLeft size={20} />
            Back to Subscriber
          </button>
        </Link>
        <Card className="p-6 text-center text-[#8888a0]">
          <p>Dashboard data not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0f] text-[#e8e8f0] min-h-screen">
      {/* Admin Banner */}
      <div className="bg-[#ef4444] text-white px-6 py-4 border-b border-[#ef4444]/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p className="font-bold text-lg">
              ADMIN VIEW — Viewing as: <span className="text-white">{dashboardData.organizationName}</span> — Read Only
            </p>
            <p className="text-sm opacity-90 mt-1">
              You are viewing this subscriber's dashboard in read-only mode. Changes will not be saved.
            </p>
          </div>
          <Link href={`/admin/subscribers/${organizationId}`}>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all">
              <ArrowLeft size={18} />
              Back
            </button>
          </Link>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="p-6 lg:p-8">
        <div className="space-y-6">
          {/* Placeholder for Dashboard Content */}
          <Card className="p-6 border-2 border-dashed border-[#2a2a3d]">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-2">Dashboard Content</h2>
              <p className="text-[#8888a0] mb-4">
                This area would contain the full dashboard for {dashboardData.organizationName}
              </p>
              <p className="text-sm text-[#8888a0]">
                Including KPIs, charts, claims tracking, cash flow, AR/AP, and all other dashboard features
              </p>
            </div>
          </Card>

          {/* Raw Data Inspector (for debugging) */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Data Summary</h3>
            <div className="bg-[#0a0a0f] border border-[#2a2a3d] rounded-lg p-4 text-sm font-mono text-[#8888a0] overflow-auto max-h-96">
              <pre>
                {JSON.stringify(dashboardData.data, null, 2)}
              </pre>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
