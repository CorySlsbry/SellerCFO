'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen, ShoppingBag, Package, Globe, Store, Video, Palette,
  RefreshCw, CheckCircle, XCircle, AlertCircle, Loader2, Link2, Unlink,
  Database, Users, TrendingUp, ArrowRight, Clock, Settings, ChevronDown,
  ChevronUp, Key,
} from 'lucide-react';
import { INTEGRATION_PROVIDERS, type IntegrationProviderConfig, type IntegrationProvider, type IntegrationConnection } from '@/types/integrations';

// ============================================================
// Icon mapping
// ============================================================
const iconMap: Record<string, any> = {
  BookOpen, ShoppingBag, Package, Globe, Store, Video, Palette,
};

// ============================================================
// Integration Card Component
// ============================================================
function IntegrationCard({
  config,
  connection,
  onConnect,
  onDisconnect,
  onSync,
  syncing,
}: {
  config: IntegrationProviderConfig;
  connection?: IntegrationConnection;
  onConnect: (provider: IntegrationProvider) => void;
  onDisconnect: (provider: IntegrationProvider) => void;
  onSync: (provider: IntegrationProvider) => void;
  syncing: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [tenantId, setTenantId] = useState('');
  // Walmart-specific BYO fields (per-seller Client ID/Secret from Seller Center)
  const [walmartClientId, setWalmartClientId] = useState('');
  const [walmartClientSecret, setWalmartClientSecret] = useState('');
  const [walmartSellerId, setWalmartSellerId] = useState('');
  const [settingUp, setSettingUp] = useState(false);

  const IconComponent = iconMap[config.icon] || Globe;
  const isConnected = connection?.status === 'connected';
  const isError = connection?.status === 'error';
  const isSyncing = connection?.last_sync_status === 'syncing' || syncing;

  const handleApiKeySetup = async () => {
    setSettingUp(true);
    try {
      // Walmart uses BYO per-seller credentials (client_id + client_secret + optional seller_id)
      // — not a single api_key. Everything else sends the legacy api_key/tenant_id shape.
      const payload: Record<string, any> =
        config.id === 'walmart'
          ? {
              provider: config.id,
              client_id: walmartClientId,
              client_secret: walmartClientSecret,
              seller_id: walmartSellerId || undefined,
              account_name: config.name,
            }
          : {
              provider: config.id,
              api_key: apiKey,
              tenant_id: tenantId || undefined,
              account_name: config.name,
            };

      const response = await fetch('/api/integrations/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || 'Connection failed');
      }
    } catch {
      alert('Connection failed. Please check your credentials.');
    } finally {
      setSettingUp(false);
    }
  };

  return (
    <Card className="p-0 overflow-hidden">
      {/* Main Row */}
      <div className="flex items-center gap-4 p-5">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${config.color}20` }}
        >
          <IconComponent className="w-6 h-6" style={{ color: config.color }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-[#e8e8f0]">{config.name}</h3>
            {config.tier === 'pro' && (
              <Badge variant="info" className="text-[10px] px-1.5 py-0">PRO</Badge>
            )}
          </div>
          <p className="text-xs text-[#8888a0] mt-0.5 line-clamp-1">{config.description}</p>
          {connection?.last_sync_at && (
            <p className="text-[10px] text-[#666680] mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Last synced: {new Date(connection.last_sync_at).toLocaleString()}
            </p>
          )}
        </div>

        {/* Status Badge */}
        <div className="shrink-0">
          {isConnected ? (
            <Badge variant="success" className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Connected
            </Badge>
          ) : isError ? (
            <Badge variant="danger" className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Error
            </Badge>
          ) : (
            <Badge variant="default" className="flex items-center gap-1 opacity-60">
              <XCircle className="w-3 h-3" />
              Not Connected
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isConnected && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onSync(config.id)}
                disabled={isSyncing}
                className="text-xs"
              >
                {isSyncing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                {isSyncing ? 'Syncing...' : 'Sync'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onDisconnect(config.id)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                <Unlink className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
          {!isConnected && config.authType === 'oauth2' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onConnect(config.id)}
              className="text-xs"
            >
              <Link2 className="w-3.5 h-3.5" />
              Connect
            </Button>
          )}
          {!isConnected && (config.authType === 'api_key' || config.authType === 'oauth2_client_credentials') && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-xs"
            >
              <Key className="w-3.5 h-3.5" />
              Setup
              {expanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
            </Button>
          )}
        </div>
      </div>

      {/* Expandable API Key Setup */}
      {expanded && !isConnected && (
        <div className="border-t border-[#2a2a3a] p-5 bg-[#0e0e18]">
          <div className="space-y-3 max-w-md">
            {config.id === 'woocommerce' ? (
              <div>
                <label className="block text-xs font-medium text-[#8888a0] mb-1">
                  Store URL
                </label>
                <input
                  type="text"
                  placeholder="https://yourstore.com"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a26] border border-[#2a2a3a] rounded-lg text-sm text-[#e8e8f0] focus:outline-none focus:border-cyan-500 mb-2"
                />
                <input
                  type="password"
                  placeholder="Consumer Key / Consumer Secret"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a26] border border-[#2a2a3a] rounded-lg text-sm text-[#e8e8f0] focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[10px] text-[#666680] mt-1">
                  Find your REST API keys in WooCommerce &gt; Settings &gt; Advanced &gt; REST API
                </p>
              </div>
            ) : config.id === 'walmart' ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-[#8888a0] mb-1">
                    Walmart Client ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. a1b2c3d4-5678-..."
                    value={walmartClientId}
                    onChange={(e) => setWalmartClientId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1a1a26] border border-[#2a2a3a] rounded-lg text-sm text-[#e8e8f0] focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8888a0] mb-1">
                    Walmart Client Secret
                  </label>
                  <input
                    type="password"
                    placeholder="Paste secret (shown once in Seller Center)"
                    value={walmartClientSecret}
                    onChange={(e) => setWalmartClientSecret(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1a1a26] border border-[#2a2a3a] rounded-lg text-sm text-[#e8e8f0] focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8888a0] mb-1">
                    Walmart Seller ID <span className="text-[#555570]">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Your Walmart Seller/Partner ID"
                    value={walmartSellerId}
                    onChange={(e) => setWalmartSellerId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1a1a26] border border-[#2a2a3a] rounded-lg text-sm text-[#e8e8f0] focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <p className="text-[10px] text-[#666680] leading-relaxed">
                  Generate these in Walmart Seller Center → Settings → <strong>API Key Management</strong> → Add Key.
                  SellerCFO stores your credentials encrypted and uses them to mint short-lived access tokens on demand.
                </p>
              </>
            ) : (
              <div>
                <label className="block text-xs font-medium text-[#8888a0] mb-1">
                  API Key / Client ID
                </label>
                <input
                  type="password"
                  placeholder={`Enter your ${config.name} API key`}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a26] border border-[#2a2a3a] rounded-lg text-sm text-[#e8e8f0] focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[10px] text-[#666680] mt-1">
                  Find your API key in {config.name} settings
                </p>
              </div>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleApiKeySetup}
              disabled={
                settingUp ||
                (config.id === 'woocommerce' && (!tenantId || !apiKey)) ||
                (config.id === 'walmart' && (!walmartClientId || !walmartClientSecret)) ||
                (config.id !== 'woocommerce' && config.id !== 'walmart' && !apiKey)
              }
              className="text-xs"
            >
              {settingUp ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              {settingUp ? 'Connecting...' : 'Validate & Connect'}
            </Button>
          </div>
        </div>
      )}

      {/* Features strip */}
      <div className="border-t border-[#2a2a3a] px-5 py-2.5 flex items-center gap-2 overflow-x-auto">
        {config.features.map((feature) => (
          <span
            key={feature}
            className="text-[10px] text-[#666680] bg-[#1a1a26] px-2 py-0.5 rounded-full whitespace-nowrap"
          >
            {feature}
          </span>
        ))}
      </div>
    </Card>
  );
}

// ============================================================
// Main Integrations Page
// ============================================================
export default function IntegrationsContent() {
  const [connections, setConnections] = useState<IntegrationConnection[]>([]);
  const [syncingProviders, setSyncingProviders] = useState<Set<string>>(new Set());
  const [dataCounts, setDataCounts] = useState({ projects: 0, contacts: 0, deals: 0 });
  const [loading, setLoading] = useState(true);
  const [syncAllRunning, setSyncAllRunning] = useState(false);

  // Fetch integration status on load
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/integrations/status');
      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections || []);
        setDataCounts(data.dataCounts || { projects: 0, contacts: 0, deals: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch integration status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (provider: IntegrationProvider) => {
    // Redirect to OAuth flow
    window.location.href = `/api/integrations/connect?provider=${provider}`;
  };

  const handleDisconnect = async (provider: IntegrationProvider) => {
    if (!confirm(`Disconnect ${provider}? Synced data will be preserved.`)) return;

    try {
      const response = await fetch(`/api/integrations/status?provider=${provider}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchStatus();
      }
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  const handleSync = async (provider: IntegrationProvider) => {
    setSyncingProviders(prev => new Set(prev).add(provider));
    try {
      await fetch('/api/integrations/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      await fetchStatus();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncingProviders(prev => {
        const next = new Set(prev);
        next.delete(provider);
        return next;
      });
    }
  };

  const handleSyncAll = async () => {
    setSyncAllRunning(true);
    const connected = connections.filter(c => c.status === 'connected');
    connected.forEach(c => setSyncingProviders(prev => new Set(prev).add(c.provider)));

    try {
      await fetch('/api/integrations/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'all' }),
      });
      await fetchStatus();
    } catch (error) {
      console.error('Sync all failed:', error);
    } finally {
      setSyncAllRunning(false);
      setSyncingProviders(new Set());
    }
  };

  const connectedCount = connections.filter(c => c.status === 'connected').length;
  const getConnection = (provider: IntegrationProvider) =>
    connections.find(c => c.provider === provider);

  // Group providers by category
  const accountingProviders = INTEGRATION_PROVIDERS.filter(p => p.category === 'accounting');
  const salesChannelProviders = INTEGRATION_PROVIDERS.filter(p => p.category === 'sales_channel');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#e8e8f0] mb-1">Integrations</h1>
          <p className="text-[#8888a0]">
            Connect your sales channels and accounting tools for a unified financial view
          </p>
        </div>
        {connectedCount > 0 && (
          <Button
            variant="primary"
            onClick={handleSyncAll}
            disabled={syncAllRunning}
            className="flex items-center gap-2"
          >
            {syncAllRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {syncAllRunning ? 'Syncing All...' : 'Sync All'}
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#e8e8f0]">{connectedCount}</p>
              <p className="text-xs text-[#8888a0]">Connected</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#e8e8f0]">{dataCounts.projects}</p>
              <p className="text-xs text-[#8888a0]">Records Synced</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#e8e8f0]">{dataCounts.contacts}</p>
              <p className="text-xs text-[#8888a0]">Contacts Synced</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#e8e8f0]">{dataCounts.deals}</p>
              <p className="text-xs text-[#8888a0]">Deals Synced</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Accounting Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-[#8888a0]" />
          <h2 className="text-lg font-semibold text-[#e8e8f0]">Accounting</h2>
        </div>
        <div className="space-y-3">
          {accountingProviders.map((config) => (
            <IntegrationCard
              key={config.id}
              config={config}
              connection={getConnection(config.id)}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onSync={handleSync}
              syncing={syncingProviders.has(config.id)}
            />
          ))}
        </div>
      </div>

      {/* Sales Channels Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag className="w-5 h-5 text-[#8888a0]" />
          <h2 className="text-lg font-semibold text-[#e8e8f0]">Sales Channels</h2>
        </div>
        <div className="space-y-3">
          {salesChannelProviders.map((config) => (
            <IntegrationCard
              key={config.id}
              config={config}
              connection={getConnection(config.id)}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onSync={handleSync}
              syncing={syncingProviders.has(config.id)}
            />
          ))}
        </div>
      </div>

      {/* Footer Help */}
      <Card className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#e8e8f0] mb-1">Need help connecting?</h3>
            <p className="text-xs text-[#8888a0] leading-relaxed">
              Most integrations connect in seconds via OAuth — just click Connect and authorize.
              For WooCommerce, you&apos;ll need your store URL and REST API key from WooCommerce &gt; Settings &gt; Advanced &gt; REST API.
              For Walmart, generate a Client ID and Client Secret in your Walmart Seller Center under Settings &gt; API Key Management and paste them here.
              Once connected, data syncs automatically every hour, or you can trigger a manual sync anytime.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
