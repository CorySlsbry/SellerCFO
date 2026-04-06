'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createBrowserClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      window.location.href = '/dashboard';
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-[#12121a] rounded-lg border border-[#1e1e2e] p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="font-bold text-2xl tracking-tight mb-1">
            <span className="text-[#06b6d4]">Medical</span><span className="text-[#e8e8f0]">CFO</span>
          </h1>
          <p className="text-sm text-[#8888a0]">
            Financial Dashboard for Healthcare Practices
          </p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#e8e8f0] mb-2">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@practice.com" required
              className="w-full px-4 py-2 rounded bg-[#0a0a0f] border border-[#1e1e2e] text-[#e8e8f0] placeholder-[#8888a0] focus:outline-none focus:border-[#06b6d4] transition" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#e8e8f0] mb-2">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required
              className="w-full px-4 py-2 rounded bg-[#0a0a0f] border border-[#1e1e2e] text-[#e8e8f0] placeholder-[#8888a0] focus:outline-none focus:border-[#06b6d4] transition" />
          </div>
          {error && (
            <div className="bg-red-900/20 border border-red-700/50 rounded px-4 py-2 text-sm text-red-400">{error}</div>
          )}
          <button type="submit" disabled={loading}
            className="w-full px-4 py-2 rounded font-semibold text-white bg-[#06b6d4] hover:bg-[#0891b2] disabled:opacity-50 disabled:cursor-not-allowed transition">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 space-y-3 text-center">
          <div className="text-sm">
            <span className="text-[#8888a0]">Don’t have an account? </span>
            <Link href="/signup" className="text-[#06b6d4] hover:text-[#22d3ee] font-medium transition">
              Start your free trial
            </Link>
          </div>
          <div>
            <Link href="/forgot-password" className="text-sm text-[#8888a0] hover:text-[#e8e8f0] transition">
              Forgot password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
