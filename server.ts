import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { botStorage, getMedia, saveMedia } from './server/store.js';
import { analyzeScamEvidence } from './server/geminiService.js';
import {
  banTelegramMember,
  configureWebhook,
  deleteTelegramMessage,
  processIncomingMessage,
  processTelegramWebhookUpdate,
  sendTelegramMessage,
  startPolling,
  stopPolling,
  unbanTelegramMember,
  verifyTelegramToken,
} from './server/telegramService.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const APP_URL = process.env.APP_URL || '';

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// API: Get bot status & overview
app.get('/api/bot/status', async (req, res) => {
  const settings = botStorage.getSettings();
  const stats = botStorage.getStats();

  res.json({
    connected: Boolean(settings.botToken && settings.botInfo),
    botInfo: settings.botInfo,
    mode: settings.mode,
    webhookUrl: settings.webhookUrl || (APP_URL ? `${APP_URL}/api/telegram/webhook` : ''),
    geminiEnabled: Boolean(process.env.GEMINI_API_KEY),
    stats,
    settings: {
      ...settings,
      botToken: settings.botToken ? `${settings.botToken.substring(0, 7)}...${settings.botToken.slice(-4)}` : '',
    },
  });
});

// API: Connect & verify Telegram Bot Token
app.post('/api/bot/token', async (req, res) => {
  const { token, mode } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  const verify = await verifyTelegramToken(token);
  if (!verify.success) {
    return res.status(400).json({ error: verify.error });
  }

  const selectedMode = mode || 'simulator_only';
  let webhookUrl = '';

  if (selectedMode === 'webhook') {
    webhookUrl = `${APP_URL || req.protocol + '://' + req.get('host')}/api/telegram/webhook`;
    await configureWebhook(webhookUrl, token);
    stopPolling();
  } else if (selectedMode === 'polling') {
    // Delete any existing webhook to enable polling
    await configureWebhook('', token);
    botStorage.updateSettings({ botToken: token, botInfo: verify.botInfo!, mode: 'polling' });
    startPolling();
  } else {
    // Simulator only mode
    stopPolling();
  }

  const updated = botStorage.updateSettings({
    botToken: token,
    botInfo: verify.botInfo!,
    mode: selectedMode,
    webhookUrl,
  });

  res.json({
    success: true,
    botInfo: verify.botInfo,
    settings: updated,
  });
});

// API: Disconnect Telegram Bot
app.post('/api/bot/disconnect', async (req, res) => {
  const settings = botStorage.getSettings();
  stopPolling();
  if (settings.botToken) {
    await configureWebhook('', settings.botToken);
  }

  botStorage.updateSettings({
    botToken: '',
    botInfo: null,
    mode: 'simulator_only',
    webhookUrl: '',
  });

  res.json({ success: true });
});

// API: Update Bot Settings
app.post('/api/bot/settings', async (req, res) => {
  const partial = req.body;
  const currentSettings = botStorage.getSettings();

  // If mode changed to polling or webhook
  if (partial.mode && partial.mode !== currentSettings.mode && currentSettings.botToken) {
    if (partial.mode === 'polling') {
      await configureWebhook('', currentSettings.botToken);
      startPolling();
    } else if (partial.mode === 'webhook') {
      stopPolling();
      const webhookUrl = partial.webhookUrl || `${APP_URL || req.protocol + '://' + req.get('host')}/api/telegram/webhook`;
      await configureWebhook(webhookUrl, currentSettings.botToken);
      partial.webhookUrl = webhookUrl;
    } else {
      stopPolling();
    }
  }

  const updated = botStorage.updateSettings(partial);
  res.json({ success: true, settings: updated });
});

// API: Rules CRUD
app.get('/api/rules', (req, res) => {
  res.json(botStorage.getRules());
});

app.get('/api/rules/welcome', (req, res) => {
  const welcome = botStorage.getWelcomeRule();
  res.json(welcome || null);
});

app.post('/api/rules/welcome', (req, res) => {
  const payload = req.body;
  const current = botStorage.getWelcomeRule();
  const ruleToSave = {
    id: current?.id || 'rule-welcome',
    name: payload.name || '👋 Welcome Message & Poster (/start)',
    enabled: payload.enabled !== undefined ? payload.enabled : true,
    triggerType: 'welcome' as const,
    patterns: payload.patterns && payload.patterns.length > 0 ? payload.patterns : ['/start', 'start'],
    caseSensitive: false,
    replyText: payload.replyText || '👋 Welcome {first_name} to our official Telegram Bot!',
    photoUrl: payload.photoUrl !== undefined ? payload.photoUrl : current?.photoUrl,
    useAI: Boolean(payload.useAI),
    aiPromptModifier: payload.aiPromptModifier || '',
    buttons: payload.buttons || [],
    priority: 1,
    matchCount: current?.matchCount || 0,
    lastTriggeredAt: current?.lastTriggeredAt || null,
  };
  const saved = botStorage.saveRule(ruleToSave);
  res.json({ success: true, rule: saved });
});

// API: Poster Image Upload
app.post('/api/upload-poster', (req, res) => {
  const { dataUrl, filename } = req.body;
  if (!dataUrl) {
    return res.status(400).json({ error: 'dataUrl is required' });
  }

  try {
    const [header, base64] = dataUrl.split(',');
    const mimeType = header?.match(/:(.*?);/)?.[1] || 'image/jpeg';
    const buffer = Buffer.from(base64, 'base64');
    const mediaId = saveMedia(buffer, mimeType, filename || 'poster.jpg');
    const host = req.get('host');
    const protocol = req.protocol;
    const mediaUrl = `${protocol}://${host}/api/media/${mediaId}`;

    res.json({
      success: true,
      mediaId,
      mediaUrl,
      dataUrl,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Serve Uploaded Poster
app.get('/api/media/:id', (req, res) => {
  const media = getMedia(req.params.id);
  if (!media) {
    return res.status(404).send('Poster not found');
  }
  res.setHeader('Content-Type', media.mimeType);
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(media.buffer);
});

app.post('/api/rules', (req, res) => {
  const rule = req.body;
  if (!rule.name || !rule.patterns || !rule.replyText) {
    return res.status(400).json({ error: 'Name, patterns, and replyText are required.' });
  }

  if (!rule.id) {
    rule.id = `rule-${Date.now()}`;
    rule.matchCount = 0;
  }

  const saved = botStorage.saveRule(rule);
  res.json(saved);
});

app.delete('/api/rules/:id', (req, res) => {
  const deleted = botStorage.deleteRule(req.params.id);
  res.json({ success: deleted });
});

app.post('/api/rules/preset', (req, res) => {
  const { preset } = req.body;
  const rules = botStorage.loadPreset(preset);
  res.json({ success: true, rules });
});

// API: Simulate message in web chat simulator
app.post('/api/bot/simulate', async (req, res) => {
  const { text, senderName, username, chatId, senderId, groupTitle, replyToMessage } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required for simulation.' });
  }

  const result = await processIncomingMessage({
    chatId: chatId || (groupTitle ? -1001928374 : 998877),
    senderName: senderName || 'Demo Tester',
    username: username || 'demouser',
    senderId,
    groupTitle,
    incomingText: text,
    source: 'simulator',
    replyToMessage,
  });

  res.json(result);
});

// API: Direct broadcast / message sender
app.post('/api/bot/broadcast', async (req, res) => {
  const { chatId, message, buttons } = req.body;
  if (!chatId || !message) {
    return res.status(400).json({ error: 'chatId and message are required.' });
  }

  const sendResult = await sendTelegramMessage({
    chatId,
    text: message,
    buttons,
  });

  if (sendResult.ok) {
    botStorage.addLog({
      direction: 'outbound',
      source: 'telegram',
      chatId,
      senderName: 'Bot Admin',
      replyText: message,
      matchedRuleName: 'Direct Broadcast',
      status: 'success',
    });
    res.json({ success: true, result: sendResult.result });
  } else {
    res.status(400).json({ success: false, error: sendResult.description });
  }
});

// API: Logs & Analytics
app.get('/api/logs', (req, res) => {
  const limit = parseInt(req.query.limit as string, 10) || 100;
  res.json(botStorage.getLogs(limit));
});

app.delete('/api/logs', (req, res) => {
  botStorage.clearLogs();
  res.json({ success: true });
});

// API: AI On-Demand Scam Evidence Analysis
app.post('/api/scam-reports/ai-analyze', async (req, res) => {
  const { evidenceText, groupTitle, scammerName } = req.body;
  if (!evidenceText) {
    return res.status(400).json({ error: 'evidenceText is required' });
  }

  try {
    const analysis = await analyzeScamEvidence(evidenceText, { groupTitle, scammerName });
    res.json({ success: true, analysis });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Scam Reports & Group Moderation
app.get('/api/scam-reports', (req, res) => {
  res.json(botStorage.getScamReports());
});

app.get('/api/scam-reports/export', (req, res) => {
  const format = req.query.format || 'json';
  const reports = botStorage.getScamReports();

  if (format === 'csv') {
    const headers = ['ID', 'Date', 'Group Title', 'Reporter', 'Scammer Target', 'Scam Type', 'Status', 'Severity', 'Threat Score', 'Evidence Text'];
    const rows = reports.map((r) => [
      `"${r.id}"`,
      `"${new Date(r.timestamp).toISOString()}"`,
      `"${(r.groupTitle || '').replace(/"/g, '""')}"`,
      `"${r.reporterName} (${r.reporterUsername || ''})"`,
      `"${r.scammerName || ''} (${r.scammerUsername || ''})"`,
      `"${r.scamType}"`,
      `"${r.status}"`,
      `"${r.severity}"`,
      `"${r.aiAnalysis?.threatScore || 0}%"`,
      `"${(r.evidenceText || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="telegram-group-scam-reports.csv"');
    return res.send(csvContent);
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="telegram-group-scam-reports.json"');
  res.json(reports);
});

app.post('/api/scam-reports', async (req, res) => {
  const {
    chatId,
    groupTitle,
    reporterName,
    reporterUsername,
    reporterId,
    scammerName,
    scammerUsername,
    scammerId,
    scamLinkOrChannel,
    evidenceText,
    evidencePhotoUrl,
    messageId,
    scamType,
    severity,
    autoDetected,
    adminNotes,
    aiAnalysis: clientAnalysis,
  } = req.body;

  if (!evidenceText) {
    return res.status(400).json({ error: 'evidenceText is required' });
  }

  // Generate AI analysis if not passed
  let analysis = clientAnalysis;
  if (!analysis) {
    try {
      analysis = await analyzeScamEvidence(evidenceText, {
        groupTitle,
        scammerName: scammerName || scammerUsername || scamLinkOrChannel,
      });
    } catch {
      // Ignore AI errors
    }
  }

  const determinedSeverity = severity || (analysis && analysis.threatScore >= 80 ? 'critical' : analysis && analysis.threatScore >= 50 ? 'high' : 'medium');
  const determinedStatus = analysis && analysis.threatScore >= 85 ? 'verified_scam' : 'pending';

  const report = botStorage.addScamReport({
    chatId: chatId || 'Telegram Group',
    groupTitle: groupTitle || 'Community Group',
    reporterName: reporterName || 'Community Member',
    reporterUsername,
    reporterId,
    scammerName: scammerName || 'Reported Scammer',
    scammerUsername,
    scammerId,
    scamLinkOrChannel,
    evidenceText,
    evidencePhotoUrl,
    messageId,
    scamType: scamType || 'phishing',
    status: determinedStatus,
    severity: determinedSeverity,
    autoDetected: Boolean(autoDetected),
    aiAnalysis: analysis,
    adminNotes: adminNotes || (analysis ? `AI assessment: ${analysis.detectedTactic}. ${analysis.recommendation}` : undefined),
  });

  res.json({ success: true, report });
});

app.put('/api/scam-reports/:id', (req, res) => {
  const updated = botStorage.updateScamReport(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Report not found' });
  }
  res.json({ success: true, report: updated });
});

app.delete('/api/scam-reports/:id', (req, res) => {
  const deleted = botStorage.deleteScamReport(req.params.id);
  res.json({ success: deleted });
});

app.post('/api/scam-reports/moderate', async (req, res) => {
  const { action, reportId, chatId, userId, messageId, warningMessage, reportTarget } = req.body;
  const settings = botStorage.getSettings();

  if (action === 'ban') {
    if (chatId && userId && settings.botToken) {
      await banTelegramMember(chatId, userId);
    }
    if (reportId) {
      botStorage.updateScamReport(reportId, { status: 'banned', adminNotes: 'Member permanently banned by group moderator' });
    }
    return res.json({ success: true, message: 'User banned from Telegram group' });
  }

  if (action === 'unban') {
    if (chatId && userId && settings.botToken) {
      await unbanTelegramMember(chatId, userId);
    }
    if (reportId) {
      botStorage.updateScamReport(reportId, { status: 'dismissed', adminNotes: 'Unbanned / marked false positive' });
    }
    return res.json({ success: true, message: 'User unbanned' });
  }

  if (action === 'delete_msg') {
    if (chatId && messageId && settings.botToken) {
      await deleteTelegramMessage(chatId, messageId);
    }
    if (reportId) {
      botStorage.updateScamReport(reportId, { adminNotes: 'Fraudulent message deleted from group' });
    }
    return res.json({ success: true, message: 'Scam message deleted from group' });
  }

  if (action === 'warn_group') {
    const text = warningMessage || '⚠️ [MODERATOR SCAM WARNING] A member in this group was reported for scam activity. Never send funds or share your recovery phrases!';
    if (chatId) {
      await sendTelegramMessage({
        chatId,
        text,
        photoUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
        buttons: [
          { text: '🚨 View Anti-Scam Rules', callbackData: '/rules' },
          { text: '🤖 Report to @notoscam', url: 'https://t.me/notoscam' },
        ],
      });
    }
    return res.json({ success: true, message: 'Scam warning poster broadcasted to group' });
  }

  if (action === 'telegram_abuse_info') {
    // Generate official report template for Telegram Abuse & @notoscam
    const report = reportId ? botStorage.getScamReports().find(r => r.id === reportId) : null;
    const target = reportTarget || (report?.scammerUsername ? `@${report.scammerUsername}` : report?.scamLinkOrChannel || report?.scammerName);
    const text = `Official Telegram Abuse Channels:\n` +
      `1. Telegram Bot: @notoscam (Forward the scam message or send group link)\n` +
      `2. Email: abuse@telegram.org\n` +
      `Subject: Scam Report: ${target}\n` +
      `Details:\n` +
      `- Entity: ${target}\n` +
      `- Group: ${report?.groupTitle || 'Telegram Group'}\n` +
      `- Evidence: ${report?.evidenceText || 'N/A'}\n` +
      `- Threat: ${report?.aiAnalysis?.detectedTactic || report?.scamType}\n`;

    return res.json({ success: true, abuseTemplate: text, notoscamUrl: 'https://t.me/notoscam' });
  }

  res.status(400).json({ error: 'Invalid moderation action' });
});

// Telegram Webhook Handler Endpoint
app.post('/api/telegram/webhook', async (req, res) => {
  try {
    const update = req.body;
    // Telegram expects immediate 200 OK
    res.sendStatus(200);

    // Process update asynchronously
    await processTelegramWebhookUpdate(update);
  } catch (error) {
    console.error('Error in Telegram Webhook Handler:', error);
  }
});

// Setup Vite middleware in dev or static files in production
async function bootstrap() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🤖 Telegram Auto Reply Bot Server listening on port ${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
