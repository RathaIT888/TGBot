import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  UserX,
  CheckCircle,
  XCircle,
  Trash2,
  Send,
  Plus,
  Search,
  Filter,
  ExternalLink,
  ShieldCheck,
  Sliders,
  Copy,
  Check,
  Sparkles,
  Info,
  Radio,
  Download,
  BookOpen,
  FileText,
  Users,
  MessageSquare,
  Flame,
} from 'lucide-react';
import { BotSettings, ScamReport } from '../types';

interface ScamReportsTabProps {
  scamReports: ScamReport[];
  settings: BotSettings;
  onUpdateSettings: (partial: Partial<BotSettings>) => Promise<void>;
  onRefresh: () => void;
  onTestInSimulator: (text: string) => void;
}

export const ScamReportsTab: React.FC<ScamReportsTabProps> = ({
  scamReports,
  settings,
  onUpdateSettings,
  onRefresh,
  onTestInSimulator,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // File Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [scammerTarget, setScammerTarget] = useState('');
  const [scamLinkOrChannel, setScamLinkOrChannel] = useState('');
  const [scamCategory, setScamCategory] = useState<ScamReport['scamType']>('phishing');
  const [groupTitle, setGroupTitle] = useState('');
  const [evidenceText, setEvidenceText] = useState('');
  const [evidencePhotoUrl, setEvidencePhotoUrl] = useState('');
  const [severity, setSeverity] = useState<ScamReport['severity']>('high');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [aiPreview, setAiPreview] = useState<{
    threatScore: number;
    detectedTactic: string;
    riskSummary: string;
    recommendation: string;
  } | null>(null);

  // Abuse Guide Modal State
  const [isAbuseGuideOpen, setIsAbuseGuideOpen] = useState(false);
  const [selectedReportForAbuse, setSelectedReportForAbuse] = useState<ScamReport | null>(null);

  // Settings Modal State
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [scamKeywords, setScamKeywords] = useState<string[]>(
    settings.scamShield?.scamKeywords || [
      'seed phrase',
      'private key',
      'connect wallet',
      'airdrop claim',
      'validation node',
      'guaranteed profit',
      'double your crypto',
      'wa.me/',
      't.me/fake',
      'free ton gift',
    ]
  );
  const [newKeyword, setNewKeyword] = useState('');
  const [autoWarnInGroups, setAutoWarnInGroups] = useState(
    settings.scamShield?.autoWarnInGroups ?? true
  );
  const [autoDeleteMessages, setAutoDeleteMessages] = useState(
    settings.scamShield?.autoDeleteScamMessages ?? false
  );
  const [adminAlertChatId, setAdminAlertChatId] = useState(
    settings.scamShield?.adminAlertChatId || ''
  );
  const [savingSettings, setSavingSettings] = useState(false);

  // Filtering reports
  const filteredReports = scamReports.filter((report) => {
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesType = typeFilter === 'all' || report.scamType === typeFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      report.evidenceText.toLowerCase().includes(query) ||
      (report.scammerUsername && report.scammerUsername.toLowerCase().includes(query)) ||
      (report.scammerName && report.scammerName.toLowerCase().includes(query)) ||
      (report.groupTitle && report.groupTitle.toLowerCase().includes(query)) ||
      (report.scamLinkOrChannel && report.scamLinkOrChannel.toLowerCase().includes(query)) ||
      report.reporterName.toLowerCase().includes(query);

    return matchesStatus && matchesType && matchesSearch;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAnalyzeWithAI = async () => {
    if (!evidenceText.trim()) return;
    setAnalyzingAi(true);
    try {
      const res = await fetch('/api/scam-reports/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evidenceText: evidenceText.trim(),
          groupTitle: groupTitle.trim(),
          scammerName: scammerTarget.trim() || scamLinkOrChannel.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setAiPreview(data.analysis);
        if (data.analysis.threatScore >= 80) {
          setSeverity('critical');
        } else if (data.analysis.threatScore >= 50) {
          setSeverity('high');
        }
      }
    } catch (err) {
      console.error('AI analysis error:', err);
    } finally {
      setAnalyzingAi(false);
    }
  };

  const handleModerateAction = async (
    action: 'ban' | 'unban' | 'delete_msg' | 'warn_group',
    report: ScamReport
  ) => {
    try {
      const res = await fetch('/api/scam-reports/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reportId: report.id,
          chatId: report.chatId,
          userId: report.scammerId,
          messageId: report.messageId,
          warningMessage: `⚠️ [MODERATOR SCAM WARNING] Member ${
            report.scammerUsername ? `@${report.scammerUsername}` : report.scammerName
          } has been reported for ${report.scamType.replace('_', ' ')} fraud. Never send funds or share your recovery phrase!`,
        }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Moderation action failed:', err);
    }
  };

  const handleUpdateStatus = async (reportId: string, status: ScamReport['status']) => {
    try {
      const res = await fetch(`/api/scam-reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Update status failed:', err);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this scam report?')) return;
    try {
      const res = await fetch(`/api/scam-reports/${reportId}`, { method: 'DELETE' });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Delete report failed:', err);
    }
  };

  const handleFileReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceText.trim()) return;

    setSubmittingReport(true);
    try {
      const res = await fetch('/api/scam-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scammerName: scammerTarget.trim() || scamLinkOrChannel.trim() || 'Reported Entity',
          scammerUsername: scammerTarget.startsWith('@')
            ? scammerTarget.replace('@', '').trim()
            : undefined,
          scamLinkOrChannel: scamLinkOrChannel.trim() || undefined,
          scamType: scamCategory,
          groupTitle: groupTitle.trim() || 'Telegram Group',
          evidenceText: evidenceText.trim(),
          evidencePhotoUrl: evidencePhotoUrl.trim() || undefined,
          severity,
          reporterName: 'Community Admin',
          autoDetected: false,
          aiAnalysis: aiPreview || undefined,
        }),
      });

      if (res.ok) {
        setIsReportModalOpen(false);
        setScammerTarget('');
        setScamLinkOrChannel('');
        setEvidenceText('');
        setEvidencePhotoUrl('');
        setGroupTitle('');
        setAiPreview(null);
        onRefresh();
      }
    } catch (err) {
      console.error('File report error:', err);
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleSaveShieldSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await onUpdateSettings({
        scamShield: {
          enabled: true,
          autoWarnInGroups,
          autoDeleteScamMessages: autoDeleteMessages,
          adminAlertChatId: adminAlertChatId.trim() || undefined,
          scamKeywords,
          bannedLinks: settings.scamShield?.bannedLinks || [],
        },
      });
      setIsSettingsModalOpen(false);
    } catch (err) {
      console.error('Save shield settings error:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleExport = (format: 'csv' | 'json') => {
    window.open(`/api/scam-reports/export?format=${format}`, '_blank');
  };

  // Metrics
  const pendingCount = scamReports.filter((r) => r.status === 'pending').length;
  const verifiedCount = scamReports.filter((r) => r.status === 'verified_scam').length;
  const bannedCount = scamReports.filter((r) => r.status === 'banned').length;
  const fakeGroupCount = scamReports.filter((r) => r.scamType === 'fake_group').length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Telegram Group Scam Shield & Reports
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-semibold">
              Live Threat Shield
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Detect, audit, and report fraudulent Telegram groups, scam channels, fake admin impersonators, phishing links, and malicious bots.
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            onClick={() => setIsAbuseGuideOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 text-xs font-medium border border-slate-700 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>How to Report to Telegram</span>
          </button>

          <button
            onClick={() => onTestInSimulator('/report @fake_support asking for $100 fee in DM')}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
          >
            ⚡ Test /report
          </button>

          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Shield Config</span>
          </button>

          <button
            onClick={() => {
              setIsReportModalOpen(true);
              setAiPreview(null);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-medium text-xs shadow-lg shadow-red-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Report Group Scam</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Pending Reports</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{pendingCount}</div>
          <p className="text-[11px] text-amber-400 mt-0.5">Awaiting moderator review</p>
        </div>

        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Verified Group Scams</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{verifiedCount}</div>
          <p className="text-[11px] text-red-400 mt-0.5">Confirmed phishing / fraud</p>
        </div>

        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Banned Fraudsters</span>
            <UserX className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{bannedCount}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Blocked from Telegram groups</p>
        </div>

        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Fake Groups / Channels</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{fakeGroupCount}</div>
          <p className="text-[11px] text-purple-400 mt-0.5">Flagged clone communities</p>
        </div>
      </div>

      {/* Filter, Search, and Export Bar */}
      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by scammer username, group name, link, or keywords..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="verified_scam">Verified Scam</option>
            <option value="banned">Banned</option>
            <option value="dismissed">Dismissed</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <option value="all">All Categories</option>
            <option value="fake_group">🚨 Fake Group / Channel</option>
            <option value="phishing">Phishing Link</option>
            <option value="fake_admin">Fake Admin Impersonation</option>
            <option value="crypto_fraud">Crypto / Token Fraud</option>
            <option value="investment_scam">Investment Doubler Scheme</option>
            <option value="malicious_link">Malicious URL</option>
          </select>

          <button
            onClick={() => handleExport('csv')}
            className="flex items-center space-x-1 px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
            title="Export as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.map((report) => {
          return (
            <div
              key={report.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700/80 shadow-md transition-all space-y-3.5"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5 flex-wrap gap-y-1.5">
                  <span className="font-bold text-sm text-white">
                    {report.scammerUsername ? `@${report.scammerUsername}` : report.scamLinkOrChannel || report.scammerName}
                  </span>

                  {/* Status Badge */}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      report.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : report.status === 'verified_scam'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : report.status === 'banned'
                        ? 'bg-rose-900/40 text-rose-300 border border-rose-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {report.status.replace('_', ' ')}
                  </span>

                  {/* Severity Badge */}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      report.severity === 'critical'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : report.severity === 'high'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {report.severity}
                  </span>

                  {/* Category Badge */}
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700 flex items-center space-x-1">
                    {report.scamType === 'fake_group' && <Users className="w-3 h-3 text-purple-400 inline" />}
                    <span>{report.scamType.replace('_', ' ')}</span>
                  </span>

                  {report.autoDetected && (
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-semibold border border-purple-500/30">
                      ⚡ Auto-Shield Flag
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <span>{new Date(report.timestamp).toLocaleString()}</span>
                  <span>•</span>
                  <span className="font-mono text-[11px] text-sky-400">#{report.id}</span>
                </div>
              </div>

              {/* AI Assessment Banner if available */}
              {report.aiAnalysis && (
                <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-purple-200">
                        Gemini AI Assessment: {report.aiAnalysis.detectedTactic}
                      </span>
                      <p className="text-[11px] text-purple-300 mt-0.5">{report.aiAnalysis.riskSummary}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className="px-2 py-1 rounded bg-purple-900/60 text-purple-200 font-mono text-[11px] font-bold border border-purple-400/30">
                      Threat: {report.aiAnalysis.threatScore}%
                    </span>
                  </div>
                </div>
              )}

              {/* Evidence Quote Block */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">Reported Evidence & Activity:</span>
                  <button
                    onClick={() => handleCopy(report.evidenceText, report.id)}
                    className="flex items-center space-x-1 text-slate-400 hover:text-white"
                  >
                    {copiedId === report.id ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>Copy Evidence</span>
                  </button>
                </div>
                <p className="text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
                  "{report.evidenceText}"
                </p>
                {report.scamLinkOrChannel && (
                  <div className="pt-1 text-[11px] text-sky-400 font-mono flex items-center space-x-1">
                    <ExternalLink className="w-3 h-3" />
                    <span>Scam Target URL/Handle: {report.scamLinkOrChannel}</span>
                  </div>
                )}
              </div>

              {/* Metadata Details & Actions */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1 text-xs">
                <div className="flex items-center space-x-3 text-slate-400 text-[11px] flex-wrap gap-y-1">
                  <span>
                    Group/Community: <strong className="text-slate-200">{report.groupTitle || 'Telegram Chat'}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Reporter: <strong className="text-slate-200">{report.reporterName}</strong>
                    {report.reporterUsername ? ` (@${report.reporterUsername})` : ''}
                  </span>
                  {report.messageId && (
                    <>
                      <span>•</span>
                      <span className="font-mono">Msg #{report.messageId}</span>
                    </>
                  )}
                  {report.adminNotes && (
                    <>
                      <span>•</span>
                      <span className="text-amber-300 italic">Notes: {report.adminNotes}</span>
                    </>
                  )}
                </div>

                {/* Moderation Actions */}
                <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                  <button
                    onClick={() => handleModerateAction('ban', report)}
                    className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold flex items-center space-x-1"
                    title="Ban member from Telegram group via Bot API"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Ban Member</span>
                  </button>

                  <button
                    onClick={() => handleModerateAction('warn_group', report)}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium flex items-center space-x-1"
                    title="Broadcast Scam Warning Poster to Group"
                  >
                    <Send className="w-3 h-3" />
                    <span>Warn Group</span>
                  </button>

                  {report.messageId && (
                    <button
                      onClick={() => handleModerateAction('delete_msg', report)}
                      className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs"
                      title="Delete scam message from group"
                    >
                      Delete Msg
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setSelectedReportForAbuse(report);
                      setIsAbuseGuideOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 text-xs font-medium flex items-center space-x-1"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Abuse Report</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(report.id, 'verified_scam')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-medium"
                  >
                    Verify
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                    className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 text-xs"
                  >
                    Dismiss
                  </button>

                  <button
                    onClick={() => handleDeleteReport(report.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                    title="Delete report"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredReports.length === 0 && (
          <div className="py-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400">
            <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-200">No scam incident reports match your filter.</p>
            <p className="text-xs text-slate-400 mt-1">
              Your groups are protected! You can report a scam above or test `/report` in the simulator.
            </p>
          </div>
        )}
      </div>

      {/* File Scam Incident Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <span>Report Telegram Group / Channel Scam</span>
              </h2>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFileReport} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Scammer Target (@username or Telegram ID)
                  </label>
                  <input
                    type="text"
                    value={scammerTarget}
                    onChange={(e) => setScammerTarget(e.target.value)}
                    placeholder="e.g. @fake_admin or 99182312"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Or Scam Group / Channel Link
                  </label>
                  <input
                    type="text"
                    value={scamLinkOrChannel}
                    onChange={(e) => {
                      setScamLinkOrChannel(e.target.value);
                      if (e.target.value.includes('t.me/')) {
                        setScamCategory('fake_group');
                      }
                    }}
                    placeholder="e.g. https://t.me/fake_giveaway_vip"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Scam Category</label>
                  <select
                    value={scamCategory}
                    onChange={(e) => setScamCategory(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="fake_group">🚨 Fake Telegram Group / Channel Clone</option>
                    <option value="phishing">Phishing Link / Wallet Drainer</option>
                    <option value="fake_admin">Fake Admin Impersonation</option>
                    <option value="crypto_fraud">Crypto / Token Fraud / Fake Airdrop</option>
                    <option value="investment_scam">Investment Doubler / Ponzi</option>
                    <option value="malicious_link">Malicious URL / Malware Bot</option>
                    <option value="other">Other Fraud</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Severity Level</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="critical">Critical (Immediate Ban & Warning)</option>
                    <option value="high">High (Known Fraud Pattern)</option>
                    <option value="medium">Medium (Suspicious Behavior)</option>
                    <option value="low">Low (Needs Verification)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Telegram Group Name / Chat Title</label>
                <input
                  type="text"
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  placeholder="e.g. Traders Global Official Community"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold block">
                    Scam Evidence / Fraudulent Message *
                  </label>
                  <button
                    type="button"
                    onClick={handleAnalyzeWithAI}
                    disabled={analyzingAi || !evidenceText.trim()}
                    className="flex items-center space-x-1 text-purple-400 hover:text-purple-300 disabled:opacity-40 font-medium"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{analyzingAi ? 'Analyzing with Gemini...' : 'Analyze with AI'}</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  required
                  value={evidenceText}
                  onChange={(e) => setEvidenceText(e.target.value)}
                  placeholder="Paste the fraudulent message, phishing link, fake admin DM text, or describe how the scam works..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 font-mono text-xs"
                />
              </div>

              {/* AI Analysis Preview if run */}
              {aiPreview && (
                <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-purple-200 flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>AI Threat Detection: {aiPreview.detectedTactic}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-purple-900 text-purple-200 font-mono font-bold text-[10px]">
                      Threat Score: {aiPreview.threatScore}%
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-300">{aiPreview.riskSummary}</p>
                  <p className="text-[10px] text-slate-300 font-medium">💡 Recommendation: {aiPreview.recommendation}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold shadow-lg shadow-red-500/20"
                >
                  {submittingReport ? 'Filing Report...' : 'Submit Incident Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Telegram Abuse Guide Modal */}
      {isAbuseGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-sky-400" />
                <span>Official Telegram Scam Takedown Guide</span>
              </h2>
              <button
                onClick={() => {
                  setIsAbuseGuideOpen(false);
                  setSelectedReportForAbuse(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-slate-300">
              <p className="text-xs">
                To have fraudulent Telegram groups, scam channels, or impersonator accounts permanently removed or tagged with a <strong>SCAM</strong> badge by Telegram, follow these verified channels:
              </p>

              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">1️⃣ Official Telegram Anti-Scam Bot</span>
                  <a
                    href="https://t.me/notoscam"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-400 hover:text-sky-300 font-semibold flex items-center space-x-1"
                  >
                    <span>@notoscam</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-slate-400">
                  Open <strong>@notoscam</strong> on Telegram. Forward the scam message or send the link to the fake group/channel. Telegram's antiscam team reviews reports forwarded here directly.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">2️⃣ In-App Group / Channel Report</span>
                  <span className="text-[10px] text-slate-400">Instant in Telegram app</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Tap the Group/Channel title → tap <strong>•••</strong> (three dots) → tap <strong>Report</strong> → select <strong>Fake Account</strong> or <strong>Spam / Violence</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">3️⃣ Email Telegram Abuse Team</span>
                  <span className="font-mono text-sky-400 text-[11px]">abuse@telegram.org</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Send evidence, screenshot links, and the offending group/user handle.
                </p>
              </div>

              {selectedReportForAbuse && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-200">Pre-Formatted Report for #{selectedReportForAbuse.id}:</span>
                    <button
                      onClick={() => {
                        const copyText = `To: abuse@telegram.org\nSubject: Telegram Scam Report: ${selectedReportForAbuse.scammerUsername ? `@${selectedReportForAbuse.scammerUsername}` : selectedReportForAbuse.scammerName}\n\nEvidence:\nTarget: ${selectedReportForAbuse.scammerUsername ? `@${selectedReportForAbuse.scammerUsername}` : selectedReportForAbuse.scamLinkOrChannel || selectedReportForAbuse.scammerName}\nGroup: ${selectedReportForAbuse.groupTitle || 'Telegram Group'}\nThreat Tactic: ${selectedReportForAbuse.aiAnalysis?.detectedTactic || selectedReportForAbuse.scamType}\nEvidence Details: "${selectedReportForAbuse.evidenceText}"\nSeverity: ${selectedReportForAbuse.severity}`;
                        handleCopy(copyText, 'abuse-copy');
                      }}
                      className="text-sky-400 hover:text-sky-300 font-medium flex items-center space-x-1"
                    >
                      {copiedId === 'abuse-copy' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Report Email Template</span>
                    </button>
                  </div>
                  <pre className="text-[10px] text-slate-400 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
{`Target: ${selectedReportForAbuse.scammerUsername ? `@${selectedReportForAbuse.scammerUsername}` : selectedReportForAbuse.scamLinkOrChannel || selectedReportForAbuse.scammerName}
Group: ${selectedReportForAbuse.groupTitle || 'Telegram Group'}
Threat: ${selectedReportForAbuse.aiAnalysis?.detectedTactic || selectedReportForAbuse.scamType}
Evidence: "${selectedReportForAbuse.evidenceText}"`}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  setIsAbuseGuideOpen(false);
                  setSelectedReportForAbuse(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scam Shield Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-sky-400" />
                <span>Scam Shield & Auto-Moderation Rules</span>
              </h2>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveShieldSettings} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-semibold text-white block">Auto-Warn in Groups</span>
                    <span className="text-[11px] text-slate-400">
                      Instantly replies with safety warning poster when scam keywords or phishing are detected.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoWarnInGroups}
                    onChange={(e) => setAutoWarnInGroups(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-500"
                  />
                </label>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-semibold text-white block">
                      Auto-Delete Malicious Messages
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Deletes messages matching known phishing/scam patterns (bot must have group admin rights).
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoDeleteMessages}
                    onChange={(e) => setAutoDeleteMessages(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-500"
                  />
                </label>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Security Admin Alert Chat ID (Optional)
                </label>
                <input
                  type="text"
                  value={adminAlertChatId}
                  onChange={(e) => setAdminAlertChatId(e.target.value)}
                  placeholder="e.g. -1001928374 or your Telegram chat_id"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  When a scam report is filed, the bot will notify this admin chat immediately.
                </p>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Monitored Scam Keywords & Phishing Patterns
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="e.g. free crypto giveaway, connect wallet..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newKeyword.trim() && !scamKeywords.includes(newKeyword.trim().toLowerCase())) {
                        setScamKeywords([...scamKeywords, newKeyword.trim().toLowerCase()]);
                        setNewKeyword('');
                      }
                    }}
                    className="px-3 py-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-lg"
                  >
                    + Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 rounded-xl bg-slate-950 border border-slate-800">
                  {scamKeywords.map((kw, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono flex items-center space-x-1"
                    >
                      <span>{kw}</span>
                      <button
                        type="button"
                        onClick={() => setScamKeywords(scamKeywords.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-red-400 ml-1 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold"
                >
                  {savingSettings ? 'Saving...' : 'Save Shield Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
