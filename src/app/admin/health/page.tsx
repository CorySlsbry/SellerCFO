'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Loader, CheckCircle, AlertTriangle } from 'lucide-react';

interface HealthMetric {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  value: string | number;
  lastChecked: string;
}

interface HealthData {
  metrics: HealthMetric[];
  uptime: number;
  lastUpdate: string;
}

export default function SystemHealthPage() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/health');
        if (res.ok) {
          const data = await res.json();
          setHealthData(data);
        }
      } catch (error) {
        console.error('Failed to fetch health data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="text-[#22c55e]" size={20} />;
      case 'warning':
        return <AlertTriangle className="text-[#eab308]" size={20} />;
      case 'critical':
        return <AlertTriangle className="text-[#ef4444]" size={20} />;
      default:
        return null;
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">System Health</h1>
        <p className="text-[#8888a0] mt-2">Platform status and performance metrics</p>
      </div>

      {/* Overall Status */}
      {healthData && (
        <Card className="p-6 border-2 border-[#06b6d4]/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#8888a0] text-sm font-medium">System Status</p>
              <p className="text-2xl font-bold mt-2">Operational</p>
              <p className="text-xs text-[#8888a0] mt-2">
                Uptime: {(healthData.uptime * 100).toFixed(2)}%
              </p>
            </div>
            <CheckCircle className="text-[#22c55e]" size={48} />
          </div>
        </Card>
      )}

      {/* Health Metrics Grid */}
      {healthData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {healthData.metrics.map((metric, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-[#8888a0] text-sm font-medium">{metric.name}</p>
                  <p className="text-2xl font-bold mt-2">
                    {typeof metric.value === 'number'
                      ? metric.value.toFixed(2)
                      : metric.value}
                  </p>
                  <p className="text-xs text-[#8888a0] mt-2">
                    Last checked: {new Date(metric.lastChecked).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  {getStatusIcon(metric.status)}
                  <Badge variant={getStatusColor(metric.status)} className="mt-2">
                    {metric.status}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Services Status */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Integration Services</h2>
        <div className="space-y-3">
          {[
            { name: 'QuickBooks Online', status: 'healthy' },
            { name: 'Xero', status: 'healthy' },
            { name: 'Shopify', status: 'healthy' },
            { name: 'Amazon SP-API', status: 'healthy' },
            { name: 'Etsy', status: 'healthy' },
            { name: 'WooCommerce', status: 'healthy' },
            { name: 'Walmart', status: 'warning' },
            { name: 'TikTok Shop', status: 'healthy' },
          ].map((service, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border border-[#2a2a3d] rounded-lg"
            >
              <span>{service.name}</span>
              <Badge variant={getStatusColor(service.status)}>
                {service.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Events */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Events</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3 pb-3 border-b border-[#2a2a3d]">
            <CheckCircle className="text-[#22c55e] flex-shrink-0 mt-0.5" size={16} />
            <div>
              <p>All systems operational</p>
              <p className="text-[#8888a0] text-xs mt-1">5 minutes ago</p>
            </div>
          </div>
          <div className="flex items-start gap-3 pb-3 border-b border-[#2a2a3d]">
            <AlertTriangle className="text-[#eab308] flex-shrink-0 mt-0.5" size={16} />
            <div>
              <p>Open Dental integration experiencing delays</p>
              <p className="text-[#8888a0] text-xs mt-1">32 minutes ago</p>
            </div>
          </div>
          <div className="flex items-start gap-3 pb-3">
            <CheckCircle className="text-[#22c55e] flex-shrink-0 mt-0.5" size={16} />
            <div>
              <p>Database optimization completed</p>
              <p className="text-[#8888a0] text-xs mt-1">2 hours ago</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
