import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  RotateCcw,
  Check,
  CheckCheck,
  ExternalLink,
  Smartphone,
  Sliders,
  Clock,
  Zap,
  Info,
  ShieldAlert,
  Users,
  MessageSquare,
  AlertTriangle,
  Flag,
  CornerDownRight,
} from 'lucide-react';
import { AutoReplyRule, InlineButton, TelegramBotInfo } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'bot' | 'other_member';
  senderDisplayName?: string;
  senderUsername?: string;
  senderId?: number;
  text: string;
  photoUrl?: string;
  timestamp: Date;
  ruleName?: string;
  isAi?: boolean;
  buttons?: InlineButton[];
  latencyMs?: number;
  replyToMessage?: {
    senderName: string;
    text: string;
  };
}

interface SimulatorTabProps {
  botInfo: TelegramBotInfo | null;
  rules: AutoReplyRule[];
  initialInput?: string;
  onRefreshScamReports?: () => void;
}

export const SimulatorTab: React.FC<SimulatorTabProps> = ({
  botInfo,
  rules,
  initialInput = '',
  onRefreshScamReports,
}) => {
  const [chatMode, setChatMode] = useState<'private' | 'group'>('group');
  const [groupTitle, setGroupTitle] = useState('Crypto Community & Traders [Official]');
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'scam-msg-sample',
      sender: 'other_member',
      senderDisplayName: 'Tony (Toncoin Admin)',
      senderUsername: 'ton_admin_claim',
      senderId: 881923,
      text: '🔥 URGENT: Official 1,000 TON Airdrop is live! Connect your wallet at http://ton-gift-airdrop.xyz to validate node.',
      timestamp: new Date(Date.now() - 120000),
    },
    {
      id: 'welcome-init',
      sender: 'bot',
      text: '🚨 [SCAM SHIELD ALERT]\nAutomated threat detection: Known phishing domain detected (ton-gift-airdrop.xyz).\n\nNever enter your 12/24 recovery seed phrase. Reply with `/report` to alert group moderators.',
      photoUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
      timestamp: new Date(Date.now() - 110000),
      buttons: [
        { text: '🚨 File Scam Report', callbackData: '/report' },
        { text: '📜 Anti-Scam Rules', callbackData: '/rules' },
      ],
    },
  ]);

  const [inputText, setInputText] = useState(initialInput);
  const [isTyping, setIsTyping] = useState(false);
  const [senderName, setSenderName] = useState('Alex Rivers');
  const [username, setUsername] = useState('alexrivers');
  const [chatId, setChatId] = useState('-1001928374');
  const [showConfig, setShowConfig] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [activeReplyTo, setActiveReplyTo] = useState<Message | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (initialInput) {
      setInputText(initialInput);
    }
  }, [initialInput]);

  const handleSendMessage = async (textToSend?: string, forcedReplyTo?: Message) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const replyingTo = forcedReplyTo || activeReplyTo;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      senderDisplayName: senderName,
      senderUsername: username,
      text,
      timestamp: new Date(),
      replyToMessage: replyingTo
        ? {
            senderName: replyingTo.senderDisplayName || (replyingTo.sender === 'user' ? senderName : 'Member'),
            text: replyingTo.text,
          }
        : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setActiveReplyTo(null);
    setIsTyping(true);

    try {
      const payload: any = {
        text,
        senderName,
        username,
        chatId: chatMode === 'group' ? -1001928374 : chatId,
        groupTitle: chatMode === 'group' ? groupTitle : undefined,
      };

      if (replyingTo) {
        payload.replyToMessage = {
          messageId: 104,
          senderName: replyingTo.senderDisplayName || (replyingTo.sender === 'user' ? senderName : 'Member'),
          username: replyingTo.senderUsername,
          userId: replyingTo.senderId || 998822,
          text: replyingTo.text,
        };
      }

      const res = await fetch('/api/bot/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      // Refresh scam reports if a report was filed
      if (text.startsWith('/report') || text.startsWith('/scam')) {
        onRefreshScamReports?.();
      }

      const minDelay = data.isAiGenerated ? 300 : 250;
      await new Promise((resolve) => setTimeout(resolve, minDelay));

      const botReplyMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: data.replyText,
        photoUrl: data.photoUrl,
        timestamp: new Date(),
        ruleName: data.matchedRule?.name || (data.isAiGenerated ? 'Gemini AI Fallback' : 'Default Reply'),
        isAi: data.isAiGenerated,
        buttons: data.buttons,
        latencyMs: data.latencyMs,
      };

      setMessages((prev) => [...prev, botReplyMsg]);
    } catch (err) {
      console.error('Simulator error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: '⚠️ Simulator connection error. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSimulateScammerMessage = () => {
    const scamPhrases = [
      '⚡ Double your TON/USDT in 24 hours! Official VIP trading signals wa.me/19823912903',
      '🚨 Claim 1,000 Free Airdrop Tokens! Visit connect-wallet-claim-airdrop.xyz right now.',
      'Hello guys, I am Official Support Lead. DM me directly to verify your account or send $50 deposit.',
    ];
    const picked = scamPhrases[Math.floor(Math.random() * scamPhrases.length)];
    const scammerMsg: Message = {
      id: `scammer-${Date.now()}`,
      sender: 'other_member',
      senderDisplayName: 'Crypto VIP Support (Admin)',
      senderUsername: 'official_ton_support_fake',
      senderId: 771928,
      text: picked,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, scammerMsg]);
  };

  const handleReportSpecificMessage = (msg: Message) => {
    setActiveReplyTo(msg);
    handleSendMessage('/report asking for wallet connection / scam link', msg);
  };

  const handleButtonClick = (button: InlineButton) => {
    if (button.url) {
      window.open(button.url, '_blank', 'noreferrer');
    } else if (button.callbackData) {
      handleSendMessage(button.callbackData);
    } else {
      handleSendMessage(button.text);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'bot',
        text: chatMode === 'group'
          ? '👋 Telegram Group Simulator initialized. Bot is listening for /start, /report, keyword scam triggers, and group moderation rules!'
          : '👋 Chat session restarted. Send a message or command to test your auto-reply rules!',
        timestamp: new Date(),
        buttons: [
          { text: '🚀 /start', callbackData: '/start' },
          { text: '🚨 /report', callbackData: '/report' },
          { text: '📋 /menu', callbackData: '/menu' },
        ],
      },
    ]);
  };

  const botDisplayName = botInfo?.first_name || 'TeleReply Bot';
  const botHandle = botInfo?.username ? `@${botInfo.username}` : '@DemoAutoReplyBot';

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Telegram Web Simulator</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Interactive Testbed
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulate both <strong>Private Chats</strong> and <strong>Telegram Group Chats</strong> with scam reporting, reply-to-report, keyword warnings, and Gemini AI.
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {/* Chat Mode Switcher */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                setChatMode('group');
                setChatId('-1001928374');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium ${
                chatMode === 'group' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Telegram Group</span>
            </button>
            <button
              onClick={() => {
                setChatMode('private');
                setChatId('98765432');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium ${
                chatMode === 'private' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Private Chat</span>
            </button>
          </div>

          {chatMode === 'group' && (
            <button
              onClick={handleSimulateScammerMessage}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-medium transition-colors"
              title="Add a suspicious spam/scam message into the group chat"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Simulate Scammer Post</span>
            </button>
          )}

          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
              showConfig
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Props</span>
          </button>

          <button
            onClick={handleResetChat}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* User Props Configuration Banner (Collapsible) */}
      {showConfig && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Simulated User Full Name</label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Simulated Telegram Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Group / Chat Title</label>
            <input
              type="text"
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
            />
          </div>
        </div>
      )}

      {/* Telegram App Mockup Container */}
      <div className="max-w-2xl mx-auto rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[660px] relative">
        {/* Telegram Chat Header */}
        <div className="bg-[#17212b] px-4 py-3 border-b border-slate-800 flex items-center justify-between text-white z-10">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md ${
              chatMode === 'group'
                ? 'bg-gradient-to-tr from-purple-500 to-indigo-600'
                : 'bg-gradient-to-tr from-sky-400 to-blue-600'
            }`}>
              {chatMode === 'group' ? <Users className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-semibold text-sm">
                  {chatMode === 'group' ? groupTitle : botDisplayName}
                </span>
                {chatMode === 'group' ? (
                  <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[10px] font-semibold border border-purple-500/30">
                    Group (Supergroup)
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 text-[10px] font-medium">
                    bot
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                {chatMode === 'group' ? (
                  <span>3,420 members, 142 online • 🛡️ Bot is Group Admin</span>
                ) : (
                  <span>{botHandle} • Active 24/7</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
              Scam Shield On
            </span>
          </div>
        </div>

        {/* Telegram Chat Message History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#0e1621] scrollbar-thin scrollbar-thumb-slate-800">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isOther = msg.sender === 'other_member';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[88%] ${isUser ? 'ml-auto' : ''}`}
              >
                {/* Bubble Container */}
                <div
                  className={`rounded-2xl text-white shadow-md relative overflow-hidden transition-all group ${
                    isUser
                      ? 'bg-[#2b5278] rounded-br-none text-slate-100'
                      : isOther
                      ? 'bg-[#1e2a38] border border-red-500/30 rounded-bl-none text-slate-200'
                      : 'bg-[#182533] rounded-bl-none text-slate-200'
                  }`}
                >
                  {/* Poster image if provided */}
                  {msg.photoUrl && (
                    <div
                      className="cursor-pointer overflow-hidden max-h-56 bg-black/30 relative"
                      onClick={() => setLightboxImage(msg.photoUrl!)}
                    >
                      <img
                        src={msg.photoUrl}
                        alt="Bot reply poster"
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as any).src = 'https://placehold.co/600x320?text=Poster+Attachment';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                        🔍 Click to view full poster
                      </div>
                    </div>
                  )}

                  <div className={!isUser && msg.photoUrl ? 'p-3.5' : 'px-4 py-2.5'}>
                    {/* Replying quote badge if present */}
                    {msg.replyToMessage && (
                      <div className="mb-2 p-2 rounded-lg bg-black/25 border-l-2 border-sky-400 text-[11px] font-sans">
                        <span className="font-semibold text-sky-300 block">{msg.replyToMessage.senderName}</span>
                        <span className="text-slate-300 line-clamp-1 italic">"{msg.replyToMessage.text}"</span>
                      </div>
                    )}

                    {/* Sender name for group members or bot */}
                    {!isUser && (
                      <div className="text-[11px] font-semibold mb-1 flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-1.5">
                          <span className={isOther ? 'text-amber-400' : 'text-sky-400'}>
                            {isOther ? `${msg.senderDisplayName} (@${msg.senderUsername})` : botDisplayName}
                          </span>
                          {isOther && (
                            <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                              Member
                            </span>
                          )}
                          {msg.isAi && (
                            <span className="flex items-center text-[10px] text-purple-300 bg-purple-900/40 px-1.5 py-0.2 rounded border border-purple-500/30">
                              <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                              Gemini 3.8
                            </span>
                          )}
                        </div>

                        {/* Reply / Report button for other members */}
                        {isOther && (
                          <button
                            onClick={() => handleReportSpecificMessage(msg)}
                            className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/40 flex items-center space-x-1"
                            title="Reply to this message with /report"
                          >
                            <Flag className="w-2.5 h-2.5" />
                            <span>Report Scam</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Message Text with newlines */}
                    <div className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed">{msg.text}</div>

                    {/* Timestamp & Read Checkmarks */}
                    <div className="flex items-center justify-end space-x-1 mt-1 text-[10px] text-slate-400">
                      <span>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isUser && <CheckCheck className="w-3.5 h-3.5 text-sky-400 inline" />}
                    </div>
                  </div>
                </div>

                {/* Match Metadata Pill */}
                {!isUser && msg.ruleName && (
                  <div className="mt-1 flex items-center space-x-1.5 text-[10px] text-slate-400 px-1">
                    <Zap className="w-3 h-3 text-sky-400" />
                    <span>Rule: {msg.ruleName}</span>
                    {msg.latencyMs !== undefined && (
                      <span className="text-slate-400 font-mono">({msg.latencyMs}ms)</span>
                    )}
                  </div>
                )}

                {/* Interactive Inline Buttons */}
                {!isUser && msg.buttons && msg.buttons.length > 0 && (
                  <div className="mt-2 w-full grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {msg.buttons.map((btn, bIdx) => (
                      <button
                        key={bIdx}
                        onClick={() => handleButtonClick(btn)}
                        className="px-3 py-2 rounded-xl bg-[#242f3d] hover:bg-[#2e3b4d] active:scale-95 text-slate-200 border border-slate-700/60 text-xs font-medium flex items-center justify-center space-x-1.5 shadow-sm transition-all"
                      >
                        <span>{btn.text}</span>
                        {btn.url && <ExternalLink className="w-3 h-3 text-sky-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center space-x-2 text-slate-400 text-xs bg-[#182533] px-3 py-2 rounded-2xl max-w-[140px] border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] text-slate-400 ml-1">replying...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Active Reply Banner if replying to a message */}
        {activeReplyTo && (
          <div className="bg-[#1e2a38] px-4 py-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center space-x-2 truncate">
              <CornerDownRight className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
              <span className="font-semibold text-sky-300">Replying to {activeReplyTo.senderDisplayName}:</span>
              <span className="truncate italic text-slate-400">"{activeReplyTo.text}"</span>
            </div>
            <button
              onClick={() => setActiveReplyTo(null)}
              className="text-slate-400 hover:text-white ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Quick Suggestion Chips */}
        <div className="bg-[#17212b] px-3 py-2 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mr-1 flex-shrink-0">
            Test:
          </span>

          <button
            onClick={() => handleSendMessage('/report')}
            className="px-2.5 py-1 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-[11px] whitespace-nowrap font-semibold flex items-center space-x-1"
          >
            <span>🚨 /report (Guide)</span>
          </button>

          <button
            onClick={() => handleSendMessage('/report @ton_admin_claim asking for wallet connection in DM')}
            className="px-2.5 py-1 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-[11px] whitespace-nowrap flex items-center space-x-1"
          >
            <span>🚨 Report Scammer</span>
          </button>

          <button
            onClick={() => handleSendMessage('/reportgroup https://t.me/fake_ton_giveaways Fake Airdrop Clone')}
            className="px-2.5 py-1 rounded-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-[11px] whitespace-nowrap flex items-center space-x-1"
          >
            <span>🚨 Report Group</span>
          </button>

          <button
            onClick={() => handleSendMessage('/start')}
            className="px-3 py-1 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold border border-sky-400/40 text-[11px] whitespace-nowrap shadow-sm transition-all flex items-center space-x-1"
          >
            <span>🚀 /start</span>
          </button>

          <button
            onClick={() => handleSendMessage('poster')}
            className="px-2.5 py-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] whitespace-nowrap transition-colors flex items-center space-x-1"
          >
            <span>🖼️ Promo Poster</span>
          </button>

          {['/menu', 'pricing', 'order status', 'hours', 'seed phrase airdrop claim'].map((cmd) => (
            <button
              key={cmd}
              onClick={() => handleSendMessage(cmd)}
              className="px-2.5 py-1 rounded-full bg-[#242f3d] hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 border border-slate-700 text-[11px] whitespace-nowrap transition-colors"
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="bg-[#17212b] p-3 border-t border-slate-800 flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              chatMode === 'group'
                ? 'Type in group (e.g. /report @username [reason], or reply to a message)...'
                : 'Write a message to test auto-reply...'
            }
            className="flex-1 bg-[#242f3d] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isTyping}
            className="w-10 h-10 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white flex items-center justify-center shadow-md shadow-sky-500/25 transition-all transform active:scale-95 flex-shrink-0"
          >
            <Send className="w-4 h-4 -rotate-12 translate-x-[-1px] translate-y-[-1px]" />
          </button>
        </div>
      </div>

      {/* Lightbox Modal for Poster Zoom */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl border border-slate-700 shadow-2xl">
            <img
              src={lightboxImage}
              alt="Full-size poster"
              className="w-full h-full object-contain max-h-[80vh]"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/70 hover:bg-black text-white text-xs font-bold"
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
