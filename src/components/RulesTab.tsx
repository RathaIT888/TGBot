import React, { useState, useRef } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Bot,
  Search,
  ExternalLink,
  Code,
  Tag,
  AlertCircle,
  HelpCircle,
  Layers,
  ArrowRight,
  X,
  Check,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';
import { AutoReplyRule, TriggerType, InlineButton } from '../types';

interface RulesTabProps {
  rules: AutoReplyRule[];
  onSaveRule: (rule: AutoReplyRule) => Promise<void>;
  onDeleteRule: (id: string) => Promise<void>;
  onTestRuleInSimulator: (sampleText: string) => void;
  onLoadPreset: (preset: string) => void;
}

export const RulesTab: React.FC<RulesTabProps> = ({
  rules,
  onSaveRule,
  onDeleteRule,
  onTestRuleInSimulator,
  onLoadPreset,
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [editingRule, setEditingRule] = useState<AutoReplyRule | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal form states
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState<TriggerType>('contains');
  const [patternInput, setPatternInput] = useState('');
  const [patterns, setPatterns] = useState<string[]>([]);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [useAI, setUseAI] = useState(false);
  const [aiPromptModifier, setAiPromptModifier] = useState('');
  const [priority, setPriority] = useState(50);
  const [buttons, setButtons] = useState<InlineButton[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Temp button state
  const [newBtnText, setNewBtnText] = useState('');
  const [newBtnUrl, setNewBtnUrl] = useState('');
  const [newBtnCb, setNewBtnCb] = useState('');

  const openNewRuleModal = () => {
    setEditingRule(null);
    setName('');
    setTriggerType('contains');
    setPatternInput('');
    setPatterns([]);
    setCaseSensitive(false);
    setReplyText('');
    setPhotoUrl('');
    setUseAI(false);
    setAiPromptModifier('');
    setPriority((rules.length + 1) * 10);
    setButtons([]);
    setIsModalOpen(true);
  };

  const openEditModal = (rule: AutoReplyRule) => {
    setEditingRule(rule);
    setName(rule.name);
    setTriggerType(rule.triggerType);
    setPatternInput('');
    setPatterns([...rule.patterns]);
    setCaseSensitive(Boolean(rule.caseSensitive));
    setReplyText(rule.replyText);
    setPhotoUrl(rule.photoUrl || '');
    setUseAI(Boolean(rule.useAI));
    setAiPromptModifier(rule.aiPromptModifier || '');
    setPriority(rule.priority || 50);
    setButtons(rule.buttons ? [...rule.buttons] : []);
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Image file size must be less than 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setPhotoUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddPattern = (e?: React.KeyboardEvent) => {
    if (e && e.key !== 'Enter' && e.key !== ',') return;
    if (e) e.preventDefault();

    const trimmed = patternInput.trim().replace(/^,|,$/g, '');
    if (trimmed && !patterns.includes(trimmed)) {
      setPatterns([...patterns, trimmed]);
      setPatternInput('');
    }
  };

  const handleRemovePattern = (pat: string) => {
    setPatterns(patterns.filter((p) => p !== pat));
  };

  const handleAddButton = () => {
    if (!newBtnText.trim()) return;
    setButtons([
      ...buttons,
      {
        text: newBtnText.trim(),
        url: newBtnUrl.trim() || undefined,
        callbackData: newBtnCb.trim() || undefined,
      },
    ]);
    setNewBtnText('');
    setNewBtnUrl('');
    setNewBtnCb('');
  };

  const handleRemoveButton = (idx: number) => {
    setButtons(buttons.filter((_, i) => i !== idx));
  };

  const handleInsertVariable = (variable: string) => {
    setReplyText((prev) => prev + variable);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let finalPatterns = [...patterns];
    if (patternInput.trim() && !finalPatterns.includes(patternInput.trim())) {
      finalPatterns.push(patternInput.trim());
    }

    if (finalPatterns.length === 0 && triggerType !== 'welcome') {
      alert('Please add at least one trigger pattern or keyword.');
      return;
    }

    if (triggerType === 'welcome' && finalPatterns.length === 0) {
      finalPatterns = ['/start'];
    }

    setSaving(true);
    try {
      const ruleToSave: AutoReplyRule = {
        id: editingRule?.id || `rule-${Date.now()}`,
        name: name.trim(),
        enabled: editingRule ? editingRule.enabled : true,
        triggerType,
        patterns: finalPatterns,
        caseSensitive,
        replyText: replyText.trim(),
        useAI,
        aiPromptModifier: aiPromptModifier.trim(),
        photoUrl: photoUrl.trim() || undefined,
        priority,
        buttons: buttons.length > 0 ? buttons : undefined,
        matchCount: editingRule?.matchCount || 0,
        lastTriggeredAt: editingRule?.lastTriggeredAt || null,
      };

      await onSaveRule(ruleToSave);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving rule:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRule = async (rule: AutoReplyRule) => {
    await onSaveRule({
      ...rule,
      enabled: !rule.enabled,
    });
  };

  const filteredRules = rules.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.patterns.some((p) => p.toLowerCase().includes(search.toLowerCase())) ||
      r.replyText.toLowerCase().includes(search.toLowerCase());

    const matchesType = filterType === 'all' || r.triggerType === filterType;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Auto-Reply Rules Manager</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
              {rules.length} configured
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure exact match, keyword triggers, regex patterns, or smart Gemini AI routing for incoming chats.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={openNewRuleModal}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-medium text-xs shadow-lg shadow-sky-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Rule</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rules by title, keyword, or text..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 hidden md:inline">Trigger Type:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="all">All Triggers</option>
            <option value="welcome">Welcome (/start)</option>
            <option value="exact">Exact Match</option>
            <option value="contains">Contains Keyword</option>
            <option value="startsWith">Starts With</option>
            <option value="regex">Regular Expression</option>
          </select>
        </div>
      </div>

      {/* Rules List Grid */}
      <div className="space-y-3">
        {filteredRules.map((rule) => (
          <div
            key={rule.id}
            className={`p-5 rounded-2xl border transition-all ${
              rule.enabled
                ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-md'
                : 'bg-slate-900/40 border-slate-800/50 opacity-60'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                {/* Title & Badges */}
                <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                  <h3 className="font-semibold text-sm text-white">{rule.name}</h3>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                      rule.triggerType === 'welcome'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : rule.triggerType === 'regex'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : rule.triggerType === 'startsWith'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    }`}
                  >
                    {rule.triggerType}
                  </span>

                  {rule.useAI && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      <span>Gemini AI Driven</span>
                    </span>
                  )}

                  {rule.photoUrl && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                      <ImageIcon className="w-3 h-3 text-emerald-400" />
                      <span>Poster Attached</span>
                    </span>
                  )}

                  <span className="text-[11px] text-slate-400">
                    Priority #{rule.priority || 50}
                  </span>
                </div>

                {/* Patterns Tags */}
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="text-slate-400 text-[11px]">Triggers on:</span>
                  {rule.patterns.map((pat, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-800 text-sky-300 font-mono text-[11px] border border-slate-700"
                    >
                      {pat}
                    </span>
                  ))}
                </div>

                {/* Poster & Reply Preview */}
                <div className="mt-2 flex flex-col sm:flex-row gap-3 items-start">
                  {rule.photoUrl && (
                    <div className="w-24 h-16 rounded-xl overflow-hidden border border-slate-700 bg-slate-850 flex-shrink-0 relative shadow-sm">
                      <img src={rule.photoUrl} alt="Poster" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex-1 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 whitespace-pre-wrap font-sans max-h-24 overflow-y-auto w-full">
                    {rule.useAI ? (
                      <div className="italic text-purple-300 flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          AI dynamically generates answer using knowledge base and guideline: "
                          {rule.aiPromptModifier || 'Standard Tone'}"
                        </span>
                      </div>
                    ) : (
                      rule.replyText
                    )}
                  </div>
                </div>

                {/* Inline Buttons Preview */}
                {rule.buttons && rule.buttons.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-[11px] text-slate-400">Buttons:</span>
                    {rule.buttons.map((b, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700 flex items-center space-x-1"
                      >
                        <span>{b.text}</span>
                        {b.url && <ExternalLink className="w-2.5 h-2.5 text-sky-400" />}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Controls */}
              <div className="flex items-center space-x-3 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                <div className="text-right hidden sm:block text-[11px] text-slate-400">
                  <div>{rule.matchCount || 0} matches</div>
                  {rule.lastTriggeredAt && (
                    <div className="text-[10px] text-slate-400">
                      Last: {new Date(rule.lastTriggeredAt).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Test in Simulator Button */}
                <button
                  onClick={() => onTestRuleInSimulator(rule.patterns[0] || '/start')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                  title="Test in Simulator"
                >
                  Test
                </button>

                {/* Toggle Status */}
                <button
                  onClick={() => handleToggleRule(rule)}
                  className={`p-1 text-slate-400 hover:text-white transition-colors`}
                  title={rule.enabled ? 'Disable Rule' : 'Enable Rule'}
                >
                  {rule.enabled ? (
                    <ToggleRight className="w-7 h-7 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-slate-600" />
                  )}
                </button>

                {/* Edit Button */}
                <button
                  onClick={() => openEditModal(rule)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Edit Rule"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete rule "${rule.name}"?`)) {
                      onDeleteRule(rule.id);
                    }
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                  title="Delete Rule"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredRules.length === 0 && (
          <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-300">No auto-reply rules match your search.</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting filters or create a new rule.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">
                {editingRule ? 'Edit Auto-Reply Rule' : 'Create New Auto-Reply Rule'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5 text-xs">
              {/* Rule Name */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Rule Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 💎 Pricing Inquiry, 🚚 Track Shipping"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Trigger Type & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Trigger Matching Type *
                  </label>
                  <select
                    value={triggerType}
                    onChange={(e) => setTriggerType(e.target.value as TriggerType)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="contains">Contains Keyword (Flexible)</option>
                    <option value="exact">Exact Match</option>
                    <option value="startsWith">Starts With</option>
                    <option value="command">Bot Command (/command)</option>
                    <option value="welcome">Welcome Message (/start)</option>
                    <option value="regex">Regular Expression (Regex)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Evaluation Priority (Lowest runs first)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={priority}
                    onChange={(e) => setPriority(parseInt(e.target.value, 10) || 50)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Keywords / Patterns Input */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Trigger Keywords or Patterns *
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={patternInput}
                    onChange={(e) => setPatternInput(e.target.value)}
                    onKeyDown={handleAddPattern}
                    placeholder="Type keyword and press Enter or click Add (e.g. price, harga, cost)..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddPattern()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold rounded-xl border border-slate-700"
                  >
                    Add
                  </button>
                </div>

                {/* Pattern Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {patterns.map((pat, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-mono flex items-center space-x-1"
                    >
                      <span>{pat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePattern(pat)}
                        className="text-sky-400 hover:text-red-400 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {patterns.length === 0 && (
                    <span className="text-slate-400 italic">No patterns added yet.</span>
                  )}
                </div>
              </div>

              {/* Response Mode Selector (Static vs AI) */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="font-semibold text-white">Use Gemini AI Auto-Reply</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseAI(!useAI)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    {useAI ? (
                      <ToggleRight className="w-7 h-7 text-purple-400" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-slate-600" />
                    )}
                  </button>
                </div>
                <p className="text-slate-400 text-[11px]">
                  When enabled, Gemini 3.8 dynamically formulates the answer instead of sending fixed static text.
                </p>

                {useAI && (
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Custom AI Guideline for this Rule
                    </label>
                    <input
                      type="text"
                      value={aiPromptModifier}
                      onChange={(e) => setAiPromptModifier(e.target.value)}
                      placeholder="e.g. Focus on reassuring the customer about our 14-day refund guarantee."
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                )}
              </div>

              {/* Static Text Reply Area */}
              {!useAI && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-300 font-semibold">
                      Auto-Reply Message Text *
                    </label>
                    {/* Variables Helper */}
                    <div className="flex items-center space-x-1 flex-wrap">
                      <span className="text-[10px] text-slate-400 mr-1">Insert tag:</span>
                      {['{first_name}', '{username}', '{chat_id}', '{time}', '{date}'].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => handleInsertVariable(v)}
                          className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 font-mono text-[10px] border border-slate-700"
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={4}
                    required={!useAI}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type the message description or photo caption your bot sends back..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 font-sans"
                  />
                  {photoUrl && (
                    <p className="text-[11px] text-sky-400 mt-1 flex items-center space-x-1">
                      <span>ℹ️ This text will be delivered as the official Telegram photo caption/description.</span>
                    </p>
                  )}
                </div>
              )}

              {/* Poster / Banner Attachment Section */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-white">Poster / Photo Attachment (Telegram sendPhoto)</span>
                  </div>
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="text-[11px] text-red-400 hover:text-red-300 font-medium"
                    >
                      Remove Poster
                    </button>
                  )}
                </div>

                <p className="text-slate-400 text-[11px]">
                  Attach a visual banner or poster. Telegram will send it as a rich photo card with your description caption and inline buttons.
                </p>

                {/* Upload or URL Row */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-sky-400" />
                      <span>Upload Image File</span>
                    </button>

                    <input
                      type="text"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder="Or paste public image / poster URL (https://...)"
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 font-mono"
                    />
                  </div>

                  {/* Sample Poster Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-400 pt-1">
                    <span>Sample posters:</span>
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-[10px]"
                    >
                      🚀 Modern Welcome
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=80')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[10px]"
                    >
                      🛍️ Flash Sale Promo
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('https://images.unsplash.com/photo-1534536281715-e28d76689b4d?w=800&auto=format&fit=crop&q=80')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-[10px]"
                    >
                      🎧 24/7 Support Desk
                    </button>
                  </div>

                  {/* Live Poster Thumbnail Preview */}
                  {photoUrl && (
                    <div className="mt-2.5 p-2 rounded-xl bg-slate-900 border border-slate-700 flex items-center space-x-3">
                      <div className="w-20 h-16 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 flex-shrink-0">
                        <img
                          src={photoUrl}
                          alt="Poster preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as any).src = 'https://placehold.co/400x300?text=Invalid+Image+URL';
                          }}
                        />
                      </div>
                      <div className="text-xs space-y-0.5 flex-1 min-w-0">
                        <span className="font-semibold text-white block">Poster Attached</span>
                        <span className="text-slate-400 text-[10px] truncate block font-mono">
                          {photoUrl.startsWith('data:') ? 'Local Image File (Base64)' : photoUrl}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Interactive Telegram Buttons Builder */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Telegram Inline Keyboard Buttons (Optional)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                  <input
                    type="text"
                    value={newBtnText}
                    onChange={(e) => setNewBtnText(e.target.value)}
                    placeholder="Button Label (e.g. Visit Store)"
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500"
                  />
                  <input
                    type="url"
                    value={newBtnUrl}
                    onChange={(e) => setNewBtnUrl(e.target.value)}
                    placeholder="URL Link (https://...)"
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newBtnCb}
                      onChange={(e) => setNewBtnCb(e.target.value)}
                      placeholder="Or Callback Data"
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddButton}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 font-medium rounded-lg border border-slate-700"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Buttons List */}
                <div className="space-y-1.5">
                  {buttons.map((btn, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white">{btn.text}</span>
                        {btn.url && <span className="text-sky-400 truncate max-w-xs">{btn.url}</span>}
                        {btn.callbackData && (
                          <span className="text-amber-400 font-mono text-[10px]">
                            data: {btn.callbackData}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveButton(idx)}
                        className="text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-medium shadow-lg shadow-sky-500/25 transition-all flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingRule ? 'Save Changes' : 'Create Rule'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
