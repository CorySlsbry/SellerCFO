'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plug, ChevronRight, Check, ArrowRight, Loader2 } from 'lucide-react';

const FIELD_TOOLS = [
  { id: 'athenahealth', name: 'athenahealth', desc: 'EHR / Practice Management' },
  { id: 'nextgen', name: 'NextGen Healthcare', desc: 'EHR / Practice Management' },
  { id: 'opendental', name: 'Open Dental', desc: 'Dental Practice Management' },
  { id: 'kareo', name: 'Kareo (Tebra)', desc: 'Practice Management / Billing' },
  { id: 'hubspot', name: 'HubSpot', desc: 'CRM' },
  { id: 'salesforce', name: 'Salesforce', desc: 'CRM' },
];

interface OnboardingWizardProps {
  orgName?: string;
}

export function OnboardingWizard({ orgName }: OnboardingWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);

  const toggleTool = (id: string) => {
    setSelectedTools(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleStartSync = () => {
    setSyncing(true);
    setStep(3);
    // Redirect to dashboard after short delay — real sync happens in background
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="font-bold text-2xl tracking-tight mb-1">
            <span className="text-[#06b6d4]">Medical</span>
            <span className="text-[#e8e8f0]">CFO</span>
          </div>
          {orgName && (
            <p className="text-sm text-[#8888a0]">Welcome, {orgName}</p>
          )}
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  step >= s
                    ? 'bg-[#06b6d4] text-white'
                    : 'bg-[#1e1e2e] text-[#8888a0]'
                }`}
              >
                {step > s ? <Check size={14} /> : s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-0.5 ${step > s ? 'bg-[#06b6d4]' : 'bg-[#1e1e2e]'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Connect QuickBooks */}
        {step === 1 && (
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[#06b6d4]/10 flex items-center justify-center mx-auto mb-5">
              <Plug size={28} className="text-[#06b6d4]" />
            </div>
            <h2 className="text-xl font-bold text-[#e8e8f0] mb-2">
              Let&apos;s Connect Your QuickBooks
            </h2>
            <p className="text-sm text-[#8888a0] mb-6 max-w-sm mx-auto">
              This is read-only — we never touch your books. Your dashboard starts
              populating the moment you connect. Takes about 2 minutes.
            </p>

            <Link
              href="/dashboard/integrations"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white bg-[#06b6d4] hover:bg-[#0891b2] transition text-base"
            >
              Connect QuickBooks <ChevronRight size={18} />
            </Link>

            <button
              onClick={() => setStep(2)}
              className="block mx-auto mt-4 text-sm text-[#8888a0] hover:text-[#e8e8f0] transition"
            >
              I&apos;ll do this later — skip for now
            </button>
          </div>
        )}

        {/* Step 2: Field tools */}
        {step === 2 && (
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-8">
            <h2 className="text-xl font-bold text-[#e8e8f0] mb-2 text-center">
              What Field Tools Do You Use?
            </h2>
            <p className="text-sm text-[#8888a0] mb-6 text-center">
              Select any that apply. You can connect them later too.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {FIELD_TOOLS.map((tool) => {
                const selected = selectedTools.includes(tool.id);
                return (
                  <button
                    key={tool.id}
                    onClick={() => toggleTool(tool.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selected
                        ? 'border-[#06b6d4] bg-[#06b6d4]/10'
                        : 'border-[#2a2a3d] bg-[#0a0a0f] hover:border-[#3a3a4d]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#e8e8f0]">{tool.name}</span>
                      {selected && <Check size={14} className="text-[#06b6d4]" />}
                    </div>
                    <span className="text-xs text-[#8888a0]">{tool.desc}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleStartSync}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white bg-[#06b6d4] hover:bg-[#0891b2] transition"
            >
              Continue to Dashboard <ArrowRight size={18} />
            </button>

            <button
              onClick={() => setStep(1)}
              className="block mx-auto mt-3 text-sm text-[#8888a0] hover:text-[#e8e8f0] transition"
            >
              &larr; Back
            </button>
          </div>
        )}

        {/* Step 3: Loading / syncing */}
        {step === 3 && (
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-8 text-center">
            <Loader2 size={36} className="text-[#06b6d4] animate-spin mx-auto mb-5" />
            <h2 className="text-xl font-bold text-[#e8e8f0] mb-2">
              Setting Up Your Dashboard
            </h2>
            <p className="text-sm text-[#8888a0] mb-4">
              Preparing your financial overview. This only takes a moment...
            </p>
            <div className="space-y-2">
              {['Creating your workspace', 'Configuring integrations', 'Building your dashboard'].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 justify-center">
                  {syncing && idx < 2 ? (
                    <Check size={14} className="text-[#22c55e]" />
                  ) : (
                    <Loader2 size={14} className="text-[#06b6d4] animate-spin" />
                  )}
                  <span className="text-sm text-[#b0b0c8]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom note */}
        {step !== 3 && (
          <p className="text-center text-xs text-[#555] mt-6">
            Need help? Email{' '}
            <a href="mailto:support@medicalcfo.com" className="text-[#06b6d4] hover:text-[#22d3ee]">
              support@medicalcfo.com
            </a>{' '}
            — we&apos;ll set it up for you.
          </p>
        )}
      </div>
    </div>
  );
}
