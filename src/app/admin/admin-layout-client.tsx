'use client';

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  Activity,
  Settings,
  Menu,
  X,
  ArrowLeft,
  LogOut,
  BarChart3,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
}

const navItems: NavItem[] = [
  { label: 'Platform Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Subscribers', href: '/admin/subscribers', icon: Users },
  { label: 'Site Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Error Log', href: '/admin/errors', icon: AlertTriangle },
  { label: 'System Health', href: '/admin/health', icon: Activity },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayoutClient({
  children,
}: {
  children: ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin' || pathname === '/admin/';
    }
    return pathname?.startsWith(href);
  };

  const sidebarContent = (
    <>
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
                    ? 'bg-[#ef4444] text-white shadow-lg shadow-[#ef4444]/20'
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

      {/* Back to Dashboard & Logout */}
      <div className="border-t border-[#2a2a3d] p-3 space-y-2">
        <Link href="/dashboard">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#8888a0] hover:text-[#e8e8f0] hover:bg-[#2a2a3d] transition-all duration-200">
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#8888a0] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all duration-200"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="bg-[#0a0a0f] text-[#e8e8f0] min-h-screen flex">
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[#12121a] border-b border-[#2a2a3d] flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="font-bold text-lg tracking-tight">
            <span className="text-[#8b5cf6]">Seller</span><span className="text-[#e8e8f0]">CFO</span>
          </div>
          <span className="px-2 py-1 bg-[#ef4444] text-white text-xs font-bold rounded">
            ADMIN
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-[#8888a0] hover:text-[#e8e8f0] p-1"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-[#12121a] border-r border-[#2a2a3d] transform transition-transform duration-300 ease-in-out flex flex-col ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Sidebar Header */}
        <div className="h-14 border-b border-[#2a2a3d] flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="font-bold text-lg tracking-tight">
              <span className="text-[#8b5cf6]">Seller</span><span className="text-[#e8e8f0]">CFO</span>
            </div>
            <span className="px-2 py-1 bg-[#ef4444] text-white text-xs font-bold rounded">
              ADMIN
            </span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="text-[#8888a0] hover:text-[#e8e8f0]"
          >
            <X size={20} />
          </button>
        </div>
        {sidebarContent}
      </div>

      {/* Desktop Sidebar */}
      <div
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } bg-[#12121a] border-r border-[#2a2a3d]`}
      >
        {/* Desktop Sidebar Header */}
        <div className="h-16 border-b border-[#2a2a3d] flex items-center justify-between px-4">
          {sidebarCollapsed ? (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="w-10 h-10 rounded-lg bg-[#ef4444] flex items-center justify-center font-bold text-sm text-white hover:bg-[#dc2626] transition-colors"
            >
              A
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="font-bold text-lg tracking-tight">
                  <span className="text-[#8b5cf6]">Seller</span><span className="text-[#e8e8f0]">CFO</span>
                </div>
                <span className="px-2 py-1 bg-[#ef4444] text-white text-xs font-bold rounded">
                  ADMIN
                </span>
              </div>
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="text-[#8888a0] hover:text-[#e8e8f0]"
              >
                <Menu size={18} />
              </button>
            </>
          )}
        </div>

        {/* Desktop Nav */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <button
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-[#ef4444] text-white shadow-lg shadow-[#ef4444]/20'
                      : 'text-[#8888a0] hover:text-[#e8e8f0] hover:bg-[#2a2a3d]'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                >
                  <Icon size={20} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              </Link>
            );
          })}
        </nav>

        {/* Desktop Bottom */}
        <div className="border-t border-[#2a2a3d] p-3 space-y-2">
          <Link href="/dashboard">
            <button
              title={sidebarCollapsed ? 'Back to Dashboard' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#8888a0] hover:text-[#e8e8f0] hover:bg-[#2a2a3d] transition-all duration-200 ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <ArrowLeft size={20} />
              {!sidebarCollapsed && <span>Back to Dashboard</span>}
            </button>
          </Link>
          <button
            onClick={handleLogout}
            title={sidebarCollapsed ? 'Sign Out' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#8888a0] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all duration-200 ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={20} />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 overflow-auto transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <div className="p-6 lg:p-8 pt-20 lg:pt-8">
          {children}
        </div>
      </div>
    </div>
  );
}
