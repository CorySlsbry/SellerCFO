'use client';

import { Inter } from 'next/font/google';
import { useState, useEffect, useCallback, ReactNode } from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  TrendingUp,
  FileText,
  BarChart3,
  Settings,
  Menu,
  X,
  Bell,
  RefreshCw,
  Plug,
  LogOut,
  Brain,
  MapPin,
  Bug,
} from 'lucide-react';
import LocationSelector from '@/components/location-selector';
import SupportChat from '@/components/support-chat';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'] });

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
}

const navItems: NavItem[] = [
  { label: "Performance Hub", icon: "LayoutDashboard", path: "/dashboard" },
  { label: "P&L Center", icon: "DollarSign", path: "/dashboard/pnl" },
  { label: "Inventory HQ", icon: "Package", path: "/dashboard/inventory" },
  { label: "Channel Analytics", icon: "ShoppingCart", path: "/dashboard/channels" },
  { label: "Cash Flow", icon: "TrendingUp", path: "/dashboard/cashflow" },
  { label: "AI Insights", icon: "Sparkles", path: "/dashboard/insights" },
  { label: "Integrations", icon: "Plug", path: "/dashboard/integrations" },
  { label: "Settings", icon: "Settings", path: "/dashboard/settings" }
];

export default function DashboardLayoutClient({
  children,
}: {
  children: ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    fullName: string;
    companyName: string;
    initials: string;
  }>({ fullName: '', companyName: '', initials: '?' });
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [clients, setClients] = useState<Array<{ id: string; name: string; qbo_realm_id: string | null }>>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [locations, setLocations] = useState<Array<{ id: string; name: string; city: string | null; state: string | null }>>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [bugModalOpen, setBugModalOpen] = useState(false);
  const [bugMessage, setBugMessage] = useState('');
  const [bugSubmitting, setBugSubmitting] = useState(false);
  const [bugSuccess, setBugSuccess] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const selectedLocation = locations.find(l => l.id === selectedLocationId);

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  };

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const body = selectedClientId ? JSON.stringify({ clientCompanyId: selectedClientId }) : undefined;
      const res = await fetch('/api/qbo/sync', {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body,
      });
      if (res.ok) {
        setLastSyncTime(new Date().toISOString());
        window.location.reload();
      }
    } catch (e) {
      console.error('Sync failed:', e);
    } finally {
      setSyncing(false);
    }
  }, [selectedClientId]);

  const handleClientSwitch = useCallback((clientId: string) => {
    setSelectedClientId(clientId);
    setClientDropdownOpen(false);
    setLastSyncTime(null);
    // Store selection so dashboard-content can read it
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem?.('selectedClientId', clientId);
      // Dispatch event so dashboard-content can react
      window.dispatchEvent(new CustomEvent('clientChanged', { detail: { clientId } }));
    }
  }, []);

  const handleLocationSwitch = useCallback((locationId: string) => {
    setSelectedLocationId(locationId);
    setLocationDropdownOpen(false);
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem?.('selectedLocationId', locationId);
      window.dispatchEvent(new CustomEvent('locationChanged', { detail: { locationId } }));
    }
  }, []);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, organizations(name)')
        .eq('id', user.id)
        .single();
      if (profile) {
        const name = (profile as any).full_name || user.user_metadata?.full_name || user.email || '';
        const org = (profile as any).organizations?.name || user.user_metadata?.company_name || '';
        setUserProfile({
          fullName: name,
          companyName: org,
          initials: getInitials(name),
        });
      }
    };
    fetchProfile();

    // Load customer companies
    const fetchClients = async () => {
      try {
        const res = await fetch('/api/clients');
        const json = await res.json();
        if (json.success && json.data?.length > 0) {
          setClients(json.data);
          // Restore previous selection or default to first
          const stored = typeof window !== 'undefined' ? window.localStorage?.getItem?.('selectedClientId') : null;
          const validStored = stored && json.data.some((c: any) => c.id === stored);
          const defaultId = validStored ? stored : json.data[0].id;
          setSelectedClientId(defaultId);
        }
      } catch (e) {
        console.error('Failed to fetch clients:', e);
      }
    };
    fetchClients();

    // Load locations
    const fetchLocations = async () => {
      try {
        const res = await fetch('/api/locations');
        const json = await res.json();
        if (json.success && json.data?.length > 0) {
          setLocations(json.data);
          const stored = typeof window !== 'undefined' ? window.localStorage?.getItem?.('selectedLocationId') : null;
          const valid = stored && json.data.some((l: any) => l.id === stored);
          if (valid) setSelectedLocationId(stored);
        }
      } catch (e) {
        console.error('Failed to fetch locations:', e);
      }
    };
    fetchLocations();

    // Load last sync time from latest snapshot
    const fetchLastSync = async () => {
      const { data } = await supabase
        .from('dashboard_snapshots')
        .select('pulled_at')
        .order('pulled_at', { ascending: false })
        .limit(1)
        .single();
      if (data?.pulled_at) {
        setLastSyncTime(data.pulled_at);
      }
    };
    fetchLastSync();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleBugSubmit = async () => {
    if (!bugMessage.trim()) return;
    setBugSubmitting(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: bugMessage.trim(),
          userName: userProfile.fullName,
          companyName: userProfile.companyName,
        }),
      });
      setBugSuccess(true);
      setBugMessage('');
      setTimeout(() => {
        setBugModalOpen(false);
        setBugSuccess(false);
      }, 2000);
    } catch (e) {
      console.error('Failed to submit bug report:', e);
    } finally {
      setBugSubmitting(false);
    }
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/dashboard/';
    }
    return pathname?.startsWith(href);
  };

  const sidebarOpen = !sidebarCollapsed;

  return (
    <div style={inter.style} className="bg-[#0a0a0f] text-[#e8e8f0] min-h-screen flex">
      {/* Desktop Sidebar — hidden on mobile */}
      <div
        className={`hidden lg:flex fixed inset-y-0 left-0 z-40 transition-all duration-300 flex-col ${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-[#12121a] border-r border-[#2a2a3d]`}
      >
        {/* Logo */}
        <div className="h-16 border-b border-[#2a2a3d] flex items-center justify-center px-4 cursor-pointer"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarOpen ? (
            <div className="font-bold text-lg tracking-tight">
              <span className="text-[#06b6d4]">Medical</span><span className="text-[#e8e8f0]">CFO</span>
              <div className="text-[10px] text-[#8888a0] font-normal">Financial Dashboard for Healthcare</div>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-[#06b6d4] flex items-center justify-center font-bold text-sm">
              MC
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-[#06b6d4] text-white shadow-lg shadow-[#06b6d4]/20'
                      : 'text-[#8888a0] hover:text-[#e8e8f0] hover:bg-[#2a2a3d]'
                  }`}
                >
                  <Icon size={20} />
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              </Link>
            );
          })}
        </nav>

        {/* Location Selector */}
        <div className="border-t border-[#2a2a3d] pt-3">
          {sidebarOpen ? (
            <>
              <div className="px-3 pb-1">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#8888a0]">
                  Location Filter
                </span>
              </div>
              <LocationSelector collapsed={false} />
            </>
          ) : (
            <LocationSelector collapsed={true} />
          )}
        </div>

        {/* User Profile & Logout */}
        <div className="border-t border-[#2a2a3d] p-3 space-y-2">
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
              sidebarOpen ? 'bg-[#1a1a26]' : ''
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-[#06b6d4] flex items-center justify-center font-semibold text-sm flex-shrink-0">
              {userProfile.initials}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{userProfile.fullName || 'Loading...'}</div>
                <div className="text-xs text-[#8888a0] truncate">
                  {userProfile.companyName}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setBugModalOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#8888a0] hover:text-[#f59e0b] hover:bg-[#f59e0b]/10 transition-all duration-200"
          >
            <Bug size={20} />
            {sidebarOpen && <span>Report a Bug</span>}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#8888a0] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all duration-200"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Over Menu */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 z-50 bg-[#12121a] border-r border-[#2a2a3d] flex flex-col lg:hidden animate-in slide-in-from-left duration-200">
            {/* Mobile Header */}
            <div className="h-16 border-b border-[#2a2a3d] flex items-center justify-between px-4">
              <div className="font-bold text-lg tracking-tight">
                <span className="text-[#06b6d4]">Medical</span><span className="text-[#e8e8f0]">CFO</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-[#2a2a3d] rounded-lg text-[#8888a0]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mobile Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href}>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        active
                          ? 'bg-[#06b6d4] text-white shadow-lg shadow-[#06b6d4]/20'
                          : 'text-[#8888a0] hover:text-[#e8e8f0] hover:bg-[#2a2a3d]'
                      }`}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </button>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile User Profile & Logout */}
            <div className="border-t border-[#2a2a3d] p-3 space-y-2">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#1a1a26]">
                <div className="w-10 h-10 rounded-full bg-[#06b6d4] flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  {userProfile.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{userProfile.fullName || 'Loading...'}</div>
                  <div className="text-xs text-[#8888a0] truncate">{userProfile.companyName}</div>
                </div>
              </div>
              <button
                onClick={() => { setMobileMenuOpen(false); setBugModalOpen(true); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#8888a0] hover:text-[#f59e0b] hover:bg-[#f59e0b]/10 transition-all duration-200"
              >
                <Bug size={20} />
                <span>Report a Bug</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#8888a0] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all duration-200"
              >
                <LogOut size={20} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col w-full transition-all duration-300 ${
        sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
      }`}>
        {/* Top Bar */}
        <div className="h-14 sm:h-16 border-b border-[#2a2a3d] bg-[#12121a] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3 sm:gap-4 flex-1">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 hover:bg-[#2a2a3d] rounded-lg text-[#8888a0] hover:text-[#e8e8f0] transition"
            >
              <Menu size={22} />
            </button>
            <h1 className="text-lg sm:text-xl font-bold">Dashboard</h1>
            {/* customer Selector */}
            {clients.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a26] border border-[#2a2a3d] rounded-lg text-sm hover:border-[#06b6d4] transition-colors"
                >
                  <span className="text-[#e8e8f0] max-w-[160px] truncate">{selectedClient?.name || 'Select customer'}</span>
                  <svg className={`w-4 h-4 text-[#8888a0] transition-transform ${clientDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {clientDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-[#1a1a26] border border-[#2a2a3d] rounded-lg shadow-xl z-50 py-1 max-h-64 overflow-y-auto">
                    {clients.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => handleClientSwitch(customer.id)}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          customer.id === selectedClientId
                            ? 'bg-[#06b6d4]/20 text-[#06b6d4]'
                            : 'text-[#e8e8f0] hover:bg-[#2a2a3d]'
                        }`}
                      >
                        <div className="font-medium truncate">{customer.name}</div>
                        {customer.qbo_realm_id && (
                          <div className="text-xs text-[#8888a0] mt-0.5">QBO Connected</div>
                        )}
                      </button>
                    ))}
                    <div className="border-t border-[#2a2a3d] mt-1 pt-1">
                      <button
                        onClick={() => {
                          setClientDropdownOpen(false);
                          window.location.href = '/api/qbo/connect';
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-[#06b6d4] hover:bg-[#2a2a3d] transition-colors"
                      >
                        + Connect New QBO Company
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Location Selector */}
            {locations.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a26] border border-[#2a2a3d] rounded-lg text-sm hover:border-[#06b6d4] transition-colors"
                >
                  <MapPin size={14} className="text-[#06b6d4] flex-shrink-0" />
                  <span className="text-[#e8e8f0] max-w-[140px] truncate">
                    {selectedLocation?.name ?? 'All Locations'}
                  </span>
                  <svg className={`w-4 h-4 text-[#8888a0] transition-transform ${locationDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {locationDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-[#1a1a26] border border-[#2a2a3d] rounded-lg shadow-xl z-50 py-1 max-h-64 overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedLocationId(null);
                        setLocationDropdownOpen(false);
                        if (typeof window !== 'undefined') {
                          window.localStorage?.removeItem?.('selectedLocationId');
                          window.dispatchEvent(new CustomEvent('locationChanged', { detail: { locationId: null } }));
                        }
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        selectedLocationId === null
                          ? 'bg-[#06b6d4]/20 text-[#06b6d4]'
                          : 'text-[#e8e8f0] hover:bg-[#2a2a3d]'
                      }`}
                    >
                      All Locations
                    </button>
                    {locations.map((loc) => (
                      <button
                        key={loc.id}
                        onClick={() => handleLocationSwitch(loc.id)}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          loc.id === selectedLocationId
                            ? 'bg-[#06b6d4]/20 text-[#06b6d4]'
                            : 'text-[#e8e8f0] hover:bg-[#2a2a3d]'
                        }`}
                      >
                        <div className="font-medium truncate">{loc.name}</div>
                        {(loc.city || loc.state) && (
                          <div className="text-xs text-[#8888a0] mt-0.5">
                            {[loc.city, loc.state].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </button>
                    ))}
                    <div className="border-t border-[#2a2a3d] mt-1 pt-1">
                      <a
                        href="/dashboard/locations"
                        onClick={() => setLocationDropdownOpen(false)}
                        className="block px-4 py-2.5 text-sm text-[#06b6d4] hover:bg-[#2a2a3d] transition-colors"
                      >
                        Manage Locations
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="hidden sm:flex items-center gap-2 text-sm text-[#8888a0]">
              <span>Last synced:</span>
              <span className="text-[#22c55e]">{lastSyncTime ? formatTimeAgo(lastSyncTime) : 'never'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              onClick={handleSync}
              disabled={syncing}
            >
              <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">{syncing ? 'Syncing...' : 'Sync with QBO'}</span>
            </Button>
            <button className="p-2 hover:bg-[#2a2a3d] rounded-lg transition-colors text-[#8888a0] hover:text-[#e8e8f0]">
              <Bell size={20} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-[#0a0a0f]">
          <div className="p-3 sm:p-4 md:p-6">
            {children}
          </div>
        </div>
      </div>

      {/* Bug Report Modal */}
      {bugModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            onClick={() => { setBugModalOpen(false); setBugMessage(''); setBugSuccess(false); }}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-[#12121a] border border-[#2a2a3d] rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto">
              <div className="flex items-center justify-between p-5 border-b border-[#2a2a3d]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center">
                    <Bug size={18} className="text-[#f59e0b]" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-[#e8e8f0] text-base">Report a Bug</h2>
                    <p className="text-xs text-[#8888a0] mt-0.5">We'll look into it and follow up</p>
                  </div>
                </div>
                <button
                  onClick={() => { setBugModalOpen(false); setBugMessage(''); setBugSuccess(false); }}
                  className="p-1.5 hover:bg-[#2a2a3d] rounded-lg text-[#8888a0] hover:text-[#e8e8f0] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5">
                {bugSuccess ? (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 rounded-full bg-[#22c55e]/10 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-[#22c55e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="font-semibold text-[#e8e8f0]">Report sent!</p>
                    <p className="text-sm text-[#8888a0] mt-1">Thanks — we'll look into it shortly.</p>
                  </div>
                ) : (
                  <>
                    <label className="block text-sm font-medium text-[#c8c8e0] mb-2">
                      Describe the issue
                    </label>
                    <textarea
                      value={bugMessage}
                      onChange={(e) => setBugMessage(e.target.value)}
                      placeholder="What were you doing? What did you expect to happen? What actually happened?"
                      rows={5}
                      className="w-full bg-[#1a1a26] border border-[#2a2a3d] focus:border-[#06b6d4] rounded-xl px-3 py-2.5 text-sm text-[#e8e8f0] placeholder-[#8888a0] outline-none transition-colors resize-none"
                      autoFocus
                    />
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => { setBugModalOpen(false); setBugMessage(''); }}
                        className="flex-1 px-4 py-2.5 border border-[#2a2a3d] rounded-xl text-sm font-medium text-[#8888a0] hover:text-[#e8e8f0] hover:border-[#4a4a5d] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleBugSubmit}
                        disabled={!bugMessage.trim() || bugSubmitting}
                        className="flex-1 px-4 py-2.5 bg-[#06b6d4] hover:bg-[#22d3ee] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-white transition-colors"
                      >
                        {bugSubmitting ? 'Sending...' : 'Send Report'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* AI Support Chat Bubble */}
      <SupportChat />
    </div>
  );
}
