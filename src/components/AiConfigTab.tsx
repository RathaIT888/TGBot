import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  BookOpen,
  Send,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  RefreshCw,
  FileText,
  Clock,
  Zap,
} from 'lucide-react';
import { BotSettings } from '../types';

interface AiConfigTabProps {
  settings: BotSettings;
  geminiEnabled: boolean;
  onUpdateSettings: (partial: Partial<BotSettings>) => Promise<void>;
}

export const AiConfigTab: React.FC<AiConfigTabProps> = ({
  settings,
  geminiEnabled,
  onUpdateSettings,
}) => {
  const [aiPersona, setAiPersona] = useState(settings.aiPersona);
  const [knowledgeBase, setKnowledgeBase] = useState(settings.knowledgeBase);
  const [fallbackToAI, setFallbackToAI] = useState(settings.fallbackToAI);
  const [defaultFallbackReply, setDefaultFallbackReply] = useState(settings.defaultFallbackReply);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Playground state
  const [testPrompt, setTestPrompt] = useState('');
  const [aiTestResponse, setAiTestResponse] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [testLatency, setTestLatency] = useState<number | null>(null);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await onUpdateSettings({
        aiPersona,
        knowledgeBase,
        fallbackToAI,
        defaultFallbackReply,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update AI settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestAiResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPrompt.trim()) return;

    setGenerating(true);
    setAiTestResponse(null);
    const start = Date.now();

    try {
      const res = await fetch('/api/bot/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testPrompt,
          senderName: 'Test Customer',
          username: 'test_user',
        }),
      });
      const data = await res.json();
      setAiTestResponse(data.replyText);
      setTestLatency(Date.now() - start);
    } catch (err) {
      console.error('AI test error:', err);
      setAiTestResponse('Error connecting to Gemini API test runner.');
    } finally {
      setGenerating(false);
    }
  };

  const setPersonaPreset = (presetText: string) => {
    setAiPersona(presetText);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
          <span>Gemini AI Persona & Knowledge Base</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Powered by gemini-3.8-flash
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Give your Telegram bot deep conversational intelligence by injecting your business facts, FAQs, and a custom persona.
        </p>
      </div>

      {/* Model & Architecture Overview */}
      <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 rounded-2xl p-5 border border-purple-500/30 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-inner">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-sm">Server-Side Gemini 3.8 Flash</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  Secure Backend Proxy
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Zero client exposure of API keys. Incoming Telegram webhook messages are synthesized in ~400ms.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Safety & Rate-limit Protected</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-md space-y-6">
            {/* Fallback to AI Toggle */}
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="font-semibold text-sm text-white">
                    Auto-Fallback to Gemini AI
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  When a user sends a message that doesn't match any keyword rule, let Gemini answer intelligently instead of returning an error or silence.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setFallbackToAI(!fallbackToAI)}
                className="p-1 text-slate-400 hover:text-white transition-colors"
              >
                {fallbackToAI ? (
                  <ToggleRight className="w-8 h-8 text-purple-400" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-600" />
                )}
              </button>
            </div>

            {/* AI Persona Prompt */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-white flex items-center space-x-2">
                  <Bot className="w-4 h-4 text-sky-400" />
                  <span>Bot Persona & Tone Guidelines</span>
                </label>
                <div className="flex items-center space-x-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400">Presets:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setPersonaPreset(
                        'You are a friendly, helpful, and concise customer support bot for TeleReply. Use clear bullet points and polite greetings.'
                      )
                    }
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-[10px] border border-slate-700"
                  >
                    Friendly Support
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPersonaPreset(
                        'You are a professional enterprise sales consultant bot. Answer precisely with pricing options and emphasize business ROI.'
                      )
                    }
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-[10px] border border-slate-700"
                  >
                    Enterprise Sales
                  </button>
                </div>
              </div>

              <textarea
                rows={3}
                value={aiPersona}
                onChange={(e) => setAiPersona(e.target.value)}
                placeholder="Instruct the model on its identity, tone, and behavioral constraints..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Tip: Instruct the bot to keep responses under 2 paragraphs and format lists with bullet points for easy mobile reading.
              </p>
            </div>

            {/* Knowledge Base */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-white flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>Company Knowledge Base & FAQs (Facts Grounding)</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {knowledgeBase.length} characters
                </span>
              </div>

              <textarea
                rows={8}
                value={knowledgeBase}
                onChange={(e) => setKnowledgeBase(e.target.value)}
                placeholder="Add your product pricing, return policy, delivery times, contact emails, store hours, and frequently asked questions..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Gemini uses this text as verified truth. If a customer asks something not in this text, it politely offers human agent handoff.
              </p>
            </div>

            {/* Default Static Fallback (When AI is disabled or off) */}
            <div>
              <label className="text-sm font-semibold text-white block mb-1.5">
                Static Fallback Reply (If AI disabled)
              </label>
              <input
                type="text"
                value={defaultFallbackReply}
                onChange={(e) => setDefaultFallbackReply(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              {savedSuccess ? (
                <span className="text-xs text-emerald-400 font-medium flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>AI Configuration Saved & Synced!</span>
                </span>
              ) : (
                <span className="text-xs text-slate-400">Settings update instantly for all incoming Telegram chats.</span>
              )}

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-purple-500/25 transition-all flex items-center space-x-2"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Save AI Settings</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live AI Sandbox Playground */}
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-semibold text-white">AI Response Playground</h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Ask anything to verify how Gemini 3.8 interprets your knowledge base and persona before live Telegram chats.
            </p>

            <form onSubmit={handleTestAiResponse} className="space-y-3">
              <div>
                <input
                  type="text"
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  placeholder="e.g. Can I get a refund if I cancel?"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-400">
                <span>Sample questions:</span>
                {[
                  'What are your refund terms?',
                  'How much does the Pro plan cost?',
                  'Are you open on Saturdays?',
                ].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setTestPrompt(q)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px]"
                  >
                    {q}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={generating || !testPrompt.trim()}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium text-xs shadow-md shadow-purple-600/25 transition-all flex items-center justify-center space-x-2"
              >
                {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Generate Test Reply</span>
              </button>
            </form>

            {/* Generated AI Response Output */}
            {aiTestResponse && (
              <div className="mt-4 p-4 rounded-xl bg-slate-800/90 border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-purple-300 flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gemini 3.8 Output:</span>
                  </span>
                  {testLatency && (
                    <span className="text-[10px] text-slate-400 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {testLatency}ms
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-200 whitespace-pre-wrap font-sans bg-slate-900/80 p-3 rounded-lg border border-slate-800 leading-relaxed">
                  {aiTestResponse}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Always adheres strictly to your Knowledge Base facts.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
