import React, { useState } from 'react';
import {
  Radio,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Send,
  RefreshCw,
  LogOut,
  HelpCircle,
  Bot,
  Zap,
} from 'lucide-react';
import { BotSettings, TelegramBotInfo } from '../types';

interface BotSetupTabProps {
  settings: BotSettings;
  botInfo: TelegramBotInfo | null;
  connected: boolean;
  onConnectToken: (token: string, mode: BotSettings['mode']) => Promise<{ success: boolean; error?: string }>;
  onDisconnect: () => Promise<void>;
  onSendBroadcast: (chatId: string, message: string) => Promise<{ success: boolean; error?: string }>;
}

export const BotSetupTab: React.FC<BotSetupTabProps> = ({
  settings,
  botInfo,
  connected,
  onConnectToken,
  onDisconnect,
  onSendBroadcast,
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [selectedMode, setSelectedMode] = useState<BotSettings['mode']>(settings.mode || 'polling');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Broadcast state
  const [broadcastChatId, setBroadcastChatId] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setConnecting(true);
    setConnectError(null);

    const res = await onConnectToken(tokenInput.trim(), selectedMode);
    if (!res.success) {
      setConnectError(res.error || 'Failed to verify bot token. Please check format.');
    } else {
      setTokenInput('');
    }
    setConnecting(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastChatId.trim() || !broadcastMsg.trim()) return;

    setSendingBroadcast(true);
    setBroadcastStatus(null);

    const res = await onSendBroadcast(broadcastChatId.trim(), broadcastMsg.trim());
    if (res.success) {
      setBroadcastStatus({ success: true, message: 'Message successfully sent to Telegram!' });
      setBroadcastMsg('');
    } else {
      setBroadcastStatus({ success: false, message: res.error || 'Failed to send message.' });
    }
    setSendingBroadcast(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
          <span>Telegram Bot Connection & Diagnostics</span>
          {connected ? (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Active Connection
            </span>
          ) : (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Token Required for Live Chats
            </span>
          )}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Connect your Telegram Bot Token to automatically reply to real Telegram users, or use Long Polling for 100% reliable background reception.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Token Management Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-md">
            <h2 className="text-base font-bold text-white mb-1 flex items-center space-x-2">
              <Key className="w-5 h-5 text-sky-400" />
              <span>{connected ? 'Active Telegram Bot' : 'Connect Your Telegram Bot'}</span>
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Paste the HTTP API Token you received from Telegram's official <span className="text-sky-400 font-mono">@BotFather</span>.
            </p>

            {connected && botInfo ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-800/80 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      <Bot className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-white">{botInfo.first_name}</span>
                        <span className="text-xs text-slate-400 font-mono">(@{botInfo.username})</span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                        <span>Bot ID: <span className="font-mono text-slate-300">{botInfo.id}</span></span>
                        <span>•</span>
                        <span className="capitalize text-emerald-400 font-semibold">{settings.mode} Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <a
                      href={`https://t.me/${botInfo.username}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-medium border border-sky-500/30 flex items-center space-x-1.5 transition-colors"
                    >
                      <span>Open Telegram</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={onDisconnect}
                      className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium border border-red-500/30 flex items-center space-x-1.5 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Disconnect</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <span className="text-slate-400 block mb-1">Active Receiving Mode:</span>
                    <span className="font-semibold text-white uppercase">{settings.mode}</span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {settings.mode === 'polling'
                        ? 'Continuously fetches updates without needing external inbound ports.'
                        : 'Listens for push updates from Telegram Webhook.'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <span className="text-slate-400 block mb-1">Webhook URL:</span>
                    <span className="font-mono text-sky-400 truncate block text-[11px]">
                      {settings.webhookUrl || 'Not configured (using Polling)'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConnect} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Telegram Bot Token *
                  </label>
                  <input
                    type="password"
                    required
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="e.g. 7123456789:AAHk..._sample_token"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Your token is stored safely in memory on your private backend server.
                  </p>
                </div>

                {/* Receiving Mode Option */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Update Ingestion Mode
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      onClick={() => setSelectedMode('polling')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedMode === 'polling'
                          ? 'bg-sky-500/10 border-sky-500/50 text-white'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-white">🔄 Long Polling (Recommended)</span>
                        <input
                          type="radio"
                          name="mode"
                          checked={selectedMode === 'polling'}
                          onChange={() => setSelectedMode('polling')}
                          className="text-sky-500"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Zero firewall or SSL requirements. Connects instantly and receives chats immediately.
                      </p>
                    </label>

                    <label
                      onClick={() => setSelectedMode('webhook')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedMode === 'webhook'
                          ? 'bg-sky-500/10 border-sky-500/50 text-white'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-white">📡 Webhook Push</span>
                        <input
                          type="radio"
                          name="mode"
                          checked={selectedMode === 'webhook'}
                          onChange={() => setSelectedMode('webhook')}
                          className="text-sky-500"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Telegram servers push updates via POST to /api/telegram/webhook.
                      </p>
                    </label>
                  </div>
                </div>

                {connectError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span>{connectError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={connecting || !tokenInput.trim()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center space-x-2"
                >
                  {connecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Verify Token & Activate Bot</span>
                </button>
              </form>
            )}
          </div>

          {/* Direct Message / Broadcast Tool */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-md">
            <h2 className="text-base font-bold text-white mb-1 flex items-center space-x-2">
              <Send className="w-5 h-5 text-sky-400" />
              <span>Direct Telegram Message Tester</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Send a real message from your bot to any user or group chat ID on Telegram to test outbound delivery.
            </p>

            <form onSubmit={handleBroadcast} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Destination Chat ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={broadcastChatId}
                    onChange={(e) => setBroadcastChatId(e.target.value)}
                    placeholder="e.g. 12345678"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Message Content *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={broadcastMsg}
                      onChange={(e) => setBroadcastMsg(e.target.value)}
                      placeholder="e.g. Hello from TeleReply Auto-Responder!"
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500"
                    />
                    <button
                      type="submit"
                      disabled={sendingBroadcast || !connected || !broadcastChatId.trim() || !broadcastMsg.trim()}
                      className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-medium text-xs flex items-center space-x-1.5 shadow-md shadow-sky-500/20"
                    >
                      {sendingBroadcast ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Send</span>
                    </button>
                  </div>
                </div>
              </div>

              {!connected && (
                <p className="text-[11px] text-amber-400 flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Connect your Bot Token above to enable real Telegram message delivery.</span>
                </p>
              )}

              {broadcastStatus && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
                    broadcastStatus.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}
                >
                  {broadcastStatus.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>{broadcastStatus.message}</span>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Step-by-Step BotFather Guide Card */}
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Bot className="w-5 h-5 text-sky-400" />
              <h2 className="text-base font-bold text-white">How to Get a Bot Token</h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Creating a Telegram bot is completely free and takes under 60 seconds with Telegram's official BotFather.
            </p>

            <div className="space-y-3.5 text-xs">
              {/* Step 1 */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between font-semibold text-white">
                  <span>1. Open @BotFather</span>
                  <a
                    href="https://t.me/BotFather"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-400 hover:text-sky-300 flex items-center space-x-1 text-[11px]"
                  >
                    <span>Open Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Click the official Telegram link above or search <span className="text-slate-200">@BotFather</span> in your Telegram app.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <div className="font-semibold text-white">2. Create New Bot</div>
                <p className="text-slate-400 text-[11px]">
                  Send the <span className="text-sky-300 font-mono">/newbot</span> command:
                </p>
                <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg font-mono text-[11px] text-sky-300 border border-slate-800">
                  <span>/newbot</span>
                  <button
                    onClick={() => handleCopy('/newbot')}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedCmd === '/newbot' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <div className="font-semibold text-white">3. Set Bot Name & Username</div>
                <p className="text-slate-400 text-[11px]">
                  Choose a display name (e.g. <span className="text-slate-200">Customer Support</span>) and a unique username ending with <span className="text-slate-200">bot</span> (e.g. <span className="text-slate-200">acme_support_bot</span>).
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <div className="font-semibold text-white">4. Copy Token & Paste Here</div>
                <p className="text-slate-400 text-[11px]">
                  BotFather will reply with your HTTP API token:
                  <span className="block mt-1 font-mono text-slate-300 text-[10px] bg-slate-900 p-1.5 rounded border border-slate-800">
                    123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Ready to use immediately once connected!</span>
          </div>
        </div>
      </div>
    </div>
  );
};
