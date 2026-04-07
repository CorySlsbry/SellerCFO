'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plug, ArrowRight, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

interface UserData {
  email?: string;
}

interface OrgData {
  name?: string;
  stripe_plan?: string;
}

export default function SettingsPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [loading, setLoading] = useState(true);
  const [managingBilling, setManagingBilling] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setUserData({ email: user.email });

          const { data: profile } = await supabase
            .from('profiles')
            .select('*, organizations(*)')
            .eq('id', user.id)
            .single();

          if (profile?.organizations) {
            setOrgData(profile.organizations);
          }
        }
      } catch (err) {
        console.error('Failed to fetch user/org data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleManageBilling = async () => {
    setManagingBilling(true);
    setBillingError(null);

    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (res.ok && data.data?.url) {
        window.location.href = data.data.url;
      } else {
        setBillingError(data.error || 'Unable to open billing portal. Please try again.');
        setManagingBilling(false);
      }
    } catch {
      setBillingError('Unable to open billing portal. Please try again.');
      setManagingBilling(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    setCancelMessage(null);

    try {
      const res = await fetch('/api/stripe/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (res.ok) {
        setCancelMessage('Your subscription has been cancelled. You will retain access until the end of your current billing period.');
        setShowCancelConfirm(false);
      } else {
        setCancelMessage(data.error || 'Failed to cancel subscription. Please try again.');
      }
    } catch {
      setCancelMessage('Failed to cancel subscription. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (res.ok) {
        window.location.href = '/';
      } else {
        setDeleteError(data.error || 'Failed to delete account. Please contact support.');
        setDeleting(false);
      }
    } catch {
      setDeleteError('Failed to delete account. Please contact support.');
      setDeleting(false);
    }
  };

  const companyName = orgData?.name || 'Not set';
  const email = userData?.email || '—';
  const plan = orgData?.stripe_plan || 'Free';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Settings</h1>
        <p className="text-[#8888a0]">Manage your account and preferences</p>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Account Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[#1a1a26] rounded-lg">
            <div>
              <p className="text-sm font-medium text-[#e8e8f0]">Company Name</p>
              <p className="text-[#8888a0]">{loading ? 'Loading...' : companyName}</p>
            </div>
            <Button variant="secondary" size="sm" disabled={loading}>Edit</Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-[#1a1a26] rounded-lg">
            <div>
              <p className="text-sm font-medium text-[#e8e8f0]">Email</p>
              <p className="text-[#8888a0]">{loading ? 'Loading...' : email}</p>
            </div>
            <Button variant="secondary" size="sm" disabled={loading}>Edit</Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-[#1a1a26] rounded-lg">
            <div>
              <p className="text-sm font-medium text-[#e8e8f0]">Plan</p>
              <p className="text-[#8888a0]">{loading ? 'Loading...' : plan}</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleManageBilling}
              disabled={managingBilling || loading}
            >
              {managingBilling ? 'Opening...' : 'Manage Billing'}
            </Button>
          </div>
          {billingError && (
            <div className="bg-red-900/20 border border-red-700/50 rounded px-4 py-2 text-sm text-red-400">
              {billingError}
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Subscription</h2>

        {cancelMessage && (
          <div className={`rounded px-4 py-3 text-sm mb-4 ${
            cancelMessage.includes('cancelled')
              ? 'bg-green-900/20 border border-green-700/50 text-green-400'
              : 'bg-red-900/20 border border-red-700/50 text-red-400'
          }`}>
            {cancelMessage}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[#1a1a26] rounded-lg">
            <div>
              <p className="text-sm font-medium text-[#e8e8f0]">Cancel Subscription</p>
              <p className="text-xs text-[#8888a0]">You&apos;ll keep access until the end of your current billing period</p>
            </div>
            {!showCancelConfirm ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowCancelConfirm(true)}
                className="text-red-400 hover:text-red-300"
              >
                Cancel Plan
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={cancelling}
                >
                  Keep Plan
                </Button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition"
                >
                  {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Integrations</h2>
          <Link href="/dashboard/integrations">
            <Button variant="primary" size="sm" className="flex items-center gap-2">
              <Plug size={16} />
              Manage Integrations
              <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-[#1a1a26] rounded-lg">
            <div>
              <p className="text-sm font-medium text-[#e8e8f0]">QuickBooks Online</p>
              <p className="text-xs text-[#22c55e]">Connected</p>
            </div>
            <span className="text-xs text-[#8888a0]">Accounting</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-[#1a1a26] rounded-lg">
            <div>
              <p className="text-sm font-medium text-[#e8e8f0]">Shopify, Amazon, Etsy, WooCommerce, Walmart, TikTok Shop</p>
              <p className="text-xs text-[#8888a0]">Sales Channels</p>
            </div>
            <Link href="/dashboard/integrations">
              <span className="text-xs text-cyan-400 hover:text-cyan-300 cursor-pointer">Connect &rarr;</span>
            </Link>
          </div>
          <div className="flex items-center justify-between p-4 bg-[#1a1a26] rounded-lg">
            <div>
              <p className="text-sm font-medium text-[#e8e8f0]">Xero</p>
              <p className="text-xs text-[#8888a0]">Accounting</p>
            </div>
            <Link href="/dashboard/integrations">
              <span className="text-xs text-cyan-400 hover:text-cyan-300 cursor-pointer">Connect &rarr;</span>
            </Link>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Notifications</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 hover:bg-[#1a1a26] rounded-lg cursor-pointer transition-colors">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
            <span className="text-sm text-[#e8e8f0]">Daily cash position summary</span>
          </label>
          <label className="flex items-center gap-3 p-3 hover:bg-[#1a1a26] rounded-lg cursor-pointer transition-colors">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
            <span className="text-sm text-[#e8e8f0]">Invoice payment reminders</span>
          </label>
          <label className="flex items-center gap-3 p-3 hover:bg-[#1a1a26] rounded-lg cursor-pointer transition-colors">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
            <span className="text-sm text-[#e8e8f0]">Inventory reorder alerts</span>
          </label>
          <label className="flex items-center gap-3 p-3 hover:bg-[#1a1a26] rounded-lg cursor-pointer transition-colors">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
            <span className="text-sm text-[#e8e8f0]">Integration sync failure alerts</span>
          </label>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Data Sync</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[#1a1a26] rounded-lg">
            <div>
              <p className="text-sm font-medium text-[#e8e8f0]">Auto-sync frequency</p>
              <p className="text-xs text-[#8888a0]">Automatically pull data from all connected sources</p>
            </div>
            <select className="bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg px-3 py-1.5 text-sm text-[#e8e8f0]">
              <option>Every hour</option>
              <option>Every 4 hours</option>
              <option>Every 12 hours</option>
              <option>Daily</option>
              <option>Manual only</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="p-6 border-red-900/30">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={18} className="text-red-400" />
          <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
        </div>

        {deleteError && (
          <div className="bg-red-900/20 border border-red-700/50 rounded px-4 py-2 text-sm text-red-400 mb-4">
            {deleteError}
          </div>
        )}

        <div className="flex items-center justify-between p-4 bg-red-900/10 border border-red-900/30 rounded-lg">
          <div>
            <p className="text-sm font-medium text-[#e8e8f0]">Delete Account</p>
            <p className="text-xs text-[#8888a0]">Permanently delete your account, all data, and cancel your subscription immediately. This cannot be undone.</p>
          </div>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-red-600 text-red-400 hover:bg-red-600 hover:text-white transition whitespace-nowrap"
            >
              Delete Account
            </button>
          ) : (
            <div className="flex flex-col items-end gap-2 min-w-[200px]">
              <p className="text-xs text-red-400">Type DELETE to confirm:</p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-1.5 text-sm rounded-lg bg-[#0a0a0f] border border-red-900/50 text-[#e8e8f0] placeholder-[#8888a0] focus:outline-none focus:border-red-500"
              />
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteConfirmText !== 'DELETE'}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {deleting ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
