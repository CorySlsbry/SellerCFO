'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const supabase = createBrowserClient();
  const router = useRouter();

  useEffect(() => {
    // Check if there's a valid session (token in URL)
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setTokenValid(true);
      } else {
        setError('Invalid or expired reset link. Please request a new one.');
      }
    };
    checkSession();
  }, [supabase.auth]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirm) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setPassword('');
      setPasswordConfirm('');

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (!tokenValid && !error) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-[#12121a] rounded-lg border border-[#1e1e2e] p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="font-bold text-2xl tracking-tight mb-1">
              <span className="text-[#8b5cf6]">Seller</span><span className="text-[#e8e8f0]">CFO</span>
            </h1>
            <p className="text-sm text-[#8888a0] mb-2">
              Financial Dashboard for E-commerce
            </p>
          </div>
          <p className="text-center text-[#8888a0]">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !tokenValid) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-[#12121a] rounded-lg border border-[#1e1e2e] p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="font-bold text-2xl tracking-tight mb-1">
              <span className="text-[#8b5cf6]">Seller</span><span className="text-[#e8e8f0]">CFO</span>
            </h1>
            <p className="text-sm text-[#8888a0] mb-2">
              Financial Dashboard for E-commerce
            </p>
          </div>
          <div className="bg-red-900/20 border border-red-700/50 rounded px-4 py-3 text-sm text-red-400 mb-6">
            <p className="font-medium">{error}</p>
          </div>
          <Link
            href="/forgot-password"
            className="w-full px-4 py-2 rounded font-semibold text-white bg-[#06b6d4] hover:bg-[#0891b2] transition text-center inline-block"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-[#12121a] rounded-lg border border-[#1e1e2e] p-8 shadow-2xl">
        {/* Branding */}
        <div className="mb-8 text-center">
          <h1 className="font-bold text-2xl tracking-tight mb-1">
            <span className="text-[#8b5cf6]">Seller</span><span className="text-[#e8e8f0]">CFO</span>
          </h1>
          <p className="text-sm text-[#8888a0] mb-2">
            Financial Dashboard for E-commerce
          </p>
          <h2 className="text-2xl font-bold text-[#e8e8f0]">
            Set New Password
          </h2>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-900/20 border border-green-700/50 rounded px-4 py-3 text-sm text-green-400 mb-6">
            <p className="font-medium mb-1">Password updated successfully!</p>
            <p>Redirecting to sign in...</p>
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-sm text-[#8888a0] mb-4">
              Enter your new password below.
            </p>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#e8e8f0] mb-2"
              >
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2 rounded bg-[#0a0a0f] border border-[#1e1e2e] text-[#e8e8f0] placeholder-[#8888a0] focus:outline-none focus:border-[#06b6d4] transition"
              />
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="passwordConfirm"
                className="block text-sm font-medium text-[#e8e8f0] mb-2"
              >
                Confirm Password
              </label>
              <input
                id="passwordConfirm"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2 rounded bg-[#0a0a0f] border border-[#1e1e2e] text-[#e8e8f0] placeholder-[#8888a0] focus:outline-none focus:border-[#06b6d4] transition"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/20 border border-red-700/50 rounded px-4 py-2 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 rounded font-semibold text-white bg-[#06b6d4] hover:bg-[#0891b2] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}

        {/* Links */}
        {!success && (
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-[#8888a0] hover:text-[#e8e8f0] transition"
            >
              Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
