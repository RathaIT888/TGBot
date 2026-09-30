export type TriggerType = 'exact' | 'contains' | 'startsWith' | 'regex' | 'command' | 'default' | 'welcome';

export type ResponseType = 'text' | 'ai';

export interface InlineButton {
  text: string;
  url?: string;
  callbackData?: string;
}

export interface AutoReplyRule {
  id: string;
  name: string;
  enabled: boolean;
  triggerType: TriggerType;
  patterns: string[]; // keywords or commands
  caseSensitive?: boolean;
  replyText: string;
  photoUrl?: string; // Poster or image attachment URL / data URI
  useAI?: boolean;
  aiPromptModifier?: string;
  buttons?: InlineButton[];
  businessHoursOnly?: boolean;
  matchCount: number;
  lastTriggeredAt?: number | null;
  priority: number;
}

export interface BusinessHoursConfig {
  enabled: boolean;
  timezone: string;
  startHour: number; // 0-23
  startMinute: number;
  endHour: number; // 0-23
  endMinute: number;
  workDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  awayMessage: string;
}

export interface TelegramBotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
}

export interface ScamShieldConfig {
  enabled: boolean;
  autoWarnInGroups: boolean;
  autoDeleteScamMessages: boolean;
  adminAlertChatId?: string;
  scamKeywords: string[];
  bannedLinks: string[];
  autoAnalyzeWithAI?: boolean;
}

export interface BotSettings {
  botToken: string;
  botInfo: TelegramBotInfo | null;
  mode: 'polling' | 'webhook' | 'simulator_only';
  webhookUrl: string;
  geminiEnabled: boolean;
  geminiModel: string;
  aiPersona: string;
  knowledgeBase: string;
  fallbackToAI: boolean;
  defaultFallbackReply: string;
  businessHours: BusinessHoursConfig;
  enableTypingAction: boolean;
  scamShield?: ScamShieldConfig;
}

export interface ScamReport {
  id: string;
  timestamp: number;
  chatId: string | number;
  groupTitle?: string;
  reporterName: string;
  reporterUsername?: string;
  reporterId?: string | number;
  scammerName?: string;
  scammerUsername?: string;
  scammerId?: string | number;
  scamLinkOrChannel?: string;
  evidenceText: string;
  evidencePhotoUrl?: string;
  messageId?: number;
  scamType: 'phishing' | 'crypto_fraud' | 'fake_admin' | 'investment_scam' | 'malicious_link' | 'fake_group' | 'other';
  status: 'pending' | 'verified_scam' | 'banned' | 'dismissed';
  severity: 'critical' | 'high' | 'medium' | 'low';
  adminNotes?: string;
  autoDetected?: boolean;
  aiAnalysis?: {
    threatScore: number;
    detectedTactic: string;
    riskSummary: string;
    recommendation: string;
  };
}

export interface MessageLog {
  id: string;
  timestamp: number;
  direction: 'inbound' | 'outbound';
  source: 'telegram' | 'simulator';
  chatId: string | number;
  senderName: string;
  username?: string;
  incomingText?: string;
  replyText: string;
  photoUrl?: string;
  matchedRuleId?: string;
  matchedRuleName?: string;
  isAiGenerated?: boolean;
  status: 'success' | 'failed' | 'simulated';
  errorDetails?: string;
  latencyMs?: number;
}

export interface BotStats {
  totalMessagesReceived: number;
  totalRepliesSent: number;
  aiRepliesCount: number;
  activeRulesCount: number;
  lastActiveAt: number | null;
  uptimeSeconds: number;
  scamReportsCount?: number;
  scamsBlockedCount?: number;
}

export interface SimulateRequest {
  text: string;
  senderName?: string;
  username?: string;
  chatId?: string | number;
}

export interface SimulateResponse {
  replyText: string;
  photoUrl?: string;
  matchedRule?: AutoReplyRule | null;
  isAiGenerated: boolean;
  buttons?: InlineButton[];
  isBusinessHoursAway?: boolean;
  latencyMs: number;
}
