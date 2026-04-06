'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader, AlertTriangle, CheckCircle } from 'lucide-react';

interface ErrorRecord {
  id: string;
  organization_id: string;
  organization_name?: string;
  error_type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string | null;
  metadata: Record<string, any>;
  created_at: string;
  resolved: boolean;
  resolved_at?: string;
}

export default function ErrorLogPage() {
  const [errors, setErrors] = useState<ErrorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedError, setSelectedError] = useState<ErrorRecord | null>(null);

  useEffect(() => {
    const fetchErrors = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/errors?limit=1000');
        if (res.ok) {
          const data = await res.json();
          setErrors(data.errors);
        }
      } catch (error) {
        console.error('Failed to fetch errors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchErrors();
  }, []);

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

  const resolveError = async (errorId: string) => {
    try {
      const res = await fetch('/api/admin/errors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error_id: errorId, resolved: true }),
      });
      if (res.ok) {
        setErrors(errors.map(e => e.id === errorId ? { ...e, resolved: true } : e));
        setSelectedError(null);
      }
    } catch (error) {
      console.error('Failed to resolve error:', error);
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
        <h1 className="text-3xl font-bold">Error Log</h1>
        <p className="text-[#8888a0] mt-2">
          All system and integration errors ({errors.length})
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Errors List */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {errors.length > 0 ? (
                errors.map((error) => (
                  <button
                    key={error.id}
                    onClick={() => setSelectedError(error)}
                    className={`w-full p-4 rounded-lg border transition-all text-left ${
                      selectedError?.id === error.id
                        ? 'border-[#06b6d4] bg-[#06b6d4]/10'
                        : 'border-[#2a2a3d] hover:border-[#3a3a4d]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div>
                        {error.resolved ? (
                          <CheckCircle size={20} className="text-[#22c55e]" />
                        ) : (
                          <AlertTriangle size={20} className="text-[#ef4444]" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityColor(error.severity)}>
                            {error.severity}
                          </Badge>
                          <span className="text-sm text-[#8888a0]">{error.error_type}</span>
                        </div>
                        <p className="text-sm mt-1 truncate">{error.title}</p>
                        <p className="text-xs text-[#8888a0] mt-1">
                          {error.organization_name || 'Unknown'} • {new Date(error.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-8 text-center text-[#8888a0]">
                  No errors found
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Error Details */}
        <div>
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Error Details</h2>
            {selectedError ? (
              <div className="space-y-4">
                <div>
                  <p className="text-[#8888a0] text-sm font-medium">Status</p>
                  <Badge
                    variant={selectedError.resolved ? 'success' : 'danger'}
                    className="mt-2"
                  >
                    {selectedError.resolved ? 'Resolved' : 'Unresolved'}
                  </Badge>
                </div>
                <div>
                  <p className="text-[#8888a0] text-sm font-medium">Severity</p>
                  <p className="mt-2 font-semibold capitalize">{selectedError.severity}</p>
                </div>
                <div>
                  <p className="text-[#8888a0] text-sm font-medium">Type</p>
                  <p className="mt-2 text-sm">{selectedError.error_type}</p>
                </div>
                <div>
                  <p className="text-[#8888a0] text-sm font-medium">Organization</p>
                  <p className="mt-2 text-sm">{selectedError.organization_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-[#8888a0] text-sm font-medium">Created</p>
                  <p className="mt-2 text-sm">{new Date(selectedError.created_at).toLocaleString()}</p>
                </div>
                {selectedError.resolved_at && (
                  <div>
                    <p className="text-[#8888a0] text-sm font-medium">Resolved</p>
                    <p className="mt-2 text-sm">
                      {new Date(selectedError.resolved_at).toLocaleString()}
                    </p>
                  </div>
                )}
                {!selectedError.resolved && (
                  <button
                    onClick={() => resolveError(selectedError.id)}
                    className="w-full mt-4 px-4 py-2 bg-[#22c55e] hover:bg-[#22c55e]/90 text-white font-medium rounded-lg transition-all"
                  >
                    Mark as Resolved
                  </button>
                )}
              </div>
            ) : (
              <p className="text-[#8888a0] text-center py-8">Select an error to view details</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
