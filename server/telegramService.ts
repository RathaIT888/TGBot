import { botStorage } from './store.js';
import { analyzeScamEvidence, generateGeminiReply } from './geminiService.js';
import { AutoReplyRule, InlineButton, TelegramBotInfo } from '../src/types.js';

let pollingInterval: NodeJS.Timeout | null = null;
let lastUpdateId = 0;
let isPollingActive = false;

export async function verifyTelegramToken(token: string): Promise<{ success: boolean; botInfo?: TelegramBotInfo; error?: string }> {
  const cleanToken = token.trim();
  if (!cleanToken) {
    return { success: false, error: 'Bot token cannot be empty' };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
    const data = await res.json();
    if (data.ok && data.result) {
      return {
        success: true,
        botInfo: data.result as TelegramBotInfo,
      };
    } else {
      return {
        success: false,
        error: data.description || 'Invalid Telegram Bot Token from Telegram API',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: `Network error reaching Telegram API: ${err.message}`,
    };
  }
}

export async function sendTelegramMessage(params: {
  chatId: string | number;
  text: string;
  buttons?: InlineButton[];
  token?: string;
  replyToMessageId?: number;
  photoUrl?: string;
}): Promise<{ ok: boolean; description?: string; result?: any }> {
  const settings = botStorage.getSettings();
  const token = params.token || settings.botToken;

  if (!token) {
    return { ok: false, description: 'No Telegram bot token configured.' };
  }

  let replyMarkup: any = undefined;
  if (params.buttons && params.buttons.length > 0) {
    replyMarkup = {
      inline_keyboard: params.buttons.map(btn => {
        if (btn.url) {
          return [{ text: btn.text, url: btn.url }];
        }
        return [{ text: btn.text, callback_data: btn.callbackData || btn.text }];
      }),
    };
  }

  // If a poster/photo is attached, use Telegram sendPhoto API
  if (params.photoUrl) {
    try {
      if (params.photoUrl.startsWith('data:')) {
        // Handle Base64 Data URL upload via multipart FormData
        const [header, base64Data] = params.photoUrl.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
        const buffer = Buffer.from(base64Data, 'base64');
        const formData = new FormData();
        formData.append('chat_id', String(params.chatId));
        formData.append('photo', new Blob([buffer], { type: mimeType }), 'poster.jpg');
        if (params.text) {
          formData.append('caption', params.text);
        }
        if (params.replyToMessageId) {
          formData.append('reply_to_message_id', String(params.replyToMessageId));
        }
        if (replyMarkup) {
          formData.append('reply_markup', JSON.stringify(replyMarkup));
        }

        const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
          method: 'POST',
          body: formData,
        });
        const json = await res.json();
        if (json.ok) return json;
        // If sendPhoto failed with data URL, log warning and try fallback to text
        console.warn('sendPhoto multipart failed, falling back to sendMessage:', json.description);
      } else {
        // Handle remote HTTP image URL
        const payload: any = {
          chat_id: params.chatId,
          photo: params.photoUrl,
          caption: params.text,
        };
        if (params.replyToMessageId) {
          payload.reply_to_message_id = params.replyToMessageId;
        }
        if (replyMarkup) {
          payload.reply_markup = replyMarkup;
        }

        const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.ok) return json;
        console.warn('sendPhoto URL failed, falling back to sendMessage:', json.description);
      }
    } catch (err: any) {
      console.error('Error sending photo to Telegram:', err);
    }
  }

  // Default to sendMessage (text or fallback)
  const payload: any = {
    chat_id: params.chatId,
    text: params.text,
  };

  if (params.replyToMessageId) {
    payload.reply_to_message_id = params.replyToMessageId;
  }

  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return { ok: false, description: err.message };
  }
}

export async function sendTelegramChatAction(chatId: string | number, action = 'typing', token?: string) {
  const settings = botStorage.getSettings();
  const botToken = token || settings.botToken;
  if (!botToken) return;

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, action }),
    });
  } catch {
    // Ignore non-fatal action errors
  }
}

export async function banTelegramMember(chatId: string | number, userId: string | number, token?: string) {
  const settings = botStorage.getSettings();
  const botToken = token || settings.botToken;
  if (!botToken) return { ok: false, description: 'No token' };

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/banChatMember`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, user_id: userId }),
    });
    return await res.json();
  } catch (err: any) {
    return { ok: false, description: err.message };
  }
}

export async function unbanTelegramMember(chatId: string | number, userId: string | number, token?: string) {
  const settings = botStorage.getSettings();
  const botToken = token || settings.botToken;
  if (!botToken) return { ok: false, description: 'No token' };

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/unbanChatMember`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, user_id: userId, only_if_banned: true }),
    });
    return await res.json();
  } catch (err: any) {
    return { ok: false, description: err.message };
  }
}

export async function deleteTelegramMessage(chatId: string | number, messageId: number, token?: string) {
  const settings = botStorage.getSettings();
  const botToken = token || settings.botToken;
  if (!botToken) return { ok: false, description: 'No token' };

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/deleteMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
    });
    return await res.json();
  } catch (err: any) {
    return { ok: false, description: err.message };
  }
}

export async function configureWebhook(webhookUrl: string, token: string): Promise<{ ok: boolean; description?: string }> {
  try {
    if (!webhookUrl) {
      const res = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`);
      return await res.json();
    }
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl, drop_pending_updates: false }),
    });
    return await res.json();
  } catch (err: any) {
    return { ok: false, description: err.message };
  }
}

export function isOutsideBusinessHours(): boolean {
  const settings = botStorage.getSettings();
  const bh = settings.businessHours;
  if (!bh || !bh.enabled) return false;

  try {
    const now = new Date();
    // Format according to specified timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: bh.timezone || 'UTC',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      weekday: 'short',
    });

    const parts = formatter.formatToParts(now);
    let hour = 0;
    let minute = 0;
    for (const p of parts) {
      if (p.type === 'hour') hour = parseInt(p.value, 10);
      if (p.type === 'minute') minute = parseInt(p.value, 10);
    }

    const currentMinutes = hour * 60 + minute;
    const startMinutes = bh.startHour * 60 + bh.startMinute;
    const endMinutes = bh.endHour * 60 + bh.endMinute;

    return currentMinutes < startMinutes || currentMinutes > endMinutes;
  } catch (e) {
    console.error('Error calculating business hours:', e);
    return false;
  }
}

export function replaceVariables(
  template: string,
  context: {
    firstName: string;
    username?: string;
    chatId: string | number;
    messageText: string;
    startParam?: string;
  }
): string {
  const now = new Date();
  const settings = botStorage.getSettings();
  const botName = settings.botInfo?.first_name || 'TeleReply Bot';

  // Extract startParam from messageText if not passed explicitly
  let param = context.startParam || '';
  if (!param && context.messageText) {
    const parts = context.messageText.trim().split(/\s+/);
    if (parts.length > 1 && parts[0].toLowerCase().startsWith('/start')) {
      param = parts.slice(1).join(' ');
    }
  }

  return template
    .replace(/{first_name}/gi, context.firstName || 'Friend')
    .replace(/{name}/gi, context.firstName || 'Friend')
    .replace(/{username}/gi, context.username ? `@${context.username}` : context.firstName || 'User')
    .replace(/{chat_id}/gi, String(context.chatId))
    .replace(/{bot_name}/gi, botName)
    .replace(/{start_param}/gi, param || 'default')
    .replace(/{message}/gi, context.messageText || '')
    .replace(/{date}/gi, now.toLocaleDateString())
    .replace(/{time}/gi, now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
}

export function findMatchingRule(incomingText: string): AutoReplyRule | null {
  const text = (incomingText || '').trim();
  const lowerText = text.toLowerCase();
  const rules = botStorage.getRules().filter(r => r.enabled);

  // Sort by priority (ascending: 1, 10, 20, 30...)
  rules.sort((a, b) => (a.priority || 50) - (b.priority || 50));

  for (const rule of rules) {
    if (!rule.patterns || rule.patterns.length === 0) continue;

    for (const rawPattern of rule.patterns) {
      const pattern = rawPattern.trim();
      if (!pattern) continue;

      const compareTarget = rule.caseSensitive ? text : lowerText;
      const comparePattern = rule.caseSensitive ? pattern : pattern.toLowerCase();

      switch (rule.triggerType) {
        case 'welcome':
          // Match /start, /start payload, /start@bot, or custom pattern
          if (
            compareTarget === '/start' ||
            compareTarget.startsWith('/start ') ||
            compareTarget.startsWith('/start@') ||
            compareTarget === comparePattern
          ) {
            return rule;
          }
          break;

        case 'exact':
          if (compareTarget === comparePattern) {
            return rule;
          }
          break;

        case 'command': {
          const cmd = comparePattern.startsWith('/') ? comparePattern : `/${comparePattern}`;
          if (compareTarget === cmd || compareTarget.startsWith(`${cmd} `) || compareTarget.startsWith(`${cmd}@`)) {
            return rule;
          }
          break;
        }

        case 'startsWith':
          if (compareTarget.startsWith(comparePattern)) {
            return rule;
          }
          break;

        case 'contains':
          if (compareTarget.includes(comparePattern)) {
            return rule;
          }
          break;

        case 'regex':
          try {
            const flags = rule.caseSensitive ? '' : 'i';
            const re = new RegExp(pattern, flags);
            if (re.test(text)) {
              return rule;
            }
          } catch (e) {
            console.error(`Invalid regex in rule ${rule.name}:`, e);
          }
          break;

        case 'default':
          // Reserved for fallback, do not match primary loop
          break;
      }
    }
  }

  return null;
}

export interface ProcessIncomingMessageParams {
  chatId: string | number;
  senderName: string;
  username?: string;
  senderId?: string | number;
  groupTitle?: string;
  chatType?: string;
  incomingText: string;
  source: 'telegram' | 'simulator';
  messageId?: number;
  replyToMessage?: {
    messageId: number;
    senderName: string;
    username?: string;
    userId?: string | number;
    text: string;
  };
}

export async function processIncomingMessage(params: ProcessIncomingMessageParams): Promise<{
  replyText: string;
  photoUrl?: string;
  matchedRule: AutoReplyRule | null;
  isAiGenerated: boolean;
  buttons?: InlineButton[];
  isBusinessHoursAway?: boolean;
  latencyMs: number;
}> {
  const startTime = Date.now();
  const settings = botStorage.getSettings();
  const { chatId, senderName, username, senderId, groupTitle, incomingText, source, messageId, replyToMessage } = params;

  const actualGroupTitle = groupTitle || (typeof chatId === 'number' && chatId < 0 ? 'Telegram Group' : undefined);

  // Send typing action if Telegram message
  if (source === 'telegram' && settings.enableTypingAction) {
    sendTelegramChatAction(chatId, 'typing').catch(() => {});
  }

  // 1. Check Out-of-Office / Business Hours
  const isAway = isOutsideBusinessHours();

  // 2. Scam Shield & Group Scam Reporting Interceptor
  const trimmedLower = incomingText.trim().toLowerCase();
  const isReportGroupCommand =
    trimmedLower === '/reportgroup' ||
    trimmedLower.startsWith('/reportgroup ') ||
    trimmedLower === '/scamgroup' ||
    trimmedLower.startsWith('/scamgroup ') ||
    trimmedLower === '/reportchannel' ||
    trimmedLower.startsWith('/reportchannel ');

  const isGeneralReportCommand =
    trimmedLower === '/report' ||
    trimmedLower.startsWith('/report ') ||
    trimmedLower === '/scam' ||
    trimmedLower.startsWith('/scam ') ||
    isReportGroupCommand;

  let replyText = '';
  let isAiGenerated = false;
  let buttons: InlineButton[] | undefined = undefined;
  let photoUrlToUse: string | undefined = undefined;
  let matchedRule: AutoReplyRule | null = null;

  // Case 2A: User replied to a message in group with /report or /scam
  if (isGeneralReportCommand && replyToMessage) {
    const rawComment = incomingText.trim().replace(/^\/(report|scam|reportgroup|scamgroup|reportchannel)\b/i, '').trim();
    const scammerTarget = replyToMessage.username ? `@${replyToMessage.username}` : replyToMessage.senderName || 'Group Member';
    const evidenceText = replyToMessage.text || '[Media / File Attached]';

    let scamCategory: 'phishing' | 'crypto_fraud' | 'fake_admin' | 'investment_scam' | 'malicious_link' | 'fake_group' | 'other' = 'other';
    const combinedText = `${evidenceText} ${rawComment}`.toLowerCase();
    if (combinedText.includes('seed') || combinedText.includes('private key') || combinedText.includes('connect wallet') || combinedText.includes('phish')) {
      scamCategory = 'phishing';
    } else if (combinedText.includes('admin') || combinedText.includes('impersonat') || combinedText.includes('staff') || combinedText.includes('support')) {
      scamCategory = 'fake_admin';
    } else if (combinedText.includes('profit') || combinedText.includes('invest') || combinedText.includes('yield') || combinedText.includes('double') || combinedText.includes('pump')) {
      scamCategory = 'investment_scam';
    } else if (combinedText.includes('airdrop') || combinedText.includes('claim') || combinedText.includes('ton') || combinedText.includes('crypto')) {
      scamCategory = 'crypto_fraud';
    } else if (combinedText.includes('t.me/') || combinedText.includes('group') || combinedText.includes('channel')) {
      scamCategory = 'fake_group';
    } else if (combinedText.includes('http') || combinedText.includes('www.') || combinedText.includes('.xyz') || combinedText.includes('.link')) {
      scamCategory = 'malicious_link';
    }

    // AI Analysis
    const aiAnalysis = await analyzeScamEvidence(
      `Evidence from message: "${evidenceText}". Reporter Comment: "${rawComment || 'Flagged as scam by group member'}"`,
      { groupTitle: actualGroupTitle, scammerName: scammerTarget }
    );

    // Auto delete scam message if enabled and on live Telegram
    if (settings.scamShield?.autoDeleteScamMessages && source === 'telegram' && replyToMessage.messageId) {
      deleteTelegramMessage(chatId, replyToMessage.messageId).catch(() => {});
    }

    const filedReport = botStorage.addScamReport({
      chatId,
      groupTitle: actualGroupTitle || 'Telegram Group',
      reporterName: senderName,
      reporterUsername: username,
      reporterId: senderId,
      scammerName: replyToMessage.senderName,
      scammerUsername: replyToMessage.username,
      scammerId: replyToMessage.userId,
      evidenceText: `${evidenceText}${rawComment ? `\n(Reporter note: ${rawComment})` : ''}`,
      scamType: scamCategory,
      status: aiAnalysis.threatScore >= 80 ? 'verified_scam' : 'pending',
      severity: aiAnalysis.threatScore >= 85 ? 'critical' : aiAnalysis.threatScore >= 60 ? 'high' : 'medium',
      messageId: replyToMessage.messageId,
      autoDetected: false,
      aiAnalysis,
      adminNotes: `Reported via reply to message in ${actualGroupTitle || 'chat'}. ${aiAnalysis.recommendation}`,
    });

    // Alert admin chat if configured
    if (settings.scamShield?.adminAlertChatId && source === 'telegram') {
      sendTelegramMessage({
        chatId: settings.scamShield.adminAlertChatId,
        text: `🚨 [SCAM SHIELD ALERT]\nNew report filed in ${actualGroupTitle || 'Group'} (#${filedReport.id})\nTarget: ${scammerTarget}\nThreat Score: ${aiAnalysis.threatScore}%\nTactic: ${aiAnalysis.detectedTactic}\nEvidence: "${evidenceText.substring(0, 150)}..."`,
      }).catch(() => {});
    }

    replyText = `🚨 *GROUP SCAM REPORT REGISTERED!*\n\n` +
      `• **Case ID:** \`#${filedReport.id}\`\n` +
      `• **Reported Member:** ${scammerTarget}\n` +
      `• **Scam Category:** ${scamCategory.toUpperCase().replace('_', ' ')}\n` +
      `• **Threat Assessment:** ${aiAnalysis.threatScore >= 80 ? '🔴 CRITICAL RISK' : aiAnalysis.threatScore >= 50 ? '🟠 HIGH RISK' : '🟡 UNDER REVIEW'} (${aiAnalysis.threatScore}% Threat Score)\n` +
      `• **Detected Tactic:** ${aiAnalysis.detectedTactic}\n` +
      `• **Evidence Quoted:** "${evidenceText.substring(0, 120)}${evidenceText.length > 120 ? '...' : ''}"\n\n` +
      `🛡️ *Moderator Action:* ${settings.scamShield?.autoDeleteScamMessages ? 'Fraudulent message deleted. ' : ''}Logged to Security Dashboard. Group admins can permanently ban this member with one click.\n\n` +
      `⚠️ *Reminder:* Real admins will NEVER ask for private keys, seed words, or upfront crypto transfers!`;

    photoUrlToUse = 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80';
    buttons = [
      { text: '📜 Community Safety Rules', callbackData: '/rules' },
      { text: '🛡️ Official Telegram Abuse Bot', url: 'https://t.me/notoscam' },
    ];
  } else if (isReportGroupCommand) {
    // Case 2B: Reporting an entire fake Telegram group or channel
    const rawArgs = incomingText.trim().replace(/^\/(reportgroup|scamgroup|reportchannel)\b/i, '').trim();
    const parts = rawArgs.split(/\s+/);
    const targetLinkOrHandle = parts[0] || 'Unknown Group/Channel';
    const evidenceDetails = parts.slice(1).join(' ') || 'Reported fraudulent group or clone channel';

    const aiAnalysis = await analyzeScamEvidence(
      `Reported Fake Group/Channel: ${targetLinkOrHandle}. Evidence: "${evidenceDetails}"`,
      { groupTitle: actualGroupTitle, scammerName: targetLinkOrHandle }
    );

    const filedReport = botStorage.addScamReport({
      chatId,
      groupTitle: actualGroupTitle || 'Telegram Community',
      reporterName: senderName,
      reporterUsername: username,
      reporterId: senderId,
      scamLinkOrChannel: targetLinkOrHandle,
      scammerName: targetLinkOrHandle,
      evidenceText: `Reported Scam Group: ${targetLinkOrHandle}\nDetails: ${evidenceDetails}`,
      scamType: 'fake_group',
      status: 'pending',
      severity: 'high',
      autoDetected: false,
      aiAnalysis,
      adminNotes: `Fake group report filed by ${senderName}. ${aiAnalysis.recommendation}`,
    });

    replyText = `🚨 *TELEGRAM SCAM GROUP / CHANNEL REPORTED!*\n\n` +
      `• **Case ID:** \`#${filedReport.id}\`\n` +
      `• **Target Entity:** \`${targetLinkOrHandle}\`\n` +
      `• **Threat Evaluation:** ${aiAnalysis.detectedTactic} (${aiAnalysis.threatScore}% Threat Score)\n` +
      `• **Summary:** ${aiAnalysis.riskSummary}\n\n` +
      `📋 *How to Submit Official Telegram Takedown:*\n` +
      `1️⃣ Forward the scam channel/group link to the official Telegram **@notoscam** bot.\n` +
      `2️⃣ Send email to **abuse@telegram.org** with subject: \`Scam Group Report: ${targetLinkOrHandle}\`\n` +
      `3️⃣ In Telegram app, tap Group Info → \`...\` → **Report** → **Fake Account / Scam**.\n\n` +
      `Our group security desk has cataloged this threat into the global blacklist.`;

    buttons = [
      { text: '🤖 Open @notoscam Bot', url: 'https://t.me/notoscam' },
      { text: '📜 Community Safety Rules', callbackData: '/rules' },
    ];
  } else if (isGeneralReportCommand && (trimmedLower.startsWith('/report ') || trimmedLower.startsWith('/scam '))) {
    // Case 2C: Reporting with arguments, e.g. /report @username asking for money
    const rawArgs = incomingText.trim().split(/\s+/).slice(1);
    let scammerTarget = '';
    let evidenceText = '';

    if (rawArgs.length > 0) {
      if (rawArgs[0].startsWith('@') || /^\d+$/.test(rawArgs[0]) || rawArgs[0].startsWith('t.me/') || rawArgs[0].startsWith('http')) {
        scammerTarget = rawArgs[0];
        evidenceText = rawArgs.slice(1).join(' ') || 'Reported via /report command';
      } else {
        evidenceText = rawArgs.join(' ');
      }
    }

    let scamCategory: 'phishing' | 'crypto_fraud' | 'fake_admin' | 'investment_scam' | 'malicious_link' | 'fake_group' | 'other' = 'other';
    const evidenceLower = evidenceText.toLowerCase();
    if (evidenceLower.includes('phish') || evidenceLower.includes('link') || evidenceLower.includes('url')) scamCategory = 'phishing';
    else if (evidenceLower.includes('admin') || evidenceLower.includes('fake') || evidenceLower.includes('impersonat')) scamCategory = 'fake_admin';
    else if (evidenceLower.includes('invest') || evidenceLower.includes('yield') || evidenceLower.includes('profit') || evidenceLower.includes('double')) scamCategory = 'investment_scam';
    else if (evidenceLower.includes('crypto') || evidenceLower.includes('airdrop') || evidenceLower.includes('wallet') || evidenceLower.includes('ton')) scamCategory = 'crypto_fraud';
    else if (scammerTarget.includes('t.me/') || evidenceLower.includes('group') || evidenceLower.includes('channel')) scamCategory = 'fake_group';

    const aiAnalysis = await analyzeScamEvidence(
      `Target: ${scammerTarget || 'Suspect Member'}. Evidence: "${evidenceText}"`,
      { groupTitle: actualGroupTitle, scammerName: scammerTarget }
    );

    const filedReport = botStorage.addScamReport({
      chatId,
      groupTitle: actualGroupTitle || 'Telegram Chat',
      reporterName: senderName,
      reporterUsername: username,
      reporterId: senderId,
      scammerUsername: scammerTarget.startsWith('@') ? scammerTarget.replace('@', '') : undefined,
      scammerName: scammerTarget || 'Suspect Member',
      evidenceText: evidenceText || 'Reported suspicious behavior',
      scamType: scamCategory,
      status: aiAnalysis.threatScore >= 80 ? 'verified_scam' : 'pending',
      severity: aiAnalysis.threatScore >= 80 ? 'critical' : 'high',
      autoDetected: false,
      aiAnalysis,
      adminNotes: `Reported via command. ${aiAnalysis.recommendation}`,
    });

    replyText = `🚨 *SCAM REPORT REGISTERED SUCCESSFULLY!*\n\n` +
      `• **Case ID:** \`#${filedReport.id}\`\n` +
      `• **Reported Target:** ${scammerTarget || 'Suspicious Activity'}\n` +
      `• **Category:** ${scamCategory.toUpperCase().replace('_', ' ')}\n` +
      `• **Threat Assessment:** ${aiAnalysis.threatScore}% (${aiAnalysis.detectedTactic})\n` +
      `• **Evidence Provided:** "${evidenceText}"\n\n` +
      `🛡️ *Status:* Dispatched to security moderators. If this user is spamming or sharing malicious links, group admins will ban the account immediately.\n\n` +
      `⚠️ *Safety Reminder:* Official group admins will **NEVER** DM you first asking for crypto, money, or secret recovery phrases!`;

    buttons = [
      { text: '📜 Community Safety Rules', callbackData: '/rules' },
      { text: '🤖 Report to @notoscam', url: 'https://t.me/notoscam' },
      { text: '👨‍💼 Alert Group Admin', callbackData: 'agent' },
    ];
  } else if (isGeneralReportCommand) {
    // Case 2D: Bare /report or /scam with no arguments and no reply -> Show interactive instructions
    replyText = `🚨 *TELEGRAM GROUP SCAM REPORT CENTER*\n\n` +
      `Thank you for helping keep our community safe, ${senderName}!\n\n` +
      `📋 *How to Report a Scam in Telegram:*\n` +
      `1️⃣ **Reply to a Scam Message:** Tap reply on any fraudulent message and type \`/report\` to instantly capture the scammer's ID and evidence.\n` +
      `2️⃣ **Report an Impersonator/User:** Type \`/report @username [details of scam]\`\n` +
      `3️⃣ **Report a Fake Group/Channel:** Type \`/reportgroup [t.me/invite_link] [details]\`\n\n` +
      `🔒 *Recognizing Common Telegram Scams:*\n` +
      `• "Claim 1,000 TON / USDT Airdrop" phishing links\n` +
      `• Fake admins DMing offering "instant account verification" or asking for seed phrases\n` +
      `• High-yield crypto investment "guaranteed double in 24 hours" groups\n\n` +
      `All reports are monitored 24/7 by our Scam Shield engine and group moderators!`;

    photoUrlToUse = 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80';
    buttons = [
      { text: '🤖 Open @notoscam Bot', url: 'https://t.me/notoscam' },
      { text: '📜 Community Safety Rules', callbackData: '/rules' },
      { text: '👨‍💼 Contact Admin Desk', callbackData: 'agent' },
    ];
  } else if (
    settings.scamShield?.enabled &&
    settings.scamShield.scamKeywords?.some((kw) => trimmedLower.includes(kw.toLowerCase()))
  ) {
    // Automated scam detection based on monitored keywords/links
    const matchedKw = settings.scamShield.scamKeywords.find((kw) => trimmedLower.includes(kw.toLowerCase())) || 'fraud';
    
    // AI analysis of suspected message
    const aiAnalysis = await analyzeScamEvidence(incomingText, {
      groupTitle: actualGroupTitle,
      scammerName: senderName,
    });

    botStorage.addScamReport({
      chatId,
      groupTitle: actualGroupTitle || 'Telegram Group',
      reporterName: 'Scam Shield Bot',
      reporterUsername: 'ScamShieldBot',
      scammerName: senderName,
      scammerUsername: username,
      scammerId: senderId,
      evidenceText: incomingText,
      scamType: matchedKw.includes('wallet') || matchedKw.includes('phrase') ? 'phishing' : matchedKw.includes('wa.me') ? 'fake_admin' : 'crypto_fraud',
      status: 'verified_scam',
      severity: 'critical',
      autoDetected: true,
      aiAnalysis,
      messageId,
      adminNotes: `Auto-flagged via keyword filter: "${matchedKw}". AI detected tactic: ${aiAnalysis.detectedTactic}`,
    });

    // If auto-delete is enabled and running on live Telegram
    if (settings.scamShield.autoDeleteScamMessages && source === 'telegram' && messageId) {
      deleteTelegramMessage(chatId, messageId).catch(() => {});
    }

    replyText = `⚠️ *SCAM SHIELD ALERT: SUSPICIOUS ACTIVITY DETECTED!*\n\n` +
      `This message contains patterns associated with **Telegram cryptocurrency scams, fake giveaways, or phishing attempts**.\n\n` +
      `🔍 *AI Threat Detection:* ${aiAnalysis.detectedTactic} (${aiAnalysis.threatScore}% Risk Score)\n` +
      `• ${aiAnalysis.riskSummary}\n\n` +
      `🔒 *Member Protection:*\n` +
      `• DO NOT send funds or cryptocurrencies.\n` +
      `• DO NOT connect your crypto wallet to unverified URLs.\n` +
      `• DO NOT share your 12/24 word recovery seed phrase.\n\n` +
      `Our automated security engine has logged this incident and alerted group administrators.`;

    photoUrlToUse = 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80';
    buttons = [
      { text: '🚨 Report False Positive', callbackData: '/report' },
      { text: '📜 View Safety Rules', callbackData: '/rules' },
      { text: '🤖 Report to @notoscam', url: 'https://t.me/notoscam' },
    ];
  } else {
    // 3. Evaluate Rule Matching
    matchedRule = findMatchingRule(incomingText);
    photoUrlToUse = matchedRule?.photoUrl;

    if (matchedRule) {
      matchedRule.matchCount = (matchedRule.matchCount || 0) + 1;
      matchedRule.lastTriggeredAt = Date.now();
      botStorage.saveRule(matchedRule);

      if (matchedRule.useAI) {
        isAiGenerated = true;
        replyText = await generateGeminiReply({
          incomingText,
          senderName,
          username,
          aiPersona: settings.aiPersona,
          knowledgeBase: settings.knowledgeBase,
          ruleModifier: matchedRule.aiPromptModifier,
        });
      } else {
        replyText = replaceVariables(matchedRule.replyText, {
          firstName: senderName,
          username,
          chatId,
          messageText: incomingText,
        });
        buttons = matchedRule.buttons;
      }
    } else if (settings.fallbackToAI && settings.geminiEnabled) {
      // 4. Fallback to Gemini AI
      isAiGenerated = true;
      replyText = await generateGeminiReply({
        incomingText,
        senderName,
        username,
        aiPersona: settings.aiPersona,
        knowledgeBase: settings.knowledgeBase,
      });
    } else {
      // 5. Default Static Fallback
      replyText = replaceVariables(settings.defaultFallbackReply, {
        firstName: senderName,
        username,
        chatId,
        messageText: incomingText,
      });
    }
  }

  // If outside business hours, prepend away notice if configured
  if (isAway && settings.businessHours.awayMessage) {
    replyText = `${settings.businessHours.awayMessage}\n\n---\n${replyText}`;
  }

  const latencyMs = Date.now() - startTime;

  // If live telegram source, send reply back to chat!
  let sendStatus: 'success' | 'failed' | 'simulated' = source === 'simulator' ? 'simulated' : 'success';
  let errorDetails: string | undefined;

  if (source === 'telegram') {
    const sendRes = await sendTelegramMessage({
      chatId,
      text: replyText,
      buttons,
      replyToMessageId: messageId,
      photoUrl: photoUrlToUse || matchedRule?.photoUrl,
    });
    if (!sendRes.ok) {
      sendStatus = 'failed';
      errorDetails = sendRes.description;
    }
  }

  // Record stats & log
  botStorage.recordMessage(isAiGenerated);
  botStorage.addLog({
    direction: 'inbound',
    source,
    chatId,
    senderName,
    username,
    incomingText,
    replyText,
    photoUrl: photoUrlToUse || matchedRule?.photoUrl,
    matchedRuleId: matchedRule?.id,
    matchedRuleName: matchedRule ? matchedRule.name : (isGeneralReportCommand ? '🚨 Scam Report Center' : isAiGenerated ? 'Gemini AI Fallback' : 'Default Fallback'),
    isAiGenerated,
    status: sendStatus,
    errorDetails,
    latencyMs,
  });

  return {
    replyText,
    photoUrl: photoUrlToUse || matchedRule?.photoUrl,
    matchedRule,
    isAiGenerated,
    buttons,
    isBusinessHoursAway: isAway,
    latencyMs,
  };
}

export async function processTelegramWebhookUpdate(update: any) {
  if (!update) return;

  // Handle standard message or media with caption
  if (update.message && (update.message.text || update.message.caption)) {
    const msg = update.message;
    const chatId = msg.chat.id;
    const senderName = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') || 'Telegram User';
    const username = msg.from?.username;
    const incomingText = msg.text || msg.caption || '';
    const groupTitle = msg.chat?.title;
    const senderId = msg.from?.id;
    const chatType = msg.chat?.type;

    let replyToMessage: any = undefined;
    if (msg.reply_to_message) {
      const rep = msg.reply_to_message;
      replyToMessage = {
        messageId: rep.message_id,
        senderName: [rep.from?.first_name, rep.from?.last_name].filter(Boolean).join(' ') || 'Telegram Member',
        username: rep.from?.username,
        userId: rep.from?.id,
        text: rep.text || rep.caption || (rep.photo ? '[Photo Attachment]' : '[Document / Media]'),
      };
    }

    await processIncomingMessage({
      chatId,
      senderName,
      username,
      senderId,
      groupTitle,
      chatType,
      incomingText,
      source: 'telegram',
      messageId: msg.message_id,
      replyToMessage,
    });
  } else if (update.callback_query) {
    // Handle inline button click callback
    const cb = update.callback_query;
    const chatId = cb.message?.chat?.id;
    const senderName = [cb.from?.first_name, cb.from?.last_name].filter(Boolean).join(' ') || 'Telegram User';
    const incomingText = cb.data || '';
    const groupTitle = cb.message?.chat?.title;

    if (chatId) {
      await processIncomingMessage({
        chatId,
        senderName,
        username: cb.from?.username,
        senderId: cb.from?.id,
        groupTitle,
        incomingText,
        source: 'telegram',
      });
    }
  }
}

// Long Polling Runner
export function startPolling() {
  if (isPollingActive) return;
  isPollingActive = true;

  const poll = async () => {
    const settings = botStorage.getSettings();
    if (!isPollingActive || settings.mode !== 'polling' || !settings.botToken) {
      stopPolling();
      return;
    }

    try {
      const url = `https://api.telegram.org/bot${settings.botToken}/getUpdates?offset=${lastUpdateId + 1}&timeout=15`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          if (update.update_id >= lastUpdateId) {
            lastUpdateId = update.update_id;
          }
          await processTelegramWebhookUpdate(update);
        }
      }
    } catch (err) {
      console.error('Error during Telegram long polling:', err);
    } finally {
      if (isPollingActive) {
        pollingInterval = setTimeout(poll, 1500);
      }
    }
  };

  poll();
}

export function stopPolling() {
  isPollingActive = false;
  if (pollingInterval) {
    clearTimeout(pollingInterval);
    pollingInterval = null;
  }
}
