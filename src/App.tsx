/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { DashboardTab } from './components/DashboardTab';
import { RulesTab } from './components/RulesTab';
import { AiConfigTab } from './components/AiConfigTab';
import { SimulatorTab } from './components/SimulatorTab';
import { BotSetupTab } from './components/BotSetupTab';
import { LogsTab } from './components/LogsTab';
import { AutoReplyRule, BotSettings, BotStats, MessageLog, ScamReport, TelegramBotInfo } from './types';
import { ScamReportsTab } from './components/ScamReportsTab';

const INITIAL_SETTINGS: BotSettings = {
  botToken: '',
  botInfo: null,
  mode: 'simulator_only',
  webhookUrl: '',
  geminiEnabled: true,
  geminiModel: 'gemini-3.8-flash',
  aiPersona: 'You are a helpful and concise Telegram customer support bot.',
  knowledgeBase: '',
  fallbackToAI: true,
  defaultFallbackReply: 'Thank you for your message! Our team will get back to you shortly.',
  businessHours: {
    enabled: false,
    timezone: 'UTC',
    startHour: 9,
    startMinute: 0,
    endHour: 18,
    endMinute: 0,
    workDays: [1, 2, 3, 4, 5],
    awayMessage: 'We are currently away.',
  },
  enableTypingAction: true,
};

const INITIAL_STATS: BotStats = {
  totalMessagesReceived: 0,
  totalRepliesSent: 0,
  aiRepliesCount: 0,
  activeRulesCount: 0,
  lastActiveAt: null,
  uptimeSeconds: 0,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [connected, setConnected] = useState(false);
  const [botInfo, setBotInfo] = useState<TelegramBotInfo | null>(null);
  const [settings, setSettings] = useState<BotSettings>(INITIAL_SETTINGS);
  const [stats, setStats] = useState<BotStats>(INITIAL_STATS);
  const [geminiEnabled, setGeminiEnabled] = useState(true);
  const [rules, setRules] = useState<AutoReplyRule[]>([]);
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [scamReports, setScamReports] = useState<ScamReport[]>([]);
  const [simulatorPreloadText, setSimulatorPreloadText] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch status and stats
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/bot/status');
      if (res.ok) {
        const data = await res.json();
        setConnected(data.connected);
        setBotInfo(data.botInfo);
        setGeminiEnabled(data.geminiEnabled);
        if (data.settings) setSettings(data.settings);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching bot status:', err);
    }
  }, []);

  // Fetch rules
  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch('/api/rules');
      if (res.ok) {
        const data = await res.json();
        setRules(data);
      }
    } catch (err) {
      console.error('Error fetching rules:', err);
    }
  }, []);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/logs?limit=100');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  }, []);

  // Fetch scam reports
  const fetchScamReports = useCallback(async () => {
    try {
      const res = await fetch('/api/scam-reports');
      if (res.ok) {
        const data = await res.json();
        setScamReports(data);
      }
    } catch (err) {
      console.error('Error fetching scam reports:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    Promise.all([fetchStatus(), fetchRules(), fetchLogs(), fetchScamReports()]).finally(() => {
      setLoading(false);
    });

    // Auto-refresh interval for real-time activity
    const interval = setInterval(() => {
      fetchStatus();
      fetchLogs();
      fetchScamReports();
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchStatus, fetchRules, fetchLogs, fetchScamReports]);

  // Rule actions
  const handleSaveRule = async (rule: AutoReplyRule) => {
    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });
      if (res.ok) {
        await fetchRules();
        await fetchStatus();
      }
    } catch (err) {
      console.error('Error saving rule:', err);
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      const res = await fetch(`/api/rules/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchRules();
        await fetchStatus();
      }
    } catch (err) {
      console.error('Error deleting rule:', err);
    }
  };

  const handleLoadPreset = async (presetKey: string) => {
    try {
      const res = await fetch('/api/rules/preset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset: presetKey }),
      });
      if (res.ok) {
        await fetchRules();
        await fetchStatus();
        setActiveTab('rules');
      }
    } catch (err) {
      console.error('Error loading preset:', err);
    }
  };

  // Settings update
  const handleUpdateSettings = async (partial: Partial<BotSettings>) => {
    try {
      const res = await fetch('/api/bot/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial),
      });
      if (res.ok) {
        await fetchStatus();
      }
    } catch (err) {
      console.error('Error updating settings:', err);
    }
  };

  // Token connection
  const handleConnectToken = async (
    token: string,
    mode: BotSettings['mode']
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/bot/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, mode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchStatus();
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to connect token' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const handleDisconnect = async () => {
    try {
      const res = await fetch('/api/bot/disconnect', { method: 'POST' });
      if (res.ok) {
        await fetchStatus();
      }
    } catch (err) {
      console.error('Error disconnecting bot:', err);
    }
  };

  const handleSendBroadcast = async (chatId: string, message: string) => {
    try {
      const res = await fetch('/api/bot/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchLogs();
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to send message' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const handleClearLogs = async () => {
    try {
      const res = await fetch('/api/logs', { method: 'DELETE' });
      if (res.ok) {
        setLogs([]);
      }
    } catch (err) {
      console.error('Error clearing logs:', err);
    }
  };

  const handleTestRuleInSimulator = (sampleText: string) => {
    setSimulatorPreloadText(sampleText);
    setActiveTab('simulator');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        connected={connected}
        botInfo={botInfo}
        mode={settings.mode}
        stats={stats}
        geminiEnabled={geminiEnabled}
        onOpenSimulator={() => setActiveTab('simulator')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400" />
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardTab
                stats={stats}
                settings={settings}
                botInfo={botInfo}
                connected={connected}
                rules={rules}
                logs={logs}
                onOpenRules={() => setActiveTab('rules')}
                onOpenSimulator={() => setActiveTab('simulator')}
                onOpenSetup={() => setActiveTab('setup')}
                onOpenAI={() => setActiveTab('ai')}
                onLoadPreset={handleLoadPreset}
                onRefresh={() => {
                  fetchStatus();
                  fetchLogs();
                }}
                onSaveRule={handleSaveRule}
              />
            )}

            {activeTab === 'scams' && (
              <ScamReportsTab
                scamReports={scamReports}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onRefresh={fetchScamReports}
                onTestInSimulator={handleTestRuleInSimulator}
              />
            )}

            {activeTab === 'rules' && (
              <RulesTab
                rules={rules}
                onSaveRule={handleSaveRule}
                onDeleteRule={handleDeleteRule}
                onTestRuleInSimulator={handleTestRuleInSimulator}
                onLoadPreset={handleLoadPreset}
              />
            )}

            {activeTab === 'ai' && (
              <AiConfigTab
                settings={settings}
                geminiEnabled={geminiEnabled}
                onUpdateSettings={handleUpdateSettings}
              />
            )}

            {activeTab === 'simulator' && (
              <SimulatorTab
                botInfo={botInfo}
                rules={rules}
                initialInput={simulatorPreloadText}
                onRefreshScamReports={() => {
                  fetchScamReports();
                  fetchStatus();
                }}
              />
            )}

            {activeTab === 'setup' && (
              <BotSetupTab
                settings={settings}
                botInfo={botInfo}
                connected={connected}
                onConnectToken={handleConnectToken}
                onDisconnect={handleDisconnect}
                onSendBroadcast={handleSendBroadcast}
              />
            )}

            {activeTab === 'logs' && (
              <LogsTab
                logs={logs}
                onClearLogs={handleClearLogs}
                onRefresh={fetchLogs}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 py-4 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-300">TeleReply</span>
            <span>•</span>
            <span>Telegram Bot Auto-Reply Engine with Gemini 3.8 AI</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Server: Port 3000</span>
            <span>•</span>
            <span className="text-emerald-400 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1" />
              Engine Online
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
