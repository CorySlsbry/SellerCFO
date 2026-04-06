'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Send,
  Brain,
  Sparkles,
  MessageSquare,
  RotateCcw,
  Database,
  Wifi,
  WifiOff,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface DataStatus {
  qboConnected: boolean;
  integrationsConnected: string[];
  lastSynced: string | null;
  hasData: boolean;
}

const STARTER_QUESTIONS = [
  { text: 'Give me a financial health summary of my business right now', icon: '📊' },
  { text: 'Which jobs are over-billed and at risk at close?', icon: '⚠️' },
  { text: 'What does my cash flow look like for the next 90 days?', icon: '💰' },
  { text: 'Which invoices should I follow up on first?', icon: '📋' },
  { text: 'How do my margins compare to CFMA benchmarks?', icon: '📈' },
  { text: 'What is my patient balance exposure right now?', icon: '🔒' },
];

// Simple markdown-like renderer for AI responses
function FormattedMessage({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const Tag = listType;
      elements.push(
        <Tag
          key={`list-${elements.length}`}
          className={`${listType === 'ol' ? 'list-decimal' : 'list-disc'} pl-5 space-y-1.5 my-3`}
        >
          {listItems.map((item, i) => (
            <li key={i} className="text-[#c8c8d8] text-sm leading-relaxed">
              {renderInlineFormatting(item)}
            </li>
          ))}
        </Tag>
      );
      listItems = [];
      listType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={`h4-${i}`} className="text-sm font-bold text-[#e8e8f0] mt-4 mb-2 uppercase tracking-wide">
          {renderInlineFormatting(line.slice(4))}
        </h4>
      );
    } else if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${i}`} className="text-base font-bold text-[#e8e8f0] mt-5 mb-2 border-b border-[#2a2a3d] pb-2">
          {renderInlineFormatting(line.slice(3))}
        </h3>
      );
    } else if (line.startsWith('# ')) {
      flushList();
      elements.push(
        <h2 key={`h2-${i}`} className="text-lg font-bold text-[#e8e8f0] mt-5 mb-3">
          {renderInlineFormatting(line.slice(2))}
        </h2>
      );
    } else if (/^\d+\.\s/.test(line)) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      listItems.push(line.replace(/^\d+\.\s/, ''));
    } else if (/^[-*]\s/.test(line.trim())) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      listItems.push(line.trim().replace(/^[-*]\s/, ''));
    } else if (/^---+$/.test(line.trim())) {
      flushList();
      elements.push(<hr key={`hr-${i}`} className="border-[#2a2a3d] my-4" />);
    } else if (line.trim() === '') {
      flushList();
    } else {
      flushList();
      elements.push(
        <p key={`p-${i}`} className="text-[#c8c8d8] text-sm leading-relaxed my-2">
          {renderInlineFormatting(line)}
        </p>
      );
    }
  }
  flushList();

  return <div className="space-y-0.5">{elements}</div>;
}

function renderInlineFormatting(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;
  let keyIdx = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <strong key={`b-${keyIdx++}`} className="font-semibold text-[#e8e8f0]">
        {match[1]}
      </strong>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

export default function AdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dataStatus, setDataStatus] = useState<DataStatus>({
    qboConnected: false,
    integrationsConnected: [],
    lastSynced: null,
    hasData: false,
  });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showDataPanel, setShowDataPanel] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch dashboard data on mount to determine connection status and pre-load context
  useEffect(() => {
    async function fetchData() {
      setIsLoadingData(true);
      try {
        const [dashRes, intgRes] = await Promise.all([
          fetch('/api/qbo/data').then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('/api/integrations/data').then(r => r.ok ? r.json() : null).catch(() => null),
        ]);

        const hasQboData = dashRes?.success && dashRes?.data && dashRes.data.revenue > 0;
        const connectedSources = intgRes?.connectedSources || [];
        const lastUpdated = dashRes?.data?.last_updated || null;

        setDataStatus({
          qboConnected: hasQboData,
          integrationsConnected: connectedSources,
          lastSynced: lastUpdated,
          hasData: hasQboData || connectedSources.length > 0,
        });

        // Store dashboard data for client-side context pass-through
        if (dashRes?.data) {
          setDashboardData(dashRes.data);
        }
      } catch (err) {
        console.warn('Could not fetch data status:', err);
      } finally {
        setIsLoadingData(false);
      }
    }
    fetchData();
  }, []);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputValue.trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          // Pass client-side dashboard data as fallback context
          clientContext: dashboardData ? { dashboard: dashboardData } : undefined,
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.statusText}`);
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullContent += decoder.decode(value);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, content: fullContent } : msg
          )
        );
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: 'Sorry, I encountered an error processing your request. Please try again.' }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInputValue('');
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-5 border-b border-[#2a2a3d]">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#06b6d4] to-[#8b5cf6] flex items-center justify-center shadow-lg shadow-[#06b6d4]/20">
                <Brain className="text-white" size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#e8e8f0]">CFO Advisor</h1>
                <p className="text-xs text-[#8888a0]">
                  {dataStatus.hasData
                    ? 'Analyzing your live financial data'
                    : 'AI-powered financial guidance for practices'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Data connection indicator */}
              <button
                onClick={() => setShowDataPanel(!showDataPanel)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                  dataStatus.hasData
                    ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30 hover:bg-[#22c55e]/20'
                    : 'bg-[#2a2a3d] text-[#8888a0] border border-[#2a2a3d] hover:text-[#e8e8f0]'
                }`}
              >
                {isLoadingData ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : dataStatus.hasData ? (
                  <Wifi size={12} />
                ) : (
                  <WifiOff size={12} />
                )}
                {dataStatus.hasData ? 'Live Data' : 'No Data'}
                {showDataPanel ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              </button>

              {messages.length > 0 && (
                <button
                  onClick={handleNewChat}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-[#8888a0] hover:text-[#e8e8f0] hover:bg-[#2a2a3d] transition-all"
                >
                  <RotateCcw size={14} />
                  New Chat
                </button>
              )}
            </div>
          </div>

          {/* Expandable data panel */}
          {showDataPanel && (
            <div className="mt-3 p-3 bg-[#12121a] border border-[#2a2a3d] rounded-lg">
              <div className="text-[10px] font-semibold text-[#8888a0] uppercase tracking-wider mb-2">Data Sources</div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${dataStatus.qboConnected ? 'bg-[#22c55e]' : 'bg-[#555]'}`} />
                    <span className="text-xs text-[#c8c8d8]">QuickBooks Online</span>
                  </div>
                  <span className={`text-[10px] ${dataStatus.qboConnected ? 'text-[#22c55e]' : 'text-[#555]'}`}>
                    {dataStatus.qboConnected ? 'Connected' : 'Not connected'}
                  </span>
                </div>
                {dataStatus.integrationsConnected.length > 0 ? (
                  dataStatus.integrationsConnected.map((source) => (
                    <div key={source} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                        <span className="text-xs text-[#c8c8d8]">{source}</span>
                      </div>
                      <span className="text-[10px] text-[#22c55e]">Connected</span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#555]" />
                      <span className="text-xs text-[#c8c8d8]">Field Management Tools</span>
                    </div>
                    <span className="text-[10px] text-[#555]">None connected</span>
                  </div>
                )}
              </div>
              {dataStatus.lastSynced && (
                <div className="mt-2 pt-2 border-t border-[#2a2a3d] text-[10px] text-[#555]">
                  Last synced: {new Date(dataStatus.lastSynced).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              {!dataStatus.hasData && (
                <p className="mt-2 pt-2 border-t border-[#2a2a3d] text-[10px] text-[#8888a0]">
                  Connect QuickBooks in Settings &gt; Integrations to get personalized financial analysis from the CFO Advisor.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-6">
          {messages.length === 0 ? (
            <div className="space-y-8 pt-8">
              <div className="text-center space-y-3">
                <div className="flex justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#06b6d4]/20 to-[#8b5cf6]/10 border border-[#06b6d4]/30 flex items-center justify-center">
                    <Sparkles className="text-[#06b6d4]" size={28} />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-[#e8e8f0]">
                  {dataStatus.hasData
                    ? 'I can see your financial data. What would you like to know?'
                    : 'How can I help your business?'}
                </h2>
                <p className="text-sm text-[#8888a0] max-w-md mx-auto">
                  {dataStatus.hasData
                    ? 'I have access to your QuickBooks data, claim costs, invoices, cash flow, and connected integrations. Ask me anything specific about your numbers.'
                    : 'Ask me about cash flow, claims tracking, tax strategy, credentialing, Claims Pending accounting, or any healthcare financial topic. Connect QuickBooks for personalized analysis.'}
                </p>
              </div>

              {/* Data summary card when connected */}
              {dataStatus.hasData && dashboardData && (
                <div className="bg-[#12121a] border border-[#06b6d4]/20 rounded-xl p-4 max-w-md mx-auto">
                  <div className="flex items-center gap-2 mb-3">
                    <Database size={14} className="text-[#06b6d4]" />
                    <span className="text-[10px] font-semibold text-[#a5b4fc] uppercase tracking-wider">Your Data Snapshot</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {dashboardData.revenue > 0 && (
                      <div>
                        <span className="text-[#8888a0]">Revenue</span>
                        <div className="font-semibold text-[#e8e8f0]">${(dashboardData.revenue / 1000).toFixed(0)}K</div>
                      </div>
                    )}
                    {dashboardData.cash_balance > 0 && (
                      <div>
                        <span className="text-[#8888a0]">Cash</span>
                        <div className="font-semibold text-[#e8e8f0]">${(dashboardData.cash_balance / 1000).toFixed(0)}K</div>
                      </div>
                    )}
                    {dashboardData.accounts_receivable > 0 && (
                      <div>
                        <span className="text-[#8888a0]">AR</span>
                        <div className="font-semibold text-[#e8e8f0]">${(dashboardData.accounts_receivable / 1000).toFixed(0)}K</div>
                      </div>
                    )}
                    {dashboardData.invoices?.length > 0 && (
                      <div>
                        <span className="text-[#8888a0]">Open Invoices</span>
                        <div className="font-semibold text-[#e8e8f0]">{dashboardData.invoices.filter((i: any) => i.status !== 'paid').length}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {STARTER_QUESTIONS.map((q, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(q.text)}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-[#2a2a3d] bg-[#12121a] hover:bg-[#1a1a26] hover:border-[#06b6d4]/40 transition-all duration-200 text-left group"
                  >
                    <span className="text-lg flex-shrink-0">{q.icon}</span>
                    <p className="text-sm text-[#a0a0b8] group-hover:text-[#e8e8f0] transition-colors leading-snug">
                      {q.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map((message) => (
                <div key={message.id}>
                  {message.role === 'user' ? (
                    <div className="flex justify-end">
                      <div className="max-w-[75%]">
                        <div className="bg-[#06b6d4] rounded-2xl rounded-br-md px-4 py-3">
                          <p className="text-white text-sm leading-relaxed">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#06b6d4] to-[#8b5cf6] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                        <Brain className="text-white" size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="bg-[#12121a] border border-[#2a2a3d] rounded-2xl rounded-tl-md px-5 py-4">
                          {message.content ? (
                            <FormattedMessage content={message.content} />
                          ) : (
                            <div className="flex items-center gap-2 py-1">
                              <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-[#06b6d4] rounded-full animate-bounce" />
                                <div className="w-1.5 h-1.5 bg-[#06b6d4] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                                <div className="w-1.5 h-1.5 bg-[#06b6d4] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                              </div>
                              <span className="text-[#8888a0] text-xs ml-1">
                                {dataStatus.hasData ? 'Analyzing your data...' : 'Thinking...'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-[#2a2a3d] bg-[#0a0a0f] px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2.5 items-center bg-[#12121a] border border-[#2a2a3d] rounded-xl px-4 py-2 focus-within:border-[#06b6d4] focus-within:ring-1 focus-within:ring-[#06b6d4]/50 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={dataStatus.hasData ? 'Ask about your jobs, cash flow, invoices, margins...' : 'Ask your CFO advisor...'}
              disabled={isLoading}
              className="flex-1 bg-transparent text-[#e8e8f0] text-sm placeholder-[#666680] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed py-1.5"
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputValue.trim()}
              size="sm"
              className="bg-[#06b6d4] hover:bg-[#4f46e5] text-white rounded-lg px-3 h-8 disabled:opacity-30"
            >
              <Send size={15} />
            </Button>
          </div>
          <p className="text-[10px] text-[#555568] text-center mt-2">
            {dataStatus.hasData
              ? 'Powered by Claude · Using your live QuickBooks & integration data'
              : 'Powered by Claude · Connect QuickBooks for personalized analysis'}
          </p>
        </div>
      </div>
    </div>
  );
}
