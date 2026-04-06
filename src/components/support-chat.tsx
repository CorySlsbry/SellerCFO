'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Mail,
  Calendar,
  ChevronDown,
  Bot,
  User,
  ArrowLeft,
  Check,
  Loader2,
} from 'lucide-react';
import { BookingCalendar } from '@/components/booking-calendar';

/* ─────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────── */

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

interface KBEntry {
  keywords: string[];
  answer: string;
}

/* ─────────────────────────────────────────────────────────────
   Knowledge Base — SellerCFO support content
   ───────────────────────────────────────────────────────────── */

const KNOWLEDGE_BASE: KBEntry[] = [
  {
    keywords: ['setup', 'start', 'begin', 'get started', 'onboard', 'first time', 'new', 'how do i use', 'how does it work', 'how to'],
    answer: `Welcome to SellerCFO! Setup takes under 5 minutes:\n\n1. **Connect QuickBooks Online** — Go to Integrations and click "Connect QBO"\n2. **Connect your EHR/PM** — We integrate with athenahealth, NextGen, Open Dental, and Kareo\n3. **Sync your data** — Hit "Sync with QBO" in the top bar\n4. **Explore your dashboard** — Revenue, collections, claims, A/R aging, and payer mix populate automatically\n\nYour QBO connection is **read-only** — SellerCFO cannot modify your accounting data. All data is encrypted (AES-256 at rest, TLS 1.3 in transit).`,
  },
  {
    keywords: ['integrate', 'integration', 'integrations', 'connect', 'tools', 'software', 'platform', 'what do you connect'],
    answer: `**SellerCFO integrates with 7+ platforms:**\n\n**Accounting:**\n- QuickBooks Online — P&L, balance sheet, invoices, bills, cash flow\n\n**EHR & Practice Management:**\n- athenahealth — Patient records, claims, scheduling, revenue cycle\n- NextGen Healthcare — Demographics, encounters, claims, financial reports\n- Open Dental — Dental claims, treatment plans, billing\n\n**CRM & Billing:**\n- Kareo (Tebra) — Patient records, claims, billing, analytics\n- Salesforce — Leads, contacts, pipeline\n- HubSpot — Contacts, deals, email tracking\n\nAll integrations sync automatically. Go to **Integrations** in the sidebar to connect.`,
  },
  {
    keywords: ['quickbooks', 'qbo', 'accounting', 'chart of accounts', 'authorize', 'oauth'],
    answer: `**QuickBooks Online Integration:**\n\n1. Go to **Integrations** in the sidebar\n2. Click **"Connect QuickBooks Online"**\n3. Sign in to QBO and authorize SellerCFO (read-only access)\n4. Click **"Sync with QBO"** in the top bar\n\nSellerCFO pulls your Chart of Accounts, invoices, bills, and transactions from QBO. We recommend using a e-commerce-specific COA for best results.\n\nManage multiple practices? Connect each QBO file separately and use the client selector.`,
  },
  {
    keywords: ['athenahealth', 'athena', 'ehr'],
    answer: `**athenahealth Integration:**\n\nSellerCFO syncs directly with athenahealth:\n\n- Patient records and demographics\n- Claims and revenue cycle data\n- Scheduling and appointments\n- Eligibility verification results\n\nTo connect: Go to **Integrations** and enter your athenahealth API credentials.`,
  },
  {
    keywords: ['nextgen', 'next gen'],
    answer: `**NextGen Healthcare Integration:**\n\nSellerCFO syncs with NextGen EHR/PM:\n\n- Patient demographics and encounters\n- Claims and financial data\n- Scheduling information\n- Financial reports\n\nTo connect: Go to **Integrations** and enter your NextGen API key.`,
  },
  {
    keywords: ['claims', 'billing', 'denial', 'denials', 'collection', 'collections', 'revenue cycle', 'rcm'],
    answer: `**Claims & Billing:**\n\nThe Claims & Billing page tracks your revenue cycle:\n\n- **Net Collection Rate** — Target 95%+\n- **Days in A/R** — Target under 35 days\n- **First Pass Resolution Rate** — Target over 90%\n- **Claims Denial Rate** — Target under 5%\n- **Payer Performance** — Reimbursement by payer\n- **A/R Aging Buckets** — 0-30, 31-60, 61-90, 90+ days\n\nAll data pulls from your connected EHR and QBO.`,
  },
  {
    keywords: ['cash flow', 'cashflow', 'cash', 'forecast'],
    answer: `**Cash Flow Forecasting:**\n\nThe Cash Flow page gives you 30/60/90-day visibility:\n\n- **Collections** — Expected insurance and patient payments\n- **Expenses** — Payroll, rent, supplies, vendor payments\n- **Net Cash Flow** — Trended over time\n- **Forecast** — Where your cash position is headed\n\nCritical for managing payroll cycles and capital expenditures.`,
  },
  {
    keywords: ['report', 'reports', 'financial', 'p&l', 'profit', 'loss'],
    answer: `**Practice Reports:**\n\n**Financial:** Revenue Summary, Collection Analysis, Payer Performance, P&L\n**Operations:** Provider Productivity, Patient Volume, Schedule Utilization, No-Show Analysis\n**Compliance:** Claims Audit Trail, Denial Patterns, Bad Debt Analysis\n\nAll reports pull live data from your synced integrations. Filter by date range or location.`,
  },
  {
    keywords: ['overview', 'dashboard', 'home', 'kpi', 'metric'],
    answer: `**Overview Dashboard:**\n\nYour real-time practice financial snapshot:\n\n- **Net Collection Rate** — Target 95%+\n- **Days in A/R** — Target under 35\n- **Revenue per Visit** — $150-400 range\n- **Overhead Ratio** — 55-65% target\n- **Claims Denial Rate** — Under 5%\n- **No-Show Rate** — Under 8%\n- **Provider Productivity (wRVUs)**\n- **Payer Mix Breakdown**\n\nAll figures update every time you sync.`,
  },
  {
    keywords: ['location', 'locations', 'multi-location', 'branch', 'office'],
    answer: `**Multi-Location Support:**\n\nSellerCFO supports practices with multiple locations:\n\n- **Location Filter** in the sidebar\n- Locations map from QBO Classes or Departments\n- "All Locations" shows the practice-wide view\n- Switch locations without reloading\n\nIdeal for multi-site medical groups.`,
  },
  {
    keywords: ['cfo', 'advisor', 'ai', 'advice', 'recommend'],
    answer: `**AI Financial Advisor:**\n\nAsk financial questions in plain English:\n\n- "Why did our collection rate drop last month?"\n- "Which payers have the highest denial rate?"\n- "What is our cash position forecast for next quarter?"\n\nThe AI uses industry and HFMA benchmarks to give e-commerce-specific recommendations.`,
  },
  {
    keywords: ['price', 'pricing', 'cost', 'plan', 'subscription', 'trial'],
    answer: `**SellerCFO Pricing:**\n\n**Starter — $199/mo**\n- Financial dashboard, collections tracking, cash flow\n- QuickBooks sync\n- AI Financial Advisor\n\n**Professional — $399/mo** (Most Popular)\n- Everything in Starter\n- athenahealth + NextGen + Kareo integrations\n- Provider productivity tracking\n- Payer mix analysis\n\n**Enterprise — $599/mo**\n- Everything in Professional\n- Open Dental, Salesforce integrations\n- Quarterly strategy call\n- Dedicated account manager\n\n**All plans:** 14-day free trial, cancel anytime.`,
  },
  {
    keywords: ['sync', 'pull', 'refresh', 'update', 'data'],
    answer: `**Syncing Your Data:**\n\n1. Click **"Sync with QBO"** in the top bar\n2. Wait for sync to complete\n3. Page reloads with fresh data\n\nAll connected integrations sync together.`,
  },
  {
    keywords: ['help', 'support', 'problem', 'issue', 'error', 'bug'],
    answer: `**Getting Support:**\n\n1. **Sync first** — Most issues resolve after a fresh sync\n2. **Email us** — Use the "Email Us" button above\n3. **Book a call** — We can screen share and troubleshoot\n\nTypical response time is within one business day.`,
  },
  {
    keywords: ['contact', 'reach', 'talk', 'human', 'about', 'company'],
    answer: `**About SellerCFO:**\n\nSellerCFO is a financial dashboard built for medical and e-commerce businesses. We help practices optimize their revenue cycle, reduce denials, improve collections, and gain real-time visibility into practice finances.\n\nUse the buttons above to email us or book a call.`,
  },
  {
    keywords: ['security', 'secure', 'data', 'privacy', 'encryption', 'hipaa'],
    answer: `**Security & Data Privacy:**\n\n- **Read-only access** — SellerCFO cannot modify your data\n- **OAuth 2.0** — Industry-standard authentication\n- **AES-256 encryption** at rest\n- **TLS 1.3 encryption** in transit\n- **Row-level security** — Each practice's data is isolated\n- **HIPAA-aware architecture** — PHI is handled with appropriate safeguards\n\nYour financial data is never shared or sold.`,
  },
  {
    keywords: ['what is', 'medicalcfo', 'value', 'why', 'benefit', 'roi'],
    answer: `**What is SellerCFO?**\n\nSellerCFO is a real-time financial dashboard for e-commerce brands. It connects to QuickBooks Online and EHR/PM systems to automate:\n\n- Revenue cycle analytics and collection tracking\n- Claims denial management and payer performance\n- Cash flow forecasting (30/60/90 day)\n- A/R aging and patient balance tracking\n- Provider productivity (wRVU) analysis\n- AI-powered financial insights\n\nPlans start at **$199/mo** with a 14-day free trial.`,
  },
  {
    keywords: ['who', 'for whom', 'target', 'practice type'],
    answer: `**Who is SellerCFO for?**\n\nSellerCFO is built for e-commerce businesses:\n\n- **Primary care** and family medicine practices\n- **Specialty practices** — dermatology, orthopedics, cardiology\n- **Dental practices** (via Open Dental integration)\n- **Multi-provider groups** with 2-50+ providers\n- **Multi-location practices** with multiple offices\n- **Practice management companies** overseeing multiple practices\n\nIf you use QuickBooks Online and want real-time financial visibility, SellerCFO was built for you.`,
  },
  {
    keywords: ['settings', 'account', 'profile', 'password'],
    answer: `**Account Settings:**\n\nGo to **Settings** in the sidebar to update your profile, manage integrations, configure notifications, and change your password.`,
  },
];

/* ─────────────────────────────────────────────────────────────
   Defaults
   ───────────────────────────────────────────────────────────── */

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: `Hi! I'm the SellerCFO support assistant. I can help with:\n\n- Setup & connecting QuickBooks, athenahealth, NextGen, and more\n- Dashboard features -- collections, claims, cash flow, A/R aging\n- Integrations (we connect 7+ platforms)\n- Pricing and plans\n\nWhat can I help you with?`,
  timestamp: new Date(),
};

const QUICK_QUESTIONS = [
  'What integrations do you support?',
  'How does order tracking work?',
  'How do I connect athenahealth?',
  'What are the pricing plans?',
];

/* ─────────────────────────────────────────────────────────────
   Answer Matching
   ───────────────────────────────────────────────────────────── */

function findAnswer(input: string): string {
  const normalized = input.toLowerCase();
  let bestMatch: KBEntry | null = null;
  let bestScore = 0;

  for (const entry of KNOWLEDGE_BASE) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (normalized.includes(kw.toLowerCase())) {
        // Longer keywords are more specific → worth more
        score += 1 + (kw.length > 8 ? 1 : 0);
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  if (bestMatch && bestScore > 0) {
    return bestMatch.answer;
  }

  return `I'm not sure I have a specific answer for that — but I can help!\n\nHere are some things I know about:\n• **Integrations** — QBO, athenahealth, NextGen, Salesforce, HubSpot, Open Dental, Kareo\n• **Features** — Job costing, Revenue Recognition, cash flow, AR/AP, AI advisor, reports\n• **Pricing** — Starter ($199), Professional ($399), Enterprise ($599)\n• **SellerCFO** — Fractional CFO services for practices\n\nOr use the buttons above to **email us** or **book a call** — we'll get back to you within one business day.`;
}

/* ─────────────────────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────────────────────── */

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  const formatContent = (text: string) => {
    return text.split('\n').map((line, i, arr) => {
      const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return (
        <span key={i}>
          <span dangerouslySetInnerHTML={{ __html: formatted }} />
          {i < arr.length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-[#06b6d4]' : 'bg-[#22222e] border border-[#2a2a3d]'
        }`}
      >
        {isUser ? <User size={14} /> : <Bot size={14} className="text-[#06b6d4]" />}
      </div>
      <div
        className={`max-w-[78%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-[#06b6d4] text-white rounded-br-sm'
            : 'bg-[#1a1a26] border border-[#2a2a3d] text-[#e8e8f0] rounded-bl-sm'
        }`}
      >
        {formatContent(message.content)}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full bg-[#22222e] border border-[#2a2a3d] flex items-center justify-center flex-shrink-0">
        <Bot size={14} className="text-[#06b6d4]" />
      </div>
      <div className="bg-[#1a1a26] border border-[#2a2a3d] px-4 py-3 rounded-2xl rounded-bl-sm">
        <div className="flex gap-1 items-center h-4">
          <span className="w-1.5 h-1.5 bg-[#06b6d4] rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 bg-[#06b6d4] rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 bg-[#06b6d4] rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Email Form (replaces the broken mailto: link)
   ───────────────────────────────────────────────────────────── */

function EmailForm({ onBack, onSent }: { onBack: () => void; onSent: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `[Support Chat Email]\n\nFrom: ${name || 'Not provided'}\nReply-to: ${email || 'Not provided'}\n\n${message.trim()}`,
          userName: name || 'Chat User',
          companyName: 'via Support Chat',
        }),
      });
      setSent(true);
      setTimeout(() => {
        onSent();
      }, 2500);
    } catch {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <div className="w-12 h-12 rounded-full bg-[#22c55e]/15 flex items-center justify-center mb-4">
          <Check size={24} className="text-[#22c55e]" />
        </div>
        <h3 className="text-base font-bold text-[#e8e8f0] mb-1">Message Sent!</h3>
        <p className="text-sm text-[#8888a0]">
          We'll reply to {email || 'you'} within one business day.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <p className="text-xs text-[#8888a0] mb-1">
        Send us a message and we'll reply within one business day.
      </p>
      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full bg-[#1a1a26] border border-[#2a2a3d] focus:border-[#06b6d4] rounded-xl px-3 py-2 text-sm text-[#e8e8f0] placeholder-[#555] outline-none transition-colors"
      />
      <input
        type="email"
        placeholder="Your email (so we can reply)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full bg-[#1a1a26] border border-[#2a2a3d] focus:border-[#06b6d4] rounded-xl px-3 py-2 text-sm text-[#e8e8f0] placeholder-[#555] outline-none transition-colors"
      />
      <textarea
        placeholder="How can we help?"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        className="w-full bg-[#1a1a26] border border-[#2a2a3d] focus:border-[#06b6d4] rounded-xl px-3 py-2.5 text-sm text-[#e8e8f0] placeholder-[#555] outline-none transition-colors resize-none"
        autoFocus
      />
      <button
        onClick={handleSend}
        disabled={!message.trim() || sending}
        className="w-full px-4 py-2.5 bg-[#06b6d4] hover:bg-[#22d3ee] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
      >
        {sending ? (
          <><Loader2 size={15} className="animate-spin" /> Sending...</>
        ) : (
          <><Send size={15} /> Send Message</>
        )}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────────────────────── */

type PanelView = 'chat' | 'calendar' | 'email';

export default function SupportChat() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<PanelView>('chat');
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (open) {
      scrollToBottom();
      setUnread(0);
      if (view === 'chat') setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, view, scrollToBottom]);

  useEffect(() => {
    if (open && view === 'chat') scrollToBottom();
  }, [messages, isTyping, open, view, scrollToBottom]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputValue('');
      setIsTyping(true);

      const delay = 600 + Math.random() * 800;
      await new Promise((r) => setTimeout(r, delay));

      const answer = findAnswer(trimmed);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: answer,
        timestamp: new Date(),
      };

      setIsTyping(false);
      setMessages((prev) => [...prev, assistantMsg]);

      if (!open) setUnread((n) => n + 1);
    },
    [open]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const headerTitles: Record<PanelView, string> = {
    chat: 'SellerCFO Support',
    calendar: 'Book a Call',
    email: 'Email Us',
  };

  const headerSubtitles: Record<PanelView, string> = {
    chat: 'Online · Usually replies instantly',
    calendar: '30-minute scope call · Mountain Time',
    email: 'We reply within one business day',
  };

  return (
    <>
      {/* Chat Panel */}
      <div
        className={`fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[400px] transition-all duration-300 origin-bottom-right ${
          open
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
        style={{ maxHeight: 'calc(100vh - 120px)' }}
      >
        <div
          className="bg-[#12121a] border border-[#2a2a3d] rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
          style={{ height: view === 'chat' ? '540px' : 'auto', maxHeight: 'calc(100vh - 120px)' }}
        >
          {/* Header */}
          <div className="bg-[#06b6d4] px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              {view !== 'chat' && (
                <button
                  onClick={() => setView('chat')}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors text-white mr-1"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                {view === 'calendar' ? (
                  <Calendar size={18} className="text-white" />
                ) : view === 'email' ? (
                  <Mail size={18} className="text-white" />
                ) : (
                  <Bot size={18} className="text-white" />
                )}
              </div>
              <div>
                <div className="font-semibold text-white text-sm">{headerTitles[view]}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 bg-[#22c55e] rounded-full" />
                  <span className="text-white/80 text-xs">{headerSubtitles[view]}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
            >
              <ChevronDown size={18} />
            </button>
          </div>

          {view === 'calendar' ? (
            <div className="flex-1 overflow-y-auto p-4">
              <BookingCalendar />
            </div>
          ) : view === 'email' ? (
            <EmailForm onBack={() => setView('chat')} onSent={() => setView('chat')} />
          ) : (
            <>
              {/* Quick Actions */}
              <div className="border-b border-[#2a2a3d] px-3 py-2.5 flex gap-2 flex-shrink-0">
                <button
                  onClick={() => setView('email')}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#1a1a26] hover:bg-[#22222e] border border-[#2a2a3d] hover:border-[#06b6d4] rounded-lg text-xs font-medium text-[#e8e8f0] transition-all duration-150"
                >
                  <Mail size={13} className="text-[#06b6d4]" />
                  Email Us
                </button>
                <button
                  onClick={() => setView('calendar')}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#1a1a26] hover:bg-[#22222e] border border-[#2a2a3d] hover:border-[#06b6d4] rounded-lg text-xs font-medium text-[#e8e8f0] transition-all duration-150"
                >
                  <Calendar size={13} className="text-[#06b6d4]" />
                  Book a Call
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Questions */}
              {messages.length === 1 && !isTyping && (
                <div className="px-3 pb-2 flex flex-wrap gap-2 flex-shrink-0">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="text-xs px-2.5 py-1.5 bg-[#1a1a26] hover:bg-[#22222e] border border-[#2a2a3d] hover:border-[#06b6d4] rounded-full text-[#c8c8e0] hover:text-[#e8e8f0] transition-all duration-150"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="border-t border-[#2a2a3d] px-3 py-3 flex-shrink-0">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask a question..."
                    className="flex-1 bg-[#1a1a26] border border-[#2a2a3d] focus:border-[#06b6d4] rounded-xl px-3 py-2 text-sm text-[#e8e8f0] placeholder-[#8888a0] outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isTyping}
                    className="w-9 h-9 flex items-center justify-center bg-[#06b6d4] hover:bg-[#22d3ee] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors flex-shrink-0"
                  >
                    <Send size={15} className="text-white" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Floating Bubble Button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-4 right-4 sm:right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#06b6d4] hover:bg-[#22d3ee] rounded-full shadow-lg shadow-[#06b6d4]/30 hover:shadow-[#06b6d4]/50 transition-all duration-200 hover:scale-105 active:scale-95"
        aria-label="Open support chat"
      >
        <div className="relative">
          {open ? (
            <X size={20} className="text-white" />
          ) : (
            <MessageCircle size={20} className="text-white" />
          )}
          {!open && unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#ef4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unread}
            </span>
          )}
        </div>
        <span className="text-white font-medium text-sm pr-0.5">
          {open ? 'Close' : 'Support'}
        </span>
      </button>
    </>
  );
}
