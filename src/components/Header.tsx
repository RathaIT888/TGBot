import React from 'react';
import { Send, Zap, Bot, Radio, ShieldCheck, Sparkles, MessageSquareText, ShieldAlert } from 'lucide-react';
import { BotSettings, BotStats, TelegramBotInfo } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  connected: boolean;
  botInfo: TelegramBotInfo | null;
  mode: BotSettings['mode'];
  stats: BotStats;
  geminiEnabled: boolean;
  onOpenSimulator: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  connected,
  botInfo,
  mode,
  stats,
  geminiEnabled,
  onOpenSimulator,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Zap },
    { id: 'scams', label: 'Scam Shield & Reports', icon: ShieldAlert, badge: stats.scamReportsCount },
    { id: 'rules', label: 'Reply Rules', icon: Sparkles, badge: stats.activeRulesCount },
    { id: 'ai', label: 'AI Persona & Knowledge', icon: Bot },
    { id: 'simulator', label: 'Telegram Simulator', icon: MessageSquareText },
    { id: 'setup', label: 'Bot Connection', icon: Radio },
    { id: 'logs', label: 'Message Logs', icon: Send },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 text-slate-100">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white">
              <Send className="w-5 h-5 -rotate-12 translate-x-[-1px] translate-y-[-1px]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-sky-100 to-sky-400 bg-clip-text text-transparent">
                  TeleReply
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  Bot Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">Telegram Auto-Reply & AI Chatbot</p>
            </div>
          </div>

          {/* Connection Status & Quick Action */}
          <div className="flex items-center space-x-3">
            {/* Status Badge */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    connected ? (mode === 'polling' ? 'bg-emerald-400' : 'bg-sky-400') : 'bg-amber-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    connected ? (mode === 'polling' ? 'bg-emerald-500' : 'bg-sky-500') : 'bg-amber-500'
                  }`}
                />
              </span>

              {connected && botInfo ? (
                <div className="flex items-center space-x-1.5">
                  <span className="font-medium text-slate-200">@{botInfo.username}</span>
                  <span className="text-[11px] text-slate-400 uppercase">
                    ({mode === 'polling' ? 'Long Polling' : mode === 'webhook' ? 'Webhook' : 'Simulator'})
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5">
                  <span className="font-medium text-amber-300">Simulator Mode</span>
                  <span className="text-[11px] text-slate-400">(Ready to link Bot)</span>
                </div>
              )}
            </div>

            {/* Gemini Badge */}
            {geminiEnabled && (
              <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Gemini 3.8 AI Ready</span>
              </div>
            )}

            {/* Quick Simulator Button */}
            <button
              onClick={onOpenSimulator}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-md shadow-sky-500/25 transition-all transform active:scale-95"
            >
              <MessageSquareText className="w-3.5 h-3.5" />
              <span>Launch Simulator</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-t border-slate-800/80 bg-slate-900/60 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-sky-400 shadow-sm border border-slate-700/80'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                        isActive ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
