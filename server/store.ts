import { AutoReplyRule, BotSettings, BotStats, MessageLog, ScamReport } from '../src/types.js';

export const DEFAULT_RULES: AutoReplyRule[] = [
  {
    id: 'rule-welcome',
    name: '👋 Welcome Message & Poster (/start)',
    enabled: true,
    triggerType: 'welcome',
    patterns: ['/start', 'start', 'halo', 'hi', 'hello'],
    caseSensitive: false,
    replyText: '👋 Hello {first_name}! Welcome to our Official Auto-Reply Service.\n\nI can help you with product info, order inquiries, and instant FAQs 24/7.\n\n👇 Tap below or type a question to get started!',
    photoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    useAI: false,
    buttons: [
      { text: '🌐 Visit Website', url: 'https://telegram.org' },
      { text: '📋 View Menu', callbackData: '/menu' },
      { text: '💬 Support Agent', callbackData: 'agent' },
    ],
    priority: 1,
    matchCount: 14,
    lastTriggeredAt: Date.now() - 3600000,
  },
  {
    id: 'rule-report-scam',
    name: '🚨 Report Group Scam (/report, /scam)',
    enabled: true,
    triggerType: 'command',
    patterns: ['/report', '/scam', 'report', 'scam', 'penipuan', 'lapor scam', 'fake admin'],
    caseSensitive: false,
    replyText: '🚨 *TELEGRAM GROUP SCAM REPORT CENTER*\n\nThank you for alerting our security team, {first_name}!\n\n📋 *How to Report Evidence:*\n1️⃣ Reply directly to the fraudulent message with `/report <reason>`\n2️⃣ Or type: `/report @username [description of scam]`\n\n🛡️ *Official Safety Rules:*\n❌ Admins will NEVER DM you first or ask for private seed words or funds.\n❌ Never transfer crypto to unverified addresses.\n\nOur Scam Shield moderators have registered your report for immediate audit!',
    photoUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
    useAI: false,
    buttons: [
      { text: '🚨 File Scam Report', callbackData: '/report' },
      { text: '📜 Community Safety Rules', callbackData: '/rules' },
      { text: '👨‍💼 Alert Group Admin', callbackData: 'agent' },
    ],
    priority: 3,
    matchCount: 16,
    lastTriggeredAt: Date.now() - 1800000,
  },
  {
    id: 'rule-anti-phishing-shield',
    name: '🛡️ Automated Phishing & Scam Warning',
    enabled: true,
    triggerType: 'contains',
    patterns: ['seed phrase', 'connect wallet', 'validation node', 'airdrop claim', 'guaranteed profit', 'double your crypto', 'whatsapp admin', 'wa.me/'],
    caseSensitive: false,
    replyText: '⚠️ *AUTOMATED SCAM SHIELD WARNING!*\n\nThis message contains keywords associated with **known cryptocurrency scams, phishing links, or impersonation fraud**.\n\n🔒 *Protection Advice:*\n• Never share your 12/24 secret recovery seed words.\n• Admins will never ask for payment or login credentials.\n• Type `/report` to flag fraudulent users.',
    useAI: false,
    buttons: [
      { text: '🚨 Report This User', callbackData: '/report' },
      { text: '🛡️ Security Guide', callbackData: '/rules' },
    ],
    priority: 4,
    matchCount: 27,
    lastTriggeredAt: Date.now() - 900000,
  },
  {
    id: 'rule-promo-poster',
    name: '🎁 Promo & Sale Poster',
    enabled: true,
    triggerType: 'contains',
    patterns: ['poster', 'promo', 'sale', 'voucher', 'discount', 'banner'],
    caseSensitive: false,
    replyText: '🎁 *Flash Sale Discount Poster!*\n\nGrab 25% OFF all subscriptions with code *SUPER25*.\nLimited time offer valid for new signups this week!\n\nCheck out the deals below:',
    photoUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=80',
    useAI: false,
    buttons: [
      { text: '🛒 Claim 25% Voucher', url: 'https://example.com/promo' },
      { text: '💎 View Pricing', callbackData: 'price' },
    ],
    priority: 15,
    matchCount: 9,
    lastTriggeredAt: Date.now() - 4200000,
  },
  {
    id: 'rule-menu',
    name: '📋 Main Menu & Services',
    enabled: true,
    triggerType: 'exact',
    patterns: ['/menu', 'menu', 'options', 'layanan'],
    caseSensitive: false,
    replyText: '✨ Here are the quick services available:\n\n• 🛍️ *Pricing & Plans* - type `pricing`\n• 📦 *Order Tracking* - type `order`\n• ⏰ *Operating Hours* - type `hours`\n• 🎁 *Discounts & Promo* - type `promo`\n• 🤖 *AI Question* - ask any general question!',
    useAI: false,
    buttons: [
      { text: '🛍️ Pricing', callbackData: 'pricing' },
      { text: '📦 Track Order', callbackData: 'order' },
    ],
    priority: 20,
    matchCount: 8,
    lastTriggeredAt: Date.now() - 7200000,
  },
  {
    id: 'rule-pricing',
    name: '💎 Pricing & Plans Inquiries',
    enabled: true,
    triggerType: 'contains',
    patterns: ['price', 'pricing', 'cost', 'harga', 'paket', 'rate'],
    caseSensitive: false,
    replyText: '💎 *Our Standard Plans:*\n\n1. 🥉 *Starter*: $15/month (Up to 1,000 auto-replies)\n2. 🥈 *Pro*: $39/month (Unlimited replies + Smart AI)\n3. 🥇 *Enterprise*: Custom solutions & dedicated webhook\n\nAll plans include 14-day free trial.',
    useAI: false,
    buttons: [
      { text: '💳 Subscribe Now', url: 'https://example.com/pricing' },
      { text: '📞 Talk to Sales', callbackData: 'agent' },
    ],
    priority: 30,
    matchCount: 22,
    lastTriggeredAt: Date.now() - 1800000,
  },
  {
    id: 'rule-shipping',
    name: '📦 Order Status & Tracking',
    enabled: true,
    triggerType: 'contains',
    patterns: ['order', 'track', 'tracking', 'shipping', 'resi', 'status pesanan'],
    caseSensitive: false,
    replyText: '📦 *Order Tracking Assistance*\n\nPlease reply with your 6-digit Order Number (e.g., #TR-8821) or tracking code.\n\nOur automated system syncs updates every 15 minutes. Regular delivery takes 1-3 business days.',
    useAI: false,
    buttons: [
      { text: '🔎 Order Lookup Portal', url: 'https://example.com/orders' },
    ],
    priority: 40,
    matchCount: 19,
    lastTriggeredAt: Date.now() - 1200000,
  },
  {
    id: 'rule-human-support',
    name: '👨‍💼 Connect with Human Support',
    enabled: true,
    triggerType: 'contains',
    patterns: ['agent', 'human', 'support', 'cs', 'operator', 'bantuan'],
    caseSensitive: false,
    replyText: '👨‍💼 *Connecting to Customer Care Representative*\n\nYour chat session #{chat_id} has been prioritized for our live support team.\n\nEstimated response time: *under 5 minutes* during operating hours.\nPlease leave a brief description of your issue!',
    useAI: false,
    priority: 50,
    matchCount: 11,
    lastTriggeredAt: Date.now() - 5400000,
  },
  {
    id: 'rule-hours',
    name: '🕒 Business Hours',
    enabled: true,
    triggerType: 'contains',
    patterns: ['hours', 'jam buka', 'schedule', 'open', 'operating time'],
    caseSensitive: false,
    replyText: '🕒 *Operating Hours:*\n\n• Monday - Friday: 08:00 AM - 08:00 PM\n• Saturday: 09:00 AM - 05:00 PM\n• Sunday & Holidays: AI Automated Support Only\n\nOur Telegram AI bot is active 24/7 to answer your inquiries!',
    useAI: false,
    priority: 60,
    matchCount: 6,
    lastTriggeredAt: Date.now() - 9000000,
  },
  {
    id: 'rule-ai-assistant',
    name: '🧠 Smart AI Question Handler',
    enabled: true,
    triggerType: 'startsWith',
    patterns: ['/ai', '!ai', 'ask', 'tanya', 'how to', 'what is'],
    caseSensitive: false,
    replyText: 'Processing with Gemini AI...',
    useAI: true,
    aiPromptModifier: 'Answer this customer query with authority using our company context. Keep it concise, friendly, and structured.',
    priority: 70,
    matchCount: 35,
    lastTriggeredAt: Date.now() - 300000,
  },
];

export const PRESETS: Record<string, { name: string; description: string; rules: AutoReplyRule[] }> = {
  customer_support: {
    name: 'Customer Support Desk',
    description: 'Designed for ticketing, FAQs, operating hours, and human agent handoff.',
    rules: DEFAULT_RULES,
  },
  ecommerce: {
    name: 'E-Commerce & Online Store',
    description: 'Tailored for retail: product catalog, discounts, payment options, and delivery tracking.',
    rules: [
      {
        id: 'eco-welcome',
        name: '🛍️ Store Welcome',
        enabled: true,
        triggerType: 'welcome',
        patterns: ['/start', 'hello', 'halo'],
        replyText: '🛍️ Welcome to *ShopEase Telegram Store*, {first_name}!\n\nUse discount code *WELCOME10* for 10% off your first checkout.\n\nWhat are you shopping for today?',
        buttons: [
          { text: '🔥 Hot Deals', url: 'https://example.com/deals' },
          { text: '🛍️ Product Catalog', callbackData: 'catalog' },
        ],
        priority: 10,
        matchCount: 0,
      },
      {
        id: 'eco-catalog',
        name: '📱 Product Categories',
        enabled: true,
        triggerType: 'contains',
        patterns: ['catalog', 'katalog', 'products', 'produk', 'items'],
        replyText: '📦 *Featured Categories:*\n• 📱 Smartphones & Gadgets\n• 💻 Laptops & Workstations\n• 🎧 Audio & Wearables\n• 🏠 Smart Home\n\nType the name of any product to check stock!',
        buttons: [{ text: 'Browse Online', url: 'https://example.com' }],
        priority: 20,
        matchCount: 0,
      },
      {
        id: 'eco-payment',
        name: '💳 Payment Methods',
        enabled: true,
        triggerType: 'contains',
        patterns: ['pay', 'payment', 'transfer', 'credit card', 'qris', 'bayar'],
        replyText: '💳 We accept:\n• Credit / Debit Cards (Visa, Mastercard)\n• Instant Bank Transfer\n• QRIS & E-Wallets\n• Cash on Delivery (selected areas)',
        priority: 30,
        matchCount: 0,
      },
      {
        id: 'eco-shipping',
        name: '🚚 Delivery & Tracking',
        enabled: true,
        triggerType: 'contains',
        patterns: ['shipping', 'delivery', 'ongkir', 'resi', 'track'],
        replyText: '🚚 Free shipping on orders over $50!\nStandard shipping: 2-4 business days.\nExpress delivery: Next day.\nReply with your order number to track current package transit.',
        priority: 40,
        matchCount: 0,
      },
    ],
  },
  community: {
    name: 'Community & Group Chat Moderator',
    description: 'Rules for group onboarding, community rules, admins list, and spam warnings.',
    rules: [
      {
        id: 'comm-welcome',
        name: '🎉 Welcome New Members',
        enabled: true,
        triggerType: 'welcome',
        patterns: ['/start', 'welcome'],
        replyText: '👋 Welcome to the community, {first_name}!\nPlease read our /rules before chatting. Introduce yourself and enjoy the discussions!',
        buttons: [
          { text: '📜 Community Rules', callbackData: '/rules' },
          { text: '🌐 Official Website', url: 'https://example.com' },
        ],
        priority: 10,
        matchCount: 0,
      },
      {
        id: 'comm-rules',
        name: '📜 Community Guidelines',
        enabled: true,
        triggerType: 'exact',
        patterns: ['/rules', 'rules', 'aturan'],
        replyText: '📜 *Community Rules:*\n1. Be respectful to all members\n2. No unsolicited spam, promotions, or scams\n3. Keep discussions in the relevant topics\n4. Respect moderator instructions\nViolations will result in warnings or bans.',
        priority: 20,
        matchCount: 0,
      },
      {
        id: 'comm-admins',
        name: '🛡️ Admins List',
        enabled: true,
        triggerType: 'exact',
        patterns: ['/admin', '/admins', 'admin', 'moderator'],
        replyText: '🛡️ *Community Admins:*\n• @CommunityLead\n• @ModTeamBot\n\nNever send crypto, passwords, or personal keys to anyone claiming to be staff!',
        priority: 30,
        matchCount: 0,
      },
    ],
  },
  scam_shield: {
    name: '🛡️ Group Scam Shield & Moderator',
    description: 'Protect groups against phishing, impersonation, investment scams, and enable member /report command.',
    rules: [
      {
        id: 'scam-report-cmd',
        name: '🚨 Member Scam Reporting (/report)',
        enabled: true,
        triggerType: 'command',
        patterns: ['/report', '/scam', 'report', 'scam', 'penipuan'],
        replyText: '🚨 *SCAM INCIDENT REPORT FILED*\n\nThank you {first_name}! Your report has been dispatched to community moderators.\n\n• Please do not interact with the suspicious account.\n• Admins will never request funds or seed phrases.',
        photoUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
        buttons: [
          { text: '📜 Anti-Scam Rules', callbackData: '/rules' },
          { text: '👨‍💼 Contact Admin', callbackData: 'agent' },
        ],
        priority: 2,
        matchCount: 0,
      },
      {
        id: 'scam-warning-auto',
        name: '⚠️ Phishing & Fraud Auto-Warning',
        enabled: true,
        triggerType: 'contains',
        patterns: ['seed phrase', 'connect wallet', 'airdrop claim', 'guaranteed profit', 'double your crypto', 'whatsapp me', 'wa.me/'],
        replyText: '⚠️ *SCAM ALERT DETECTED*\n\nThis message contains keywords typical of crypto scams or phishing attempts.\n\n🚫 Do not click external links or send funds!',
        priority: 3,
        matchCount: 0,
      },
      {
        id: 'scam-rules',
        name: '📜 Community Safety Rules',
        enabled: true,
        triggerType: 'exact',
        patterns: ['/rules', 'rules', 'safety'],
        replyText: '🛡️ *Community Safety Guidelines:*\n1. Zero tolerance for unverified investment or airdrop links\n2. Staff will NEVER message you first in private\n3. Report scammers with /report\nViolations result in immediate bans.',
        priority: 20,
        matchCount: 0,
      },
    ],
  },
};

export const DEFAULT_SETTINGS: BotSettings = {
  botToken: '',
  botInfo: null,
  mode: 'simulator_only',
  webhookUrl: '',
  geminiEnabled: true,
  geminiModel: 'gemini-3.8-flash',
  aiPersona: 'You are an intelligent, polite, and helpful auto-reply customer support agent for TeleReply Services. You answer user questions concisely and clearly with well-formatted Telegram bullet points and appropriate emojis.',
  knowledgeBase: `
Company Name: TeleReply Solutions
Products: 
- Cloud Auto-Reply Bot Suite ($15/mo)
- Smart AI Telegram Agent ($39/mo)
- Enterprise Multi-Channel Support (Custom)
Business Hours: Monday to Friday 8:00 AM - 8:00 PM EST, Saturday 9:00 AM - 5:00 PM EST.
Support Email: support@telereply.example.com
Refund Policy: 14-day 100% money-back guarantee on all subscription plans.
Features: Instant keyword match, regex patterns, rich inline buttons, Gemini AI integration, real-time message analytics.
`.trim(),
  fallbackToAI: true,
  defaultFallbackReply: "🤖 Thank you for your message, {first_name}! Our automated assistant has noted your query: \"{message}\". For immediate menu options, type /menu or type 'agent' to speak with a human.",
  businessHours: {
    enabled: false,
    timezone: 'America/New_York',
    startHour: 9,
    startMinute: 0,
    endHour: 18,
    endMinute: 0,
    workDays: [1, 2, 3, 4, 5], // Mon-Fri
    awayMessage: '🌙 *We are currently outside of business hours.*\n\nOur normal hours are Monday to Friday, 9:00 AM - 6:00 PM EST. Your message has been saved, and an agent will reply first thing in the morning!\n\nIn the meantime, our 24/7 AI assistant is available to help.',
  },
  enableTypingAction: true,
  scamShield: {
    enabled: true,
    autoWarnInGroups: true,
    autoDeleteScamMessages: false,
    scamKeywords: [
      'seed phrase',
      'private key',
      'connect wallet',
      'airdrop claim',
      'validation node',
      'guaranteed profit',
      'double your crypto',
      'telegram support lead',
      'official admin dm',
      'wa.me/',
      'whatsapp me',
      't.me/+',
    ],
    bannedLinks: [
      'claim-ton.xyz',
      'airdrop-gift.co',
      'wallet-connect-fix.net',
      'tele-support-official.com',
    ],
  },
};

class BotStorage {
  private rules: AutoReplyRule[] = [...DEFAULT_RULES];
  private settings: BotSettings = { ...DEFAULT_SETTINGS };
  private logs: MessageLog[] = [];
  private scamReports: ScamReport[] = [];
  private stats: BotStats = {
    totalMessagesReceived: 56,
    totalRepliesSent: 56,
    aiRepliesCount: 18,
    activeRulesCount: DEFAULT_RULES.filter(r => r.enabled).length,
    lastActiveAt: Date.now() - 120000,
    uptimeSeconds: 0,
    scamReportsCount: 3,
    scamsBlockedCount: 27,
  };
  private startTime = Date.now();

  constructor() {
    this.seedMockLogs();
    this.seedMockScamReports();
  }

  private seedMockScamReports() {
    const now = Date.now();
    this.scamReports = [
      {
        id: 'scam-rep-1',
        timestamp: now - 1800000,
        chatId: -10018829910,
        groupTitle: 'Official Telegram Crypto Community',
        reporterName: 'David Miller',
        reporterUsername: 'dmiller',
        reporterId: 54199,
        scammerName: 'Airdrop Gift Admin',
        scammerUsername: 'airdrop_claim_support',
        scammerId: 981123,
        evidenceText: 'Claim 500 TON free reward now! Connect your wallet at http://ton-gift-airdrop.xyz to validate node.',
        scamType: 'phishing',
        status: 'verified_scam',
        severity: 'critical',
        adminNotes: 'Phishing domain reported to registrar. Account restricted in group.',
        autoDetected: true,
      },
      {
        id: 'scam-rep-2',
        timestamp: now - 5400000,
        chatId: -10018829910,
        groupTitle: 'Official Telegram Crypto Community',
        reporterName: 'Sarah Jenkins',
        reporterUsername: 'sarah_j',
        reporterId: 54100,
        scammerName: 'Telegram Helpdesk Lead',
        scammerUsername: 'tele_official_desk',
        scammerId: 772819,
        evidenceText: 'DM me directly for fast refund and customer support. Send $50 deposit to verify transaction.',
        scamType: 'fake_admin',
        status: 'banned',
        severity: 'high',
        adminNotes: 'Impersonating admin staff. Banned from group.',
        autoDetected: false,
      },
      {
        id: 'scam-rep-3',
        timestamp: now - 10800000,
        chatId: -10019933441,
        groupTitle: 'Traders Global Chat',
        reporterName: 'Alex Chen',
        reporterUsername: 'alexchen88',
        reporterId: 54101,
        scammerName: 'Guaranteed Yields VIP',
        scammerUsername: 'vip_profit_daily',
        scammerId: 663112,
        evidenceText: 'Join VIP pump signals wa.me/19823912903 - 500% profit guaranteed within 24 hours!',
        scamType: 'investment_scam',
        status: 'pending',
        severity: 'high',
        adminNotes: 'Under review by moderator team.',
        autoDetected: true,
      },
    ];
  }

  private seedMockLogs() {
    const mockEvents: Array<{ sender: string; user: string; text: string; reply: string; rule: string; isAi: boolean }> = [
      {
        sender: 'Sarah Jenkins',
        user: 'sarah_j',
        text: '/start',
        reply: '👋 Hello Sarah Jenkins! Welcome to our Official Auto-Reply Service...',
        rule: '👋 Welcome Message (/start)',
        isAi: false,
      },
      {
        sender: 'Alex Chen',
        user: 'alexchen88',
        text: 'What are your pricing plans?',
        reply: '💎 Our Standard Plans:\n1. Starter: $15/month\n2. Pro: $39/month...',
        rule: '💎 Pricing & Plans Inquiries',
        isAi: false,
      },
      {
        sender: 'Maria Garcia',
        user: 'm_garcia',
        text: 'How can I connect my existing webhook to Telegram?',
        reply: 'To connect your Telegram webhook, you can use the Telegram Bot API setWebhook endpoint or toggle to Webhook mode in the TeleReply settings tab...',
        rule: '🧠 Smart AI Question Handler',
        isAi: true,
      },
      {
        sender: 'David Miller',
        user: 'dmiller',
        text: 'I want to speak with a real human agent please',
        reply: '👨‍💼 Connecting to Customer Care Representative. Your chat session #54199 has been prioritized...',
        rule: '👨‍💼 Connect with Human Support',
        isAi: false,
      },
    ];

    const now = Date.now();
    mockEvents.forEach((ev, idx) => {
      this.logs.unshift({
        id: `mock-log-${idx}`,
        timestamp: now - (idx + 1) * 300000,
        direction: 'inbound',
        source: 'telegram',
        chatId: 54100 + idx,
        senderName: ev.sender,
        username: ev.user,
        incomingText: ev.text,
        replyText: ev.reply,
        matchedRuleName: ev.rule,
        isAiGenerated: ev.isAi,
        status: 'success',
        latencyMs: ev.isAi ? 480 : 42,
      });
    });
  }

  getRules(): AutoReplyRule[] {
    return this.rules;
  }

  getWelcomeRule(): AutoReplyRule | undefined {
    return this.rules.find(r => r.triggerType === 'welcome') || this.rules.find(r => r.patterns.includes('/start'));
  }

  getRuleById(id: string): AutoReplyRule | undefined {
    return this.rules.find(r => r.id === id);
  }

  saveRule(rule: AutoReplyRule): AutoReplyRule {
    const idx = this.rules.findIndex(r => r.id === rule.id);
    if (idx >= 0) {
      this.rules[idx] = rule;
    } else {
      this.rules.push(rule);
    }
    this.updateStats();
    return rule;
  }

  deleteRule(id: string): boolean {
    const initLen = this.rules.length;
    this.rules = this.rules.filter(r => r.id !== id);
    this.updateStats();
    return this.rules.length < initLen;
  }

  loadPreset(presetKey: string): AutoReplyRule[] {
    const preset = PRESETS[presetKey];
    if (preset) {
      this.rules = JSON.parse(JSON.stringify(preset.rules));
      this.updateStats();
    }
    return this.rules;
  }

  getSettings(): BotSettings {
    return this.settings;
  }

  updateSettings(partial: Partial<BotSettings>): BotSettings {
    this.settings = { ...this.settings, ...partial };
    return this.settings;
  }

  getStats(): BotStats {
    this.stats.uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    this.stats.activeRulesCount = this.rules.filter(r => r.enabled).length;
    this.stats.scamReportsCount = this.scamReports.length;
    const warningRule = this.rules.find(r => r.id === 'rule-anti-phishing-shield');
    this.stats.scamsBlockedCount = warningRule ? warningRule.matchCount : 27;
    return this.stats;
  }

  getScamReports(): ScamReport[] {
    return this.scamReports;
  }

  addScamReport(report: Omit<ScamReport, 'id' | 'timestamp'>): ScamReport {
    const newReport: ScamReport = {
      ...report,
      id: `scam-rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
    };
    this.scamReports.unshift(newReport);
    if (this.scamReports.length > 300) {
      this.scamReports = this.scamReports.slice(0, 300);
    }
    this.stats.scamReportsCount = this.scamReports.length;
    return newReport;
  }

  updateScamReport(id: string, partial: Partial<ScamReport>): ScamReport | null {
    const idx = this.scamReports.findIndex(r => r.id === id);
    if (idx >= 0) {
      this.scamReports[idx] = { ...this.scamReports[idx], ...partial };
      return this.scamReports[idx];
    }
    return null;
  }

  deleteScamReport(id: string): boolean {
    const initialLen = this.scamReports.length;
    this.scamReports = this.scamReports.filter(r => r.id !== id);
    this.stats.scamReportsCount = this.scamReports.length;
    return this.scamReports.length < initialLen;
  }

  clearScamReports(): void {
    this.scamReports = [];
    this.stats.scamReportsCount = 0;
  }

  recordMessage(isAi: boolean = false) {
    this.stats.totalMessagesReceived++;
    this.stats.totalRepliesSent++;
    if (isAi) {
      this.stats.aiRepliesCount++;
    }
    this.stats.lastActiveAt = Date.now();
  }

  private updateStats() {
    this.stats.activeRulesCount = this.rules.filter(r => r.enabled).length;
  }

  getLogs(limit = 100): MessageLog[] {
    return this.logs.slice(0, limit);
  }

  addLog(log: Omit<MessageLog, 'id' | 'timestamp'>): MessageLog {
    const newLog: MessageLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    this.logs.unshift(newLog);
    if (this.logs.length > 500) {
      this.logs = this.logs.slice(0, 500);
    }
    return newLog;
  }

  clearLogs() {
    this.logs = [];
  }
}

const mediaStorage = new Map<string, { buffer: Buffer; mimeType: string; filename: string }>();

export function saveMedia(buffer: Buffer, mimeType: string, filename: string): string {
  const id = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  mediaStorage.set(id, { buffer, mimeType, filename });
  return id;
}

export function getMedia(id: string) {
  return mediaStorage.get(id);
}

export const botStorage = new BotStorage();
