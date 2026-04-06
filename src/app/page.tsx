'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  ShieldCheck,
  Zap,
  Star,
  Check,
  ChevronDown,
  Play,
  ShoppingCart,
  Store,
  Globe,
  Layers,
  LineChart,
  PieChart,
  Target,
  Users,
  Clock,
  Award,
  ArrowUpRight,
} from 'lucide-react';
import SupportChat from '@/components/support-chat';
import { LandingTracker } from '@/components/landing-tracker';

/* ─── Channel Logos ─── */
const CHANNELS = [
  { name: 'Shopify', color: '#96bf48' },
  { name: 'Amazon', color: '#ff9900' },
  { name: 'Etsy', color: '#f1641e' },
  { name: 'WooCommerce', color: '#7f54b3' },
  { name: 'Walmart', color: '#0071dc' },
  { name: 'TikTok Shop', color: '#ff004f' },
  { name: 'QuickBooks', color: '#2ca01c' },
];

/* ─── Testimonials ─── */
const TESTIMONIALS = [
  {
    quote: "Finally understood why we were cash-strapped despite 'profitable' months. SellerCFO revealed $180K in hidden inventory costs we never saw in spreadsheets.",
    name: 'Sarah Chen',
    title: 'CEO, Pure Botanicals',
    metric: '$180K recovered',
  },
  {
    quote: "We were spending 40% of revenue on ads without knowing our true ROAS. SellerCFO showed us which channels were actually profitable — we cut $12K/mo in waste.",
    name: 'Marcus Rivera',
    title: 'Founder, Ridge & River Co.',
    metric: '$12K/mo saved',
  },
  {
    quote: "Went from 3 days of Excel reconciliation to real-time visibility across 4 channels. Our investor board deck now takes 10 minutes, not 2 weeks.",
    name: 'Jennifer Park',
    title: 'COO, Luminaire Beauty',
    metric: '15 hrs/week saved',
  },
];

/* ─── FAQ Data ─── */
const FAQ_ITEMS = [
  {
    q: 'How is this different from BeProfit or Lifetimely?',
    a: "SellerCFO goes beyond basic profit tracking to provide true CFO-level insights — cash flow forecasting, multi-channel inventory planning, and contribution margin analysis at the SKU level. We sync with QuickBooks Online so your books are always accurate, not just your dashboard. We're built for scaling brands, not beginners.",
  },
  {
    q: 'Does this replace QuickBooks?',
    a: 'No — SellerCFO complements QuickBooks by pulling in your e-commerce data and providing the analytics layer that QBO lacks. We sync seamlessly with QuickBooks Online to ensure your books stay accurate while giving you the real-time visibility your accountant can\'t.',
  },
  {
    q: 'How long does setup take?',
    a: 'Most brands are fully connected in under 2 hours. We provide white-glove onboarding to map your chart of accounts and ensure accurate data flow from day one. Connect your sales channels with OAuth (click, authorize, done) and we handle the rest.',
  },
  {
    q: 'Can I track custom KPIs specific to my business?',
    a: 'Yes! Professional plans include custom KPI builders and the ability to create your own formulas using any data point we track — contribution margin waterfall, blended ROAS, channel-level CAC, whatever matters to your business.',
  },
  {
    q: 'What if I sell on channels beyond the big 6?',
    a: 'Enterprise plans support custom integrations via API or CSV upload for any additional sales channels. We also support Salesforce and HubSpot CRM integrations for end-to-end customer lifecycle tracking.',
  },
  {
    q: 'Is my data secure?',
    a: "Absolutely. All integrations use OAuth 2.0 with read-only access — SellerCFO cannot modify your data anywhere. We use AES-256 encryption at rest, TLS 1.3 in transit, and row-level security in our database so each brand's data is fully isolated.",
  },
];

/* ─── Comparison Data ─── */
const COMPARISON = [
  { feature: 'Real-time P&L by channel', us: true, spreadsheets: false, beprofit: true, lifetimely: true },
  { feature: 'QuickBooks sync (2-way)', us: true, spreadsheets: false, beprofit: false, lifetimely: false },
  { feature: 'Cash flow forecasting', us: true, spreadsheets: false, beprofit: false, lifetimely: false },
  { feature: 'Contribution margin waterfall', us: true, spreadsheets: false, beprofit: false, lifetimely: false },
  { feature: 'Inventory intelligence', us: true, spreadsheets: false, beprofit: true, lifetimely: false },
  { feature: '6+ sales channels', us: true, spreadsheets: true, beprofit: false, lifetimely: false },
  { feature: 'AI CFO advisor', us: true, spreadsheets: false, beprofit: false, lifetimely: false },
  { feature: 'Custom KPI builder', us: true, spreadsheets: true, beprofit: false, lifetimely: false },
];

/* ─── FAQ Accordion ─── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[#1e1e2e] rounded-xl overflow-hidden transition-all">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-[#12121a] transition-colors"
      >
        <span className="font-semibold text-[#e8e8f0] pr-4">{q}</span>
        <ChevronDown
          size={20}
          className={`text-[#8b5cf6] flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="px-6 pb-5 text-[#94a3b8] leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

/* ─── Animated Counter ─── */
function AnimatedStat({ value, label, prefix = '', suffix = '' }: { value: number; label: string; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const end = value;
    const duration = 1500;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [visible, value]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    const el = document.getElementById(`stat-${label.replace(/\s/g, '-')}`);
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [label]);

  return (
    <div id={`stat-${label.replace(/\s/g, '-')}`} className="text-center">
      <div className="text-4xl md:text-5xl font-bold text-[#8b5cf6] mb-2">
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div className="text-[#94a3b8] text-sm">{label}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f1f5f9]">
      <LandingTracker />

      {/* ─── STICKY NAV ─── */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-[#1e1e2e]">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-1.5 text-xl font-bold tracking-tight">
            <ShoppingCart size={24} className="text-[#8b5cf6]" />
            <span className="text-[#8b5cf6]">Seller</span>
            <span className="text-[#e8e8f0]">CFO</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-[#94a3b8]">
            <a href="#features" className="hover:text-[#8b5cf6] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#8b5cf6] transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-[#8b5cf6] transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-[#8b5cf6] transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:inline-flex text-sm text-[#94a3b8] hover:text-[#e8e8f0] transition-colors">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-[#8b5cf6]/25 hover:shadow-[#8b5cf6]/40"
            >
              Start Free Trial
              <ArrowRight size={16} />
            </Link>
          </div>
        </nav>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#8b5cf6]/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#8b5cf6]/5 rounded-full blur-[120px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-16">
          {/* Social proof bar */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className="text-[#fbbf24] fill-[#fbbf24]" />
              ))}
            </div>
            <span className="text-sm text-[#94a3b8]">Trusted by 500+ e-commerce brands</span>
          </div>

          {/* Main headline */}
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6">
              Stop Guessing Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa]">
                True Profitability
              </span>
              <br />
              Across Every Channel
            </h1>

            <p className="text-lg sm:text-xl text-[#94a3b8] max-w-2xl mx-auto mb-8 leading-relaxed">
              SellerCFO syncs your sales channels, ad platforms, and QuickBooks in real time —
              giving you instant clarity on unit economics, cash flow, and which products actually make money.
            </p>

            {/* Trust callout */}
            <div className="inline-flex items-center gap-3 bg-[#10b981]/5 border border-[#10b981]/20 rounded-full px-5 py-2.5 mb-8">
              <ShieldCheck size={18} className="text-[#10b981]" />
              <span className="text-sm text-[#94a3b8]">
                <strong className="text-[#e8e8f0]">White-glove setup included</strong> — we connect everything for you
              </span>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-semibold rounded-xl transition-all shadow-xl shadow-[#8b5cf6]/25 hover:shadow-[#8b5cf6]/40 text-lg"
              >
                Start 14-Day Free Trial
                <ArrowRight size={20} />
              </Link>
              <button
                onClick={() => setShowVideo(true)}
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#12121a] border border-[#2a2a3d] hover:border-[#8b5cf6]/50 text-[#e8e8f0] font-semibold rounded-xl transition-all text-lg"
              >
                <Play size={18} className="text-[#8b5cf6]" />
                Watch 2-min Demo
              </button>
            </div>

            <p className="text-sm text-[#64748b]">
              No credit card required · Cancel anytime · Setup in under 2 hours
            </p>
          </div>

          {/* Price anchor */}
          <div className="max-w-lg mx-auto mt-12 bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-6 text-center">
            <div className="text-[#64748b] line-through text-lg">Fractional CFO: $8,000–$15,000/mo</div>
            <div className="text-3xl font-bold text-[#10b981] mt-1">SellerCFO: from $199/mo</div>
            <div className="text-sm text-[#64748b] mt-2">Same visibility. 98% less cost. Instant setup.</div>
          </div>

          {/* Channel logos */}
          <div className="mt-16">
            <p className="text-center text-sm text-[#64748b] mb-6">Connects with the platforms you already use</p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {CHANNELS.map((ch) => (
                <div
                  key={ch.name}
                  className="flex items-center gap-2 px-4 py-2 bg-[#12121a] border border-[#1e1e2e] rounded-lg"
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ch.color }} />
                  <span className="text-sm text-[#94a3b8] font-medium">{ch.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="border-y border-[#1e1e2e] py-16 bg-[#0a0a0f]">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          <AnimatedStat value={12} prefix="$" suffix="M+" label="Profit recovered for clients" />
          <AnimatedStat value={23} suffix="%" label="Average margin improvement" />
          <AnimatedStat value={15} suffix=" hrs" label="Saved per week per client" />
          <AnimatedStat value={500} suffix="+" label="E-commerce brands served" />
        </div>
      </section>

      {/* ─── PAIN → SOLUTION ─── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Running an E-commerce Brand Without Financial Visibility Is{' '}
              <span className="text-[#ef4444]">Flying Blind</span>
            </h2>
            <p className="text-lg text-[#94a3b8]">
              Most DTC brands don't know their true profit margin until weeks after the month closes.
              By then, the damage is done.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              { icon: DollarSign, pain: "Can't calculate true margins after all fees and ad costs", solution: 'Real-time contribution margin down to the SKU level' },
              { icon: TrendingUp, pain: "Running out of cash despite showing 'profit'", solution: '30/60/90-day cash flow forecasting with inventory impact' },
              { icon: Package, pain: 'Inventory planning is guesswork — stockouts or excess', solution: 'AI-powered reorder points and sell-through projections' },
              { icon: BarChart3, pain: 'Hours in spreadsheets reconciling Amazon fees', solution: 'Automated fee reconciliation across all 6 channels' },
              { icon: Target, pain: 'Marketing spend increasing but ROI is unclear', solution: 'Blended ROAS and channel-level CAC tracking' },
              { icon: Layers, pain: 'Multiple tools that don\'t talk to each other', solution: 'One dashboard syncing sales, ads, inventory + QBO' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-6 bg-[#12121a] border border-[#1e1e2e] rounded-xl hover:border-[#8b5cf6]/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-[#8b5cf6]/10 flex items-center justify-center flex-shrink-0">
                  <item.icon size={22} className="text-[#8b5cf6]" />
                </div>
                <div>
                  <p className="text-[#ef4444]/80 text-sm mb-1 line-through">{item.pain}</p>
                  <p className="text-[#e8e8f0] font-medium">{item.solution}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-20 sm:py-28 bg-gradient-to-b from-[#0a0a0f] via-[#0f0f18] to-[#0a0a0f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 rounded-full text-sm text-[#8b5cf6] font-medium mb-4">
              <Zap size={14} /> 50+ KPIs across 8 categories
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything Your CFO Would Track —<br />Automated & Real-Time
            </h2>
            <p className="text-lg text-[#94a3b8]">
              From unit economics to inventory turns to ad efficiency — we track the KPIs that actually matter for e-commerce profitability.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: DollarSign, title: 'Revenue & Sales', desc: 'GMV, Net Revenue, AOV, Units Sold, Conversion Rate, MRR — across every channel', color: '#8b5cf6' },
              { icon: TrendingUp, title: 'Profitability', desc: 'Contribution Margin waterfall (CM1/CM2/CM3), EBITDA, COGS ratio, Gross Margin by SKU', color: '#10b981' },
              { icon: Users, title: 'Customer Intelligence', desc: 'CAC, LTV, LTV:CAC ratio, Payback Period, Repeat Purchase Rate, Churn, NPS', color: '#06b6d4' },
              { icon: LineChart, title: 'Cash Flow', desc: 'Operating Cash Flow, FCF, Cash Conversion Cycle (DIO+DSO-DPO), Burn Rate, Runway', color: '#f59e0b' },
              { icon: Package, title: 'Inventory Intelligence', desc: 'Turnover, Sell-Through Rate, Stockout Rate, Dead Stock %, Days of Inventory', color: '#ef4444' },
              { icon: PieChart, title: 'Marketing & Ads', desc: 'ROAS, Blended ROAS/MER, CPA, Ad Spend %, Channel-level attribution', color: '#ec4899' },
              { icon: Store, title: 'Platform-Specific', desc: 'Amazon: ACoS, TACoS, BSR, Buy Box %, IPI. Shopify: Cart Abandonment. Etsy: Star Seller', color: '#8b5cf6' },
              { icon: Globe, title: 'Operations', desc: 'Fulfillment Cost/Order, Shipping %, Return Rate, Order Accuracy, Delivery Time', color: '#10b981' },
              { icon: BarChart3, title: 'AI CFO Advisor', desc: 'Ask questions in plain English. Get specific, actionable advice backed by industry benchmarks.', color: '#06b6d4' },
            ].map((feat, i) => (
              <div
                key={i}
                className="group p-6 bg-[#12121a] border border-[#1e1e2e] rounded-xl hover:border-opacity-50 transition-all"
                style={{ '--hover-color': feat.color } as React.CSSProperties}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors"
                  style={{ backgroundColor: `${feat.color}15` }}
                >
                  <feat.icon size={22} style={{ color: feat.color }} />
                </div>
                <h3 className="text-lg font-semibold text-[#e8e8f0] mb-2">{feat.title}</h3>
                <p className="text-sm text-[#94a3b8] leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Live in Under 2 Hours</h2>
            <p className="text-lg text-[#94a3b8]">White-glove setup included with every plan</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Connect Your Channels', desc: 'OAuth connect Shopify, Amazon, Etsy, WooCommerce, Walmart, TikTok Shop — plus QuickBooks Online. Click, authorize, done.', icon: Zap },
              { step: '02', title: 'We Map Your Data', desc: "Our team maps your chart of accounts, configures KPIs for your business model, and verifies data accuracy. You don't lift a finger.", icon: ShieldCheck },
              { step: '03', title: 'Real-Time Visibility', desc: 'Your dashboard populates with true P&L, cash flow forecasts, inventory intelligence, and AI-powered insights. Updated in real time.', icon: BarChart3 },
            ].map((s, i) => (
              <div key={i} className="relative">
                <div className="text-6xl font-bold text-[#8b5cf6]/10 mb-4">{s.step}</div>
                <div className="w-12 h-12 rounded-xl bg-[#8b5cf6]/10 flex items-center justify-center mb-4">
                  <s.icon size={22} className="text-[#8b5cf6]" />
                </div>
                <h3 className="text-xl font-semibold text-[#e8e8f0] mb-2">{s.title}</h3>
                <p className="text-[#94a3b8] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMPARISON TABLE ─── */}
      <section className="py-20 sm:py-28 bg-[#0f0f18]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Brands Switch to SellerCFO</h2>
            <p className="text-lg text-[#94a3b8]">More than a profit tracker — a complete CFO toolkit</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e1e2e]">
                  <th className="text-left py-4 px-4 text-sm font-semibold text-[#94a3b8]">Feature</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-[#8b5cf6]">SellerCFO</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-[#94a3b8]">Spreadsheets</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-[#94a3b8]">BeProfit</th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-[#94a3b8]">Lifetimely</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={i} className="border-b border-[#1e1e2e]/50">
                    <td className="py-4 px-4 text-sm text-[#e8e8f0]">{row.feature}</td>
                    <td className="py-4 px-4 text-center">
                      {row.us ? <Check size={18} className="inline text-[#10b981]" /> : <span className="text-[#64748b]">—</span>}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.spreadsheets ? <Check size={18} className="inline text-[#64748b]" /> : <span className="text-[#64748b]">—</span>}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.beprofit ? <Check size={18} className="inline text-[#64748b]" /> : <span className="text-[#64748b]">—</span>}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.lifetimely ? <Check size={18} className="inline text-[#64748b]" /> : <span className="text-[#64748b]">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Brands That Stopped Guessing</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-6 flex flex-col">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={14} className="text-[#fbbf24] fill-[#fbbf24]" />
                  ))}
                </div>
                <p className="text-[#cbd5e1] leading-relaxed flex-1 mb-4">"{t.quote}"</p>
                <div className="flex items-center justify-between pt-4 border-t border-[#1e1e2e]">
                  <div>
                    <div className="font-semibold text-[#e8e8f0] text-sm">{t.name}</div>
                    <div className="text-xs text-[#64748b]">{t.title}</div>
                  </div>
                  <div className="text-sm font-semibold text-[#10b981]">{t.metric}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="py-20 sm:py-28 bg-gradient-to-b from-[#0a0a0f] via-[#0f0f18] to-[#0a0a0f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-[#94a3b8]">
              Every plan includes a 14-day free trial. No credit card required to start.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Essential */}
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-8 flex flex-col">
              <h3 className="text-xl font-bold text-[#e8e8f0] mb-1">Essential</h3>
              <p className="text-sm text-[#64748b] mb-4">Solo sellers & small brands</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-[#e8e8f0]">$199</span>
                <span className="text-[#64748b]">/mo</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'Core KPI Dashboard (50+ metrics)',
                  'Shopify + Amazon Integration',
                  'QuickBooks Online Sync',
                  'Unit Economics Tracking',
                  'Cash Flow Forecasting',
                  'AI CFO Advisor',
                  '30-Day Data History',
                  'Email Support',
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[#94a3b8]">
                    <Check size={16} className="text-[#8b5cf6] mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup?plan=basic"
                className="block text-center px-6 py-3 border border-[#8b5cf6] text-[#8b5cf6] hover:bg-[#8b5cf6] hover:text-white font-semibold rounded-xl transition-all"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Professional */}
            <div className="relative bg-[#12121a] border-2 border-[#8b5cf6] rounded-2xl p-8 flex flex-col shadow-xl shadow-[#8b5cf6]/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#8b5cf6] text-white text-xs font-bold px-4 py-1 rounded-full">
                MOST POPULAR
              </div>
              <h3 className="text-xl font-bold text-[#e8e8f0] mb-1">Professional</h3>
              <p className="text-sm text-[#64748b] mb-4">Growing multi-channel brands</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-[#e8e8f0]">$399</span>
                <span className="text-[#64748b]">/mo</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'Everything in Essential',
                  'Etsy + WooCommerce + TikTok Shop',
                  'Inventory Forecasting & Alerts',
                  'Contribution Margin Waterfall',
                  'Custom Reports & KPI Builder',
                  'Channel Profitability Analysis',
                  'API Access',
                  'Unlimited Data History',
                  'Priority Support',
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[#94a3b8]">
                    <Check size={16} className="text-[#8b5cf6] mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup?plan=pro"
                className="block text-center px-6 py-3 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-semibold rounded-xl transition-all shadow-lg shadow-[#8b5cf6]/25"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-8 flex flex-col">
              <h3 className="text-xl font-bold text-[#e8e8f0] mb-1">Enterprise</h3>
              <p className="text-sm text-[#64748b] mb-4">Scaling brands & agencies</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-[#e8e8f0]">$799</span>
                <span className="text-[#64748b]">/mo</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'Everything in Professional',
                  'Walmart + All Sales Channels',
                  'Multi-Store Support',
                  'Custom Integrations via API',
                  'Dedicated Account Manager',
                  'Advanced AI Insights',
                  'Quarterly Strategy Call',
                  'White-Label Reports',
                  'SSO & Team Permissions',
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[#94a3b8]">
                    <Check size={16} className="text-[#8b5cf6] mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup?plan=enterprise"
                className="block text-center px-6 py-3 border border-[#8b5cf6] text-[#8b5cf6] hover:bg-[#8b5cf6] hover:text-white font-semibold rounded-xl transition-all"
              >
                Start Free Trial
              </Link>
            </div>
          </div>

          {/* Guarantee */}
          <div className="max-w-2xl mx-auto mt-12 text-center">
            <div className="inline-flex items-center gap-3 bg-[#10b981]/5 border border-[#10b981]/20 rounded-2xl px-6 py-4">
              <Award size={24} className="text-[#10b981]" />
              <div className="text-left">
                <div className="font-semibold text-[#e8e8f0]">30-Day Money-Back Guarantee</div>
                <div className="text-sm text-[#94a3b8]">If SellerCFO doesn't improve your financial visibility, we'll refund every penny.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {FAQ_ITEMS.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#8b5cf6]/10 via-[#12121a] to-[#8b5cf6]/5 border border-[#8b5cf6]/20 rounded-3xl p-10 sm:p-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              See Your Numbers in Real Time,<br />Not 30 Days Late
            </h2>
            <p className="text-lg text-[#94a3b8] max-w-2xl mx-auto mb-8">
              Join 500+ e-commerce brands who stopped guessing and started growing with real financial intelligence.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-semibold rounded-xl transition-all shadow-xl shadow-[#8b5cf6]/25 hover:shadow-[#8b5cf6]/40 text-lg"
              >
                Start Your Free Trial
                <ArrowRight size={20} />
              </Link>
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 text-[#94a3b8] hover:text-[#e8e8f0] font-medium transition-colors"
              >
                View pricing <ArrowUpRight size={16} />
              </a>
            </div>
            <p className="text-sm text-[#64748b] mt-4">14-day free trial · No credit card · White-glove setup</p>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-[#1e1e2e] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-1.5 text-lg font-bold">
              <ShoppingCart size={20} className="text-[#8b5cf6]" />
              <span className="text-[#8b5cf6]">Seller</span>
              <span className="text-[#e8e8f0]">CFO</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[#64748b]">
              <Link href="/terms" className="hover:text-[#94a3b8] transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-[#94a3b8] transition-colors">Privacy</Link>
              <a href="mailto:support@sellercfo.com" className="hover:text-[#94a3b8] transition-colors">Contact</a>
            </div>
            <div className="text-sm text-[#64748b]">
              &copy; {new Date().getFullYear()} SellerCFO. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* ─── CHAT BUBBLE ─── */}
      <SupportChat />

      {/* ─── VIDEO MODAL ─── */}
      {showVideo && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowVideo(false)}
        >
          <div
            className="relative w-full max-w-4xl aspect-video bg-[#12121a] rounded-2xl border border-[#1e1e2e] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center p-8">
              <Play size={48} className="text-[#8b5cf6] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#e8e8f0] mb-2">Demo Video Coming Soon</h3>
              <p className="text-[#94a3b8]">Book a live demo instead — we'll walk through YOUR numbers.</p>
              <button
                onClick={() => setShowVideo(false)}
                className="mt-4 px-6 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-semibold rounded-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
