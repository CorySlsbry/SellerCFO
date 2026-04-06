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
  Sparkles,
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

/* ─────────────────────────────────────────────────────────────
   AI Chat System Prompt (for unauthenticated landing page visitors)
   ───────────────────────────────────────────────────────────── */

const AI_SYSTEM_PROMPT = `You are the SellerCFO sales assistant — a friendly, knowledgeable AI that helps e-commerce brand owners understand how SellerCFO can solve their financial visibility problems.

Key facts about SellerCFO:
- Real-time financial dashboard for e-commerce/DTC brands
- Syncs with 6 sales channels: Shopify, Amazon, Etsy, WooCommerce, Walmart, TikTok Shop
- Integrates with QuickBooks Online for true bookkeeping accuracy
- 50+ KPIs across 8 categories: Revenue, Profitability, Customer, Cash Flow, Inventory, Marketing, Platform-Specific, Operations
- AI CFO Advisor powered by Claude AI for personalized financial guidance
- Plans: Essential ($199/mo), Professional ($399/mo), Enterprise ($799/mo)
- 14-day free trial, no credit card required
- White-glove setup included — we connect everything for you in under 2 hours
- 500+ brands served, 23% average margin improvement, 15 hrs/week saved
- Key differentiators vs BeProfit/Lifetimely: QuickBooks sync, cash flow forecasting, contribution margin waterfall, AI advisor, 6+ channels

Your goals:
1. Answer questions about SellerCFO features, pricing, and setup
2. Help visitors understand how SellerCFO solves their specific pain points
3. Guide them toward starting a free trial or booking a scope call
4. Be concise (2-4 sentences per response unless they ask for detail)
5. Never make up features that don't exist

If they ask something you can't answer, suggest they book a call or email support@sellercfo.com.`;

/* ─────────────────────────────────────────────────────────────
   Defaults
   ───────────────────────────────────────────────────────────── */

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: `Hey! I'm the SellerCFO AI assistant. I can help you understand:\n\n- How SellerCFO tracks profitability across your sales channels\n- Which plan is right for your brand\n- How setup works (spoiler: we do it for you)\n- Any other questions about e-commerce financial visibility\n\nWhat can I help with?`,
  timestamp: new Date(),
};

const QUICK_QUESTIONS = [
  'What makes you different from BeProfit?',
  'How does the QuickBooks sync work?',
  'What are the pricing plans?',
  'How long does setup take?',
];

/* ─────────────────────────────────────────────────────────────
   AI Response via /api/ai/chat (landing page endpoint)
   Falls back to local KB if API fails
   ───────────────────────────────────────────────────────────── */

async function getAIResponse(messages: Message[]): Promise<string> {
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: AI_SYSTEM_PROMPT,
        messages: messages
          .filter((m) => m.id !== 'welcome')
          .map((m) => ({
            role: m.role,
            content: m.content,
          })),
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // Read streaming response
    const reader = res.body?.getReader();
    if (!reader) throw new Error('No reader');

    let result = '';
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += decoder.decode(value, { stream: true });
    }

    return result || "I'm not sure about that — try booking a call and we can dig into your specific situation!";
  } catch {
    // Fallback response if AI fails
    return "Thanks for your interest in SellerCFO! I'm having a brief connectivity issue. You can:\n\n- **Start a free trial** at /signup\n- **Book a call** using the calendar button above\n- **Email us** at support@sellercfo.com\n\nWe'll get back to you within one business day.";
  }
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
          isUser ? 'bg-[#8b5cf6]' : 'bg-[#22222e] border border-[#2a2a3d]'
        }`}
      >
        {isUser ? <User size={14} /> : <Sparkles size={14} className="text-[#8b5cf6]" />}
      </div>
      <div
        className={`max-w-[78%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-[#8b5cf6] text-white rounded-br-sm'
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
        <Sparkles size={14} className="text-[#8b5cf6]" />
      </div>
      <div className="bg-[#1a1a26] border border-[#2a2a3d] px-4 py-3 rounded-2xl rounded-bl-sm">
        <div className="flex gap-1 items-center h-4">
          <span className="w-1.5 h-1.5 bg-[#8b5cf6] rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 bg-[#8b5cf6] rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 bg-[#8b5cf6] rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Email Form
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
          We&apos;ll reply to {email || 'you'} within one business day.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <p className="text-xs text-[#8888a0] mb-1">
        Send us a message and we&apos;ll reply within one business day.
      </p>
      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full bg-[#1a1a26] border border-[#2a2a3d] focus:border-[#8b5cf6] rounded-xl px-3 py-2 text-sm text-[#e8e8f0] placeholder-[#555] outline-none transition-colors"
      />
      <input
        type="email"
        placeholder="Your email (so we can reply)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full bg-[#1a1a26] border border-[#2a2a3d] focus:border-[#8b5cf6] rounded-xl px-3 py-2 text-sm text-[#e8e8f0] placeholder-[#555] outline-none transition-colors"
      />
      <textarea
        placeholder="How can we help?"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        className="w-full bg-[#1a1a26] border border-[#2a2a3d] focus:border-[#8b5cf6] rounded-xl px-3 py-2.5 text-sm text-[#e8e8f0] placeholder-[#555] outline-none transition-colors resize-none"
        autoFocus
      />
      <button
        onClick={handleSend}
        disabled={!message.trim() || sending}
        className="w-full px-4 py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
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

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInputValue('');
      setIsTyping(true);

      // Call AI endpoint
      const answer = await getAIResponse(updatedMessages);

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
    [open, messages]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const headerTitles: Record<PanelView, string> = {
    chat: 'SellerCFO AI',
    calendar: 'Book a Call',
    email: 'Email Us',
  };

  const headerSubtitles: Record<PanelView, string> = {
    chat: 'AI-powered · Replies instantly',
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
          <div className="bg-[#8b5cf6] px-4 py-3 flex items-center justify-between flex-shrink-0">
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
                  <Sparkles size={18} className="text-white" />
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
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#1a1a26] hover:bg-[#22222e] border border-[#2a2a3d] hover:border-[#8b5cf6] rounded-lg text-xs font-medium text-[#e8e8f0] transition-all duration-150"
                >
                  <Mail size={13} className="text-[#8b5cf6]" />
                  Email Us
                </button>
                <button
                  onClick={() => setView('calendar')}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#1a1a26] hover:bg-[#22222e] border border-[#2a2a3d] hover:border-[#8b5cf6] rounded-lg text-xs font-medium text-[#e8e8f0] transition-all duration-150"
                >
                  <Calendar size={13} className="text-[#8b5cf6]" />
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
                      className="text-xs px-2.5 py-1.5 bg-[#1a1a26] hover:bg-[#22222e] border border-[#2a2a3d] hover:border-[#8b5cf6] rounded-full text-[#c8c8e0] hover:text-[#e8e8f0] transition-all duration-150"
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
                    placeholder="Ask anything about SellerCFO..."
                    className="flex-1 bg-[#1a1a26] border border-[#2a2a3d] focus:border-[#8b5cf6] rounded-xl px-3 py-2 text-sm text-[#e8e8f0] placeholder-[#8888a0] outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isTyping}
                    className="w-9 h-9 flex items-center justify-center bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors flex-shrink-0"
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
        className="fixed bottom-4 right-4 sm:right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded-full shadow-lg shadow-[#8b5cf6]/30 hover:shadow-[#8b5cf6]/50 transition-all duration-200 hover:scale-105 active:scale-95"
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
          {open ? 'Close' : 'Ask AI'}
        </span>
      </button>
    </>
  );
}
