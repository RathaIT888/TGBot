import React, { useState } from 'react';
import {
  Zap,
  Bot,
  Send,
  Sparkles,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  PlusCircle,
  Play,
  Layers,
} from 'lucide-react';
import { AutoReplyRule, BotSettings, BotStats, MessageLog, TelegramBotInfo } from '../types';

interface DashboardTabProps {
  stats: BotStats;
  settings: BotSettings;
  botInfo: TelegramBotInfo | null;
  connected: boolean;
  rules: AutoReplyRule[];
  logs: MessageLog[];
  onOpenRules: () => void;
  onOpenSimulator: () => void;
  onOpenSetup: () => void;
  onOpenAI: () => void;
  onOpenScams?: () => void;
  onLoadPreset: (preset: string) => void;
  onRefresh: () => void;
  onSaveRule?: (rule: AutoReplyRule) => Promise<void>;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  stats,
  settings,
  botInfo,
  connected,
  rules,
  logs,
  onOpenRules,
  onOpenSimulator,
  onOpenSetup,
  onOpenAI,
  onOpenScams,
  onLoadPreset,
  onRefresh,
  onSaveRule,
}) => {
  const [quickTestInput, setQuickTestInput] = useState('');
  const [quickTestResult, setQuickTestResult] = useState<{
    reply: string;
    ruleName?: string;
    isAi?: boolean;
    latencyMs?: number;
  } | null>(null);
  const [testing, setTesting] = useState(false);

  // /start Welcome Editor Modal State
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const welcomeRule = rules.find((r) => r.triggerType === 'welcome') || rules.find((r) => r.patterns.includes('/start'));
  const [welcomeText, setWelcomeText] = useState(welcomeRule?.replyText || '');
  const [welcomePhotoUrl, setWelcomePhotoUrl] = useState(welcomeRule?.photoUrl || '');
  const [welcomeButtons, setWelcomeButtons] = useState(welcomeRule?.buttons ? [...welcomeRule.buttons] : []);
  const [newBtnText, setNewBtnText] = useState('');
  const [newBtnUrl, setNewBtnUrl] = useState('');
  const [newBtnCb, setNewBtnCb] = useState('');
  const [savingWelcome, setSavingWelcome] = useState(false);
  const welcomeFileRef = React.useRef<HTMLInputElement>(null);

  // Sync welcomeText when welcomeRule changes
  React.useEffect(() => {
    if (welcomeRule) {
      setWelcomeText(welcomeRule.replyText);
      setWelcomePhotoUrl(welcomeRule.photoUrl || '');
      setWelcomeButtons(welcomeRule.buttons ? [...welcomeRule.buttons] : []);
    }
  }, [welcomeRule]);

  const handleSaveWelcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!welcomeText.trim() || !onSaveRule) return;

    setSavingWelcome(true);
    try {
      const updatedRule: AutoReplyRule = {
        id: welcomeRule?.id || 'rule-welcome',
        name: welcomeRule?.name || '👋 Welcome Message & Poster (/start)',
        enabled: welcomeRule ? welcomeRule.enabled : true,
        triggerType: 'welcome',
        patterns: welcomeRule?.patterns && welcomeRule.patterns.length > 0 ? welcomeRule.patterns : ['/start', 'start', 'halo', 'hi'],
        caseSensitive: false,
        replyText: welcomeText.trim(),
        photoUrl: welcomePhotoUrl.trim() || undefined,
        useAI: Boolean(welcomeRule?.useAI),
        aiPromptModifier: welcomeRule?.aiPromptModifier || '',
        buttons: welcomeButtons,
        priority: 1,
        matchCount: welcomeRule?.matchCount || 0,
        lastTriggeredAt: welcomeRule?.lastTriggeredAt || null,
      };

      await onSaveRule(updatedRule);
      setIsWelcomeModalOpen(false);
    } catch (err) {
      console.error('Error saving welcome rule:', err);
    } finally {
      setSavingWelcome(false);
    }
  };

  const handleApplyWelcomePreset = (type: 'support' | 'ecommerce' | 'ai' | 'simple') => {
    if (type === 'support') {
      setWelcomeText('👋 Hello {first_name}! Welcome to {bot_name} Customer Support.\n\nI am your 24/7 automated assistant ready to help with orders, pricing, and FAQs.\n\n👇 Tap an option below or type your inquiry:');
      setWelcomeButtons([
        { text: '📋 Main Menu', callbackData: '/menu' },
        { text: '💎 Pricing & Plans', callbackData: 'price' },
        { text: '👨‍💼 Speak to Agent', callbackData: 'agent' },
      ]);
    } else if (type === 'ecommerce') {
      setWelcomeText('🛍️ Welcome to our official store, {first_name}!\n\nUse voucher code *WELCOME10* for 10% off your first checkout today.\n\nHow can we help you shop today?');
      setWelcomeButtons([
        { text: '🔥 Hot Deals', url: 'https://example.com/deals' },
        { text: '📦 Track Order', callbackData: 'order' },
        { text: '💳 Payment Methods', callbackData: 'payment' },
      ]);
    } else if (type === 'ai') {
      setWelcomeText('🤖 Greetings {first_name}! I am an intelligent AI assistant powered by Gemini 3.8.\n\nAsk me any question regarding our products, business hours, or documentation, and I will assist you instantly!');
      setWelcomeButtons([
        { text: '💡 What can you do?', callbackData: '/menu' },
        { text: '🌐 Visit Website', url: 'https://telegram.org' },
      ]);
    } else {
      setWelcomeText('👋 Hi {first_name}! Thanks for chatting with us.\n\nFeel free to type any question, or type /help for a list of available commands.');
      setWelcomeButtons([
        { text: '📋 View Menu', callbackData: '/menu' },
      ]);
    }
  };

  const handleQuickTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTestInput.trim()) return;

    setTesting(true);
    try {
      const res = await fetch('/api/bot/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: quickTestInput,
          senderName: 'Dashboard Tester',
          username: 'dashboard_test',
        }),
      });
      const data = await res.json();
      setQuickTestResult({
        reply: data.replyText,
        ruleName: data.matchedRule?.name || (data.isAiGenerated ? 'Gemini AI Fallback' : 'Default Reply'),
        isAi: data.isAiGenerated,
        latencyMs: data.latencyMs,
      });
    } catch (err) {
      console.error('Quick test error:', err);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner / Bot Connection Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/80 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-sky-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25 flex-shrink-0">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  {connected && botInfo ? botInfo.first_name : 'TeleReply Auto-Responder'}
                </h1>
                {connected && botInfo ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                    Online @{botInfo.username}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Simulator Testing Mode
                  </span>
                )}
                {settings.mode === 'polling' && (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Long Polling Active
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                Automated 24/7 Telegram auto-reply system powered by keyword matching, custom rules, and Gemini 3.8
                AI conversational responses.
              </p>

              {connected && botInfo && (
                <div className="flex items-center space-x-4 mt-3 text-xs text-slate-400">
                  <span>
                    Telegram Bot ID: <span className="text-slate-200 font-mono">{botInfo.id}</span>
                  </span>
                  <span>•</span>
                  <a
                    href={`https://t.me/${botInfo.username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-sky-400 hover:text-sky-300 font-medium"
                  >
                    Open in Telegram <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!connected && (
              <button
                onClick={onOpenSetup}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-medium text-xs shadow-lg shadow-sky-500/25 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Connect Telegram Token</span>
              </button>
            )}

            <button
              onClick={onOpenSimulator}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-all"
            >
              <Play className="w-4 h-4 text-emerald-400" />
              <span>Open Simulator</span>
            </button>

            <button
              onClick={onRefresh}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-all"
              title="Refresh Stats"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inbound */}
        <div className="bg-slate-900/90 rounded-xl p-5 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Received</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white tracking-tight">{stats.totalMessagesReceived}</span>
            <span className="text-xs text-emerald-400 flex items-center font-medium">
              100% Handled <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Incoming Telegram & test chats</p>
        </div>

        {/* Auto Replies Sent */}
        <div className="bg-slate-900/90 rounded-xl p-5 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Auto-Replies Sent</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white tracking-tight">{stats.totalRepliesSent}</span>
            <span className="text-xs text-slate-400 font-medium">Instant</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Delivered with zero human intervention</p>
        </div>

        {/* Gemini AI Handled */}
        <div className="bg-slate-900/90 rounded-xl p-5 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Gemini AI Replies</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white tracking-tight">{stats.aiRepliesCount}</span>
            <span className="text-xs text-purple-300 font-medium">
              {stats.totalRepliesSent > 0
                ? `${Math.round((stats.aiRepliesCount / stats.totalRepliesSent) * 100)}%`
                : '0%'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Contextual AI understanding</p>
        </div>

        {/* Active Rules */}
        <div className="bg-slate-900/90 rounded-xl p-5 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Rules</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white tracking-tight">{rules.filter((r) => r.enabled).length}</span>
            <button
              onClick={onOpenRules}
              className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center"
            >
              Manage <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">Keywords, regex, and commands</p>
        </div>
      </div>

      {/* Dedicated /start Welcome Auto-Reply Control Panel */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-850 rounded-2xl p-6 border border-sky-500/30 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <span className="text-xl">🚀</span>
              <h2 className="text-base font-bold text-white">/start Welcome Auto-Reply Handler</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Priority #1 Trigger
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Auto-Replies to /start & START button
              </span>
            </div>

            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              When any user opens your Telegram bot and clicks <strong>"START"</strong> or sends <code className="text-sky-300 font-mono">/start</code>,
              this automated onboarding response is delivered immediately with rich interactive buttons.
            </p>

            {/* Live Message Preview Box */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-3">
              <div className="flex items-center justify-between text-slate-400 text-[11px] border-b border-slate-800/80 pb-2">
                <span className="font-semibold text-sky-400">Telegram Client Bubble Preview:</span>
                <span>User receives:</span>
              </div>

              {/* Bubble with Poster */}
              <div className="bg-[#182533] rounded-2xl overflow-hidden border border-slate-700/60 shadow-md">
                {welcomeRule?.photoUrl && (
                  <div className="w-full h-44 overflow-hidden bg-slate-900 border-b border-slate-700/50 relative group">
                    <img
                      src={welcomeRule.photoUrl}
                      alt="Welcome poster preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as any).src = 'https://placehold.co/800x400?text=Welcome+Poster';
                      }}
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] text-white font-medium">
                      🖼️ Auto-reply Poster
                    </div>
                  </div>
                )}

                <div className="text-slate-200 whitespace-pre-wrap font-sans text-xs leading-relaxed p-3.5">
                  {welcomeRule ? welcomeRule.replyText.replace(/{first_name}/gi, 'Alex').replace(/{name}/gi, 'Alex').replace(/{username}/gi, '@alex_telegram').replace(/{bot_name}/gi, botInfo?.first_name || 'TeleReply Bot') : '👋 Hello {first_name}! Welcome to our Official Bot.'}
                </div>
              </div>

              {/* Action Buttons Preview */}
              {welcomeRule?.buttons && welcomeRule.buttons.length > 0 && (
                <div className="pt-1">
                  <div className="text-[10px] text-slate-400 mb-1.5 uppercase tracking-wider font-semibold">
                    Attached Inline Menu Buttons:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {welcomeRule.buttons.map((btn, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-lg bg-[#242f3d] border border-slate-700 text-slate-200 text-xs font-medium flex items-center space-x-1.5"
                      >
                        <span>{btn.text}</span>
                        {btn.url && <ExternalLink className="w-3 h-3 text-sky-400" />}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Variable Tags Help */}
            <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400 pt-1">
              <span className="font-semibold text-slate-300">Supported variables:</span>
              {['{first_name}', '{username}', '{bot_name}', '{start_param}', '{time}', '{date}'].map((tag) => (
                <span key={tag} className="px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 font-mono text-[10px] border border-slate-700">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Action Column */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 flex-shrink-0 w-full lg:w-56">
            <button
              onClick={() => {
                setQuickTestInput('/start');
                handleQuickTest({ preventDefault: () => {} } as any);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-xs shadow-md shadow-sky-500/20 transition-all flex items-center justify-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Test /start Reply Now</span>
            </button>

            <button
              onClick={() => setIsWelcomeModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-colors flex items-center justify-center space-x-2"
            >
              <span>✏️ Customize /start Reply</span>
            </button>

            <button
              onClick={onOpenSimulator}
              className="w-full py-2 px-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs transition-colors flex items-center justify-center space-x-1.5"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span>Open in Web Simulator</span>
            </button>
          </div>
        </div>
      </div>

      {/* Middle Section: Quick Test Engine & Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Message Test Sandbox */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">⚡ Instant Auto-Reply Tester</h2>
              <p className="text-xs text-slate-400">
                Type any sample user message to verify which rule matches and see the bot's instant response.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              Live Sandbox
            </span>
          </div>

          <form onSubmit={handleQuickTest} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={quickTestInput}
                onChange={(e) => setQuickTestInput(e.target.value)}
                placeholder="Try '/start', 'What are your prices?', 'shipping', or 'help'..."
                className="flex-1 bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              />
              <button
                type="submit"
                disabled={testing || !quickTestInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-medium text-xs shadow-md shadow-sky-500/20 transition-all flex items-center space-x-2"
              >
                {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Test Reply</span>
              </button>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-400 pt-1">
              <span>Quick test:</span>
              {['/start', 'pricing', 'order status', 'operating hours', 'talk to human', 'tell me about your services'].map(
                (chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setQuickTestInput(chip);
                    }}
                    className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] transition-colors"
                  >
                    {chip}
                  </button>
                )
              )}
            </div>
          </form>

          {/* Quick Test Result Box */}
          {quickTestResult && (
            <div className="mt-4 p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-sky-400">Matched:</span>
                  <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-200 font-mono text-[11px]">
                    {quickTestResult.ruleName}
                  </span>
                  {quickTestResult.isAi && (
                    <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-semibold border border-purple-500/30">
                      Gemini 3.8 AI
                    </span>
                  )}
                </div>
                {quickTestResult.latencyMs !== undefined && (
                  <span className="text-slate-400 text-[11px] flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {quickTestResult.latencyMs}ms
                  </span>
                )}
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 whitespace-pre-wrap font-sans">
                {quickTestResult.reply}
              </div>
            </div>
          )}
        </div>

        {/* Ready-to-Use Rule Presets */}
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Layers className="w-5 h-5 text-sky-400" />
              <h2 className="text-base font-semibold text-white">Rule Presets</h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Switch your bot's behavior in 1-click using battle-tested auto-reply rule templates.
            </p>

            <div className="space-y-2.5">
              <div
                onClick={() => onLoadPreset('customer_support')}
                className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/70 cursor-pointer transition-all hover:border-sky-500/50 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white group-hover:text-sky-300">
                    🎧 Customer Support Desk
                  </span>
                  <span className="text-[10px] font-medium text-slate-400">7 rules</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  FAQs, operating hours, ticket handoff, and pricing guide.
                </p>
              </div>

              <div
                onClick={() => onLoadPreset('ecommerce')}
                className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/70 cursor-pointer transition-all hover:border-sky-500/50 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white group-hover:text-sky-300">
                    🛍️ E-Commerce & Retail Store
                  </span>
                  <span className="text-[10px] font-medium text-slate-400">4 rules</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Product categories, discounts, order delivery tracking.
                </p>
              </div>

              <div
                onClick={() => onLoadPreset('community')}
                className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/70 cursor-pointer transition-all hover:border-sky-500/50 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white group-hover:text-sky-300">
                    🛡️ Community & Group Chat
                  </span>
                  <span className="text-[10px] font-medium text-slate-400">3 rules</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Rules enforcement, admin contacts, member onboarding.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Want custom persona?</span>
            <button
              onClick={onOpenAI}
              className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center"
            >
              Configure AI <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Auto-Reply Activity */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Recent Auto-Reply Activity</h2>
            <p className="text-xs text-slate-400">Live feed of processed inbound inquiries and outbound replies</p>
          </div>
          <span className="text-xs text-slate-400">Showing latest {Math.min(logs.length, 5)} events</span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {logs.slice(0, 5).map((log) => (
            <div key={log.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-200">{log.senderName}</span>
                  {log.username && <span className="text-slate-400">@{log.username}</span>}
                  <span className="text-slate-400">•</span>
                  <span className="text-[11px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase ${
                      log.source === 'telegram'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {log.source}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-slate-400">User:</span>
                  <span className="text-slate-200 italic font-mono bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                    "{log.incomingText}"
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-slate-400">Replied:</span>
                  <span className="text-slate-300 truncate max-w-md">
                    {log.replyText.replace(/\n/g, ' ')}
                  </span>
                </div>
              </div>

              <div className="flex items-center sm:flex-col sm:items-end gap-1 flex-shrink-0">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-sky-400 text-[11px] font-medium border border-slate-700">
                  {log.matchedRuleName || 'Default'}
                </span>
                {log.latencyMs !== undefined && (
                  <span className="text-[10px] text-slate-400">{log.latencyMs}ms response time</span>
                )}
              </div>
            </div>
          ))}

          {logs.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs">
              No message logs yet. Send a message in the Simulator to see live processing!
            </div>
          )}
        </div>
      </div>

      {/* /start Welcome Customizer Modal */}
      {isWelcomeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🚀</span>
                <div>
                  <h2 className="text-lg font-bold text-white">Customize /start Welcome Auto-Reply</h2>
                  <p className="text-xs text-slate-400">Triggered whenever a user opens the chat or sends /start</p>
                </div>
              </div>
              <button
                onClick={() => setIsWelcomeModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Quick 1-Click Template Bar */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-300">Choose Onboarding Template:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleApplyWelcomePreset('support')}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-left transition-colors"
                >
                  <span className="block text-[11px] font-bold text-sky-400">🎧 Support Desk</span>
                  <span className="text-[10px] text-slate-400">Menu & FAQs</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyWelcomePreset('ecommerce')}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-left transition-colors"
                >
                  <span className="block text-[11px] font-bold text-amber-400">🛍️ Store Voucher</span>
                  <span className="text-[10px] text-slate-400">10% Promo Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyWelcomePreset('ai')}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-left transition-colors"
                >
                  <span className="block text-[11px] font-bold text-purple-400">🤖 AI Assistant</span>
                  <span className="text-[10px] text-slate-400">Gemini 3.8 Intro</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyWelcomePreset('simple')}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-left transition-colors"
                >
                  <span className="block text-[11px] font-bold text-emerald-400">👋 Friendly</span>
                  <span className="text-[10px] text-slate-400">Concise Greeting</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveWelcome} className="space-y-5 text-xs">
              {/* Message Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                  <label className="text-slate-300 font-semibold">
                    Welcome Message Content *
                  </label>
                  <div className="flex items-center space-x-1 flex-wrap">
                    <span className="text-[10px] text-slate-400 mr-1">Insert tag:</span>
                    {['{first_name}', '{username}', '{bot_name}', '{start_param}', '{time}', '{date}'].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setWelcomeText((prev) => prev + ' ' + v)}
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 font-mono text-[10px] border border-slate-700"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={5}
                  required
                  value={welcomeText}
                  onChange={(e) => setWelcomeText(e.target.value)}
                  placeholder="Enter the automated reply message when users send /start..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 font-sans leading-relaxed"
                />
              </div>

              {/* Poster Image / Banner Attachment */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-base">🖼️</span>
                    <span className="font-semibold text-white">/start Poster / Banner (sendPhoto)</span>
                  </div>
                  {welcomePhotoUrl && (
                    <button
                      type="button"
                      onClick={() => setWelcomePhotoUrl('')}
                      className="text-[11px] text-red-400 hover:text-red-300 font-medium"
                    >
                      Remove Poster
                    </button>
                  )}
                </div>

                <p className="text-slate-400 text-[11px]">
                  Attach a visual banner or poster. When users tap START, Telegram will send this poster with your greeting as the photo description caption.
                </p>

                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="file"
                      ref={welcomeFileRef}
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 10 * 1024 * 1024) {
                          alert('Image file must be under 10MB.');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (typeof ev.target?.result === 'string') {
                            setWelcomePhotoUrl(ev.target.result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => welcomeFileRef.current?.click()}
                      className="px-3.5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <span>Upload Poster Image</span>
                    </button>

                    <input
                      type="text"
                      value={welcomePhotoUrl}
                      onChange={(e) => setWelcomePhotoUrl(e.target.value)}
                      placeholder="Or paste public image / poster URL (https://...)"
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 font-mono"
                    />
                  </div>

                  {/* Sample Posters */}
                  <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-400 pt-1">
                    <span>Sample banners:</span>
                    <button
                      type="button"
                      onClick={() => setWelcomePhotoUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-[10px]"
                    >
                      🚀 Modern 3D Welcome
                    </button>
                    <button
                      type="button"
                      onClick={() => setWelcomePhotoUrl('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=80')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[10px]"
                    >
                      🛍️ Store Sale Banner
                    </button>
                    <button
                      type="button"
                      onClick={() => setWelcomePhotoUrl('https://images.unsplash.com/photo-1534536281715-e28d76689b4d?w=800&auto=format&fit=crop&q=80')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-[10px]"
                    >
                      🎧 Helpdesk Banner
                    </button>
                  </div>

                  {/* Live Poster Thumbnail */}
                  {welcomePhotoUrl && (
                    <div className="mt-2.5 p-2 rounded-xl bg-slate-900 border border-slate-700 flex items-center space-x-3">
                      <div className="w-20 h-16 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 flex-shrink-0">
                        <img
                          src={welcomePhotoUrl}
                          alt="Poster preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as any).src = 'https://placehold.co/400x300?text=Invalid+Image+URL';
                          }}
                        />
                      </div>
                      <div className="text-xs space-y-0.5 flex-1 min-w-0">
                        <span className="font-semibold text-white block">Poster Attached to /start</span>
                        <span className="text-slate-400 text-[10px] truncate block font-mono">
                          {welcomePhotoUrl.startsWith('data:') ? 'Local Image File' : welcomePhotoUrl}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Inline Action Buttons */}
              <div className="space-y-2">
                <label className="block text-slate-300 font-semibold">
                  Interactive Telegram Buttons attached to /start
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newBtnText}
                    onChange={(e) => setNewBtnText(e.target.value)}
                    placeholder="Button Title (e.g. 📋 Menu)"
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                  <input
                    type="url"
                    value={newBtnUrl}
                    onChange={(e) => setNewBtnUrl(e.target.value)}
                    placeholder="URL Link (https://...)"
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newBtnCb}
                      onChange={(e) => setNewBtnCb(e.target.value)}
                      placeholder="Or Command (/menu)"
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newBtnText.trim()) return;
                        setWelcomeButtons([
                          ...welcomeButtons,
                          {
                            text: newBtnText.trim(),
                            url: newBtnUrl.trim() || undefined,
                            callbackData: newBtnCb.trim() || undefined,
                          },
                        ]);
                        setNewBtnText('');
                        setNewBtnUrl('');
                        setNewBtnCb('');
                      }}
                      className="px-3 py-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-lg text-xs"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Current Buttons List */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {welcomeButtons.map((btn, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs"
                    >
                      <span className="font-medium text-white">{btn.text}</span>
                      {btn.url && <span className="text-[10px] text-sky-400">🔗 Link</span>}
                      {btn.callbackData && <span className="text-[10px] text-amber-400 font-mono">cmd: {btn.callbackData}</span>}
                      <button
                        type="button"
                        onClick={() => setWelcomeButtons(welcomeButtons.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-red-400 ml-1 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {welcomeButtons.length === 0 && (
                    <span className="text-slate-400 italic text-[11px]">No buttons attached.</span>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsWelcomeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingWelcome}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold shadow-md shadow-sky-500/20"
                >
                  {savingWelcome ? 'Saving...' : 'Save /start Welcome Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
