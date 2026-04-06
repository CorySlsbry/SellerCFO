'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';
import { Check } from 'lucide-react';
import { PLAN_FEATURES } from '@/lib/plan-features';

const plans = [
  {
    key: 'basic',
    name: PLAN_FEATURES.basic.name,
    price: PLAN_FEATURES.basic.price,
    audience: 'Solo & small practices (1-3 providers)',
    features: ['Financial dashboard', 'Collections & A/R tracking', 'Cash flow forecasting', 'QuickBooks & EHR sync', 'AI Financial Advisor — unlimited', 'Monthly AI financial brief'],
  },
  {
    key: 'pro',
    name: PLAN_FEATURES.pro.name,
    price: PLAN_FEATURES.pro.price,
    popular: true,
    audience: 'Growing companies ($1M–$10M)',
    features: ['Everything in Starter', 'athenahealth + NextGen + Stripe', 'Provider productivity tracking', 'Weekly AI financial brief', 'Payer mix analysis', 'Priority support'],
  },
  {
    key: 'enterprise',
    name: PLAN_FEATURES.enterprise.name,
    price: PLAN_FEATURES.enterprise.price,
    audience: '$10M+ with multiple PMs',
    features: ['Everything in Professional', 'NextGen + Salesforce + Open Dental', 'AI Toolkit — all 24 + custom', 'Quarterly strategy call', 'Dedicated account manager', 'Medical Chart of Accounts'],
  },
];

function SignupContent() {
  const searchParams = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Read plan from URL params (from landing page links)
  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (planParam && ['basic', 'pro', 'enterprise'].includes(planParam)) {
      setSelectedPlan(planParam);
    }
  }, [searchParams]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Step 1: Create account
      setLoadingStep('Creating your account...');
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, companyName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Signup failed');
        setLoading(false);
        setLoadingStep('');
        return;
      }

      // Step 2: Sign in
      setLoadingStep('Signing you in...');
      const supabase = createBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError('Account created but sign-in failed: ' + signInError.message);
        setLoading(false);
        setLoadingStep('');
        return;
      }

      // Step 3: Create Stripe checkout session with 14-day trial
      setLoadingStep('Setting up your free trial...');
      const checkoutRes = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan }),
      });

      const checkoutData = await checkoutRes.json();

      if (checkoutRes.ok && checkoutData.data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = checkoutData.data.url;
      } else {
        // Checkout failed — show the actual error
        console.error('Checkout creation failed:', checkoutRes.status, checkoutData);
        const serverError = checkoutData?.error || 'Unknown error';
        setError(`Billing setup failed: ${serverError}. Please sign in and set up billing in Settings.`);
        setLoading(false);
        setLoadingStep('');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
      setLoadingStep('');
    }
  };

  const selectedPlanData = plans.find(p => p.key === selectedPlan);

  return (
    <div className="w-full max-w-2xl">
      <div className="bg-[#12121a] rounded-lg border border-[#1e1e2e] p-8 shadow-2xl">
        {/* Branding */}
        <div className="mb-6 text-center">
          <h1 className="font-bold text-2xl tracking-tight mb-1">
            <span className="text-[#06b6d4]">Medical</span><span className="text-[#e8e8f0]">CFO</span>
          </h1>
          <p className="text-sm text-[#8888a0] mb-3">
            Financial Dashboard for Healthcare
          </p>
          <h2 className="text-lg font-semibold text-[#e8e8f0]">
            Start Your 14-Day Free Trial
          </h2>
          <p className="text-sm text-[#b0b0c8] mt-1">
            No charge for 14 days. Card required — cancel anytime.
          </p>
        </div>

        {/* Plan Selector */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {plans.map((plan) => (
            <button
              key={plan.key}
              type="button"
              onClick={() => setSelectedPlan(plan.key)}
              className={`relative p-3 rounded-lg border text-left transition-all ${
                selectedPlan === plan.key
                  ? 'border-[#06b6d4] bg-[#06b6d4]/10'
                  : 'border-[#2a2a3d] bg-[#0a0a0f] hover:border-[#3a3a4d]'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-2 left-3 bg-[#06b6d4] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                  POPULAR
                </div>
              )}
              <div className="text-sm font-semibold text-[#e8e8f0]">{plan.name}</div>
              <div className="text-[9px] text-[#8888a0] mt-0.5">{plan.audience}</div>
              <div className="mt-1">
                <span className="text-lg font-bold text-[#e8e8f0]">${plan.price}</span>
                <span className="text-xs text-[#8888a0]">/mo</span>
              </div>
            </button>
          ))}
        </div>

        {/* Selected Plan Features */}
        {selectedPlanData && (
          <div className="bg-[#0a0a0f] border border-[#2a2a3d] rounded-lg p-3 mb-6">
            <div className="grid grid-cols-2 gap-2">
              {selectedPlanData.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Check size={14} className="text-[#06b6d4] flex-shrink-0" />
                  <span className="text-xs text-[#b0b0c8]">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-[#e8e8f0] mb-1.5">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
                className="w-full px-4 py-2 rounded bg-[#0a0a0f] border border-[#1e1e2e] text-[#e8e8f0] placeholder-[#8888a0] focus:outline-none focus:border-[#06b6d4] transition"
              />
            </div>

            {/* Company Name */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-[#e8e8f0] mb-1.5">
                Company Name
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your Company"
                required
                className="w-full px-4 py-2 rounded bg-[#0a0a0f] border border-[#1e1e2e] text-[#e8e8f0] placeholder-[#8888a0] focus:outline-none focus:border-[#06b6d4] transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#e8e8f0] mb-1.5">
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

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#e8e8f0] mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-2 rounded bg-[#0a0a0f] border border-[#1e1e2e] text-[#e8e8f0] placeholder-[#8888a0] focus:outline-none focus:border-[#06b6d4] transition"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-900/20 border border-red-700/50 rounded px-4 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 rounded-lg font-semibold text-white bg-[#06b6d4] hover:bg-[#0891b2] disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? loadingStep || 'Processing...' : `Start Free Trial — ${selectedPlanData?.name} Plan`}
          </button>

          <p className="text-center text-xs text-[#8888a0]">
            You won&apos;t be charged during your 14-day trial. Cancel anytime.
          </p>
        </form>

        {/* Links */}
        <div className="mt-5 text-center text-sm">
          <span className="text-[#8888a0]">Already have an account? </span>
          <Link
            href="/login"
            className="text-[#06b6d4] hover:text-[#22d3ee] font-medium transition"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-2xl">
        <div className="bg-[#12121a] rounded-lg border border-[#1e1e2e] p-8 shadow-2xl text-center">
          <div className="text-[#8888a0]">Loading...</div>
        </div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}
