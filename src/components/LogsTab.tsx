import React, { useState } from 'react';
import {
  Send,
  Sparkles,
  Search,
  Trash2,
  Download,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Filter,
  Eye,
  X,
} from 'lucide-react';
import { MessageLog } from '../types';

interface LogsTabProps {
  logs: MessageLog[];
  onClearLogs: () => Promise<void>;
  onRefresh: () => void;
}

export const LogsTab: React.FC<LogsTabProps> = ({ logs, onClearLogs, onRefresh }) => {
  const [filterSource, setFilterSource] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<MessageLog | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesSource = filterSource === 'all' || log.source === filterSource;
    const matchesSearch =
      (log.incomingText && log.incomingText.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.replyText && log.replyText.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.matchedRuleName && log.matchedRuleName.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSource && matchesSearch;
  });

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Timestamp', 'Source', 'Sender', 'Username', 'ChatID', 'Incoming', 'Reply', 'MatchedRule', 'Status', 'LatencyMs'];
    const rows = logs.map((l) => [
      new Date(l.timestamp).toISOString(),
      l.source,
      `"${l.senderName.replace(/"/g, '""')}"`,
      l.username || '',
      l.chatId,
      `"${(l.incomingText || '').replace(/"/g, '""')}"`,
      `"${l.replyText.replace(/"/g, '""')}"`,
      `"${(l.matchedRuleName || '').replace(/"/g, '""')}"`,
      l.status,
      l.latencyMs || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `telegram_bot_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Message Logs & Activity History</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {logs.length} events
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time audit log of every incoming chat, matched trigger rule, and outbound auto-reply message.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportCSV}
            disabled={logs.length === 0}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear all message logs?')) {
                onClearLogs();
              }
            }}
            disabled={logs.length === 0}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-red-500/20 disabled:opacity-50 text-slate-300 hover:text-red-400 border border-slate-700 text-xs font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by text, user name, or rule name..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Source:</span>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="all">All Sources</option>
            <option value="telegram">Telegram (Real)</option>
            <option value="simulator">Web Simulator</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Incoming Message</th>
                <th className="py-3 px-4">Auto-Reply</th>
                <th className="py-3 px-4">Matched Rule</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-semibold text-slate-200">{log.senderName}</span>
                    {log.username && <span className="text-slate-400 text-[11px] block">@{log.username}</span>}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        log.source === 'telegram'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {log.source}
                    </span>
                  </td>

                  <td className="py-3 px-4 max-w-xs">
                    <span className="font-mono text-slate-200 truncate block">
                      "{log.incomingText}"
                    </span>
                  </td>

                  <td className="py-3 px-4 max-w-sm">
                    <span className="text-slate-300 truncate block">
                      {log.replyText.replace(/\n/g, ' ')}
                    </span>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-sky-400 text-[11px] font-medium border border-slate-700">
                        {log.matchedRuleName || 'Default'}
                      </span>
                      {log.isAiGenerated && (
                        <span className="p-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px]" title="Gemini AI">
                          <Sparkles className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Inspect Log"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No message logs found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Drawer Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>Message Transaction Details</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">
                  {selectedLog.id}
                </span>
              </h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div>
                  <span className="text-slate-400 block text-[11px]">Timestamp:</span>
                  <span className="font-semibold text-white">{new Date(selectedLog.timestamp).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Source & Status:</span>
                  <span className="font-semibold text-white capitalize">{selectedLog.source} ({selectedLog.status})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Sender Name:</span>
                  <span className="font-semibold text-white">{selectedLog.senderName} {selectedLog.username ? `(@${selectedLog.username})` : ''}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Telegram Chat ID:</span>
                  <span className="font-mono text-sky-400">{selectedLog.chatId}</span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Incoming User Message:</label>
                <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono whitespace-pre-wrap">
                  {selectedLog.incomingText}
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Auto-Replied Text:</label>
                <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 whitespace-pre-wrap">
                  {selectedLog.replyText}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-[11px]">
                <span className="text-slate-400">Matched Rule: <strong className="text-sky-400">{selectedLog.matchedRuleName || 'Default'}</strong></span>
                {selectedLog.latencyMs !== undefined && (
                  <span className="text-slate-400 font-mono">Response Latency: {selectedLog.latencyMs}ms</span>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
