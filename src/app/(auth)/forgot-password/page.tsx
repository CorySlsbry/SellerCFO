'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createBrowserClient();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
        }
      );

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setEmail('');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-[#12121a] rounded-lg border border-[#1e1e2e] p-8 shadow-2xl">
        {/* Branding */}
        <div className="mb-8 text-center">
          <h1 className="font-bold text-2xl tracking-tight mb-1">
            <span className="text-[#06b6d4]">Medical</span><span className="text-[#e8e8f0]">CFO</span>
          </h1>
          <p className="text-sm text-[#8888a0] mb-2">
            Financial Dashboard for Healthcare
          </p>
          <h2 className="text-2xl font-bold text-[#e8e8f0]">
            Reset Password
          </h2>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-900/20 border border-green-700/50 rounded px-4 py-3 text-sm text-green-400 mb-6">
            <p className="font-medium mb-1">Check your email</p>
            <p>
              We've sent a password reset link to <strong>{email}</strong>.
              Click the link in the email to reset your password.
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleResetPassword} className="space-y-4">
          {!success && (
            <>
              <p className="text-sm text-[#8888a0] mb-4">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-[#e8e8f0] mb-2"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
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
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </>
          )}

          {success && (
            <button
              type="button"
              onClick={() => setSuccess(false)}
              className="w-full px-4 py-2 rounded font-semibold text-white bg-[#06b6d4] hover:bg-[#0891b2] transition"
            >
              Send Another Reset Link
            </button>
          )}
        </form>

        {/* Links */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-[#8888a0] hover:text-[#e8e8f0] transition"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
