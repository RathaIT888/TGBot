import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface GenerateTelegramReplyParams {
  incomingText: string;
  senderName: string;
  username?: string;
  aiPersona?: string;
  knowledgeBase?: string;
  ruleModifier?: string;
  recentHistory?: Array<{ role: 'user' | 'model'; text: string }>;
}

export async function generateGeminiReply(params: GenerateTelegramReplyParams): Promise<string> {
  const ai = getAIClient();
  if (!ai) {
    return "Thank you for reaching out! Our AI auto-reply is currently awaiting an API key. A team member will assist you shortly.";
  }

  const {
    incomingText,
    senderName,
    username,
    aiPersona = 'You are a friendly, helpful, and concise Telegram customer auto-reply bot. Keep responses crisp and formatted well for mobile chat. Use emojis moderately and bullet points when listing options.',
    knowledgeBase = '',
    ruleModifier = '',
    recentHistory = [],
  } = params;

  const systemInstruction = `
${aiPersona}

${knowledgeBase ? `--- KNOWLEDGE BASE & FACTS ---\n${knowledgeBase}\n--- END KNOWLEDGE BASE ---` : ''}

${ruleModifier ? `Special guideline for this topic: ${ruleModifier}` : ''}

Guidelines for Telegram formatting:
- Keep responses friendly, clear, and easy to read on mobile screens (typically 1-3 paragraphs or short bullet points).
- The user's name is ${senderName}${username ? ` (@${username})` : ''}.
- If you don't know the exact answer from the knowledge base, politely state how they can reach a human operator or leave their details.
- Avoid markdown that might break in Telegram. Plain text or standard bullet points like • are preferred.
`.trim();

  try {
    const contents: any[] = [];

    // Add recent history if provided
    for (const h of recentHistory.slice(-4)) {
      contents.push({
        role: h.role === 'model' ? 'model' : 'user',
        parts: [{ text: h.text }],
      });
    }

    // Add current incoming message
    contents.push({
      role: 'user',
      parts: [
        {
          text: `Message from ${senderName}: "${incomingText}"`,
        },
      ],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text?.trim();
    if (!reply) {
      return "Hello! I received your message. How can I help you today?";
    }
    return reply;
  } catch (error: any) {
    console.error('Error calling Gemini API for Telegram auto-reply:', error);
    return `Hello ${senderName}! Thank you for your message. We have received your query: "${incomingText}". Our team will reply shortly.`;
  }
}

export interface ScamAnalysisResult {
  threatScore: number;
  detectedTactic: string;
  riskSummary: string;
  recommendation: string;
}

function heuristicScamAnalysis(evidenceText: string): ScamAnalysisResult {
  const lower = evidenceText.toLowerCase();
  if (lower.includes('seed') || lower.includes('private key') || lower.includes('phrase')) {
    return {
      threatScore: 98,
      detectedTactic: 'Seed Phrase & Private Key Theft',
      riskSummary: 'Direct credential theft. Fraudsters steal wallet recovery phrases to empty crypto balances.',
      recommendation: 'Ban member permanently and post immediate warning to all members.',
    };
  }
  if (lower.includes('airdrop') || lower.includes('claim') || lower.includes('free ton') || lower.includes('ton-gift') || lower.includes('.xyz')) {
    return {
      threatScore: 94,
      detectedTactic: 'Fake Airdrop & Wallet Drainer Phishing',
      riskSummary: 'Phishing domain that prompts users to connect wallets and sign drainer smart contracts.',
      recommendation: 'Delete scam link immediately and ban offending account.',
    };
  }
  if (lower.includes('admin') || lower.includes('support') || lower.includes('helpdesk') || lower.includes('dm me')) {
    return {
      threatScore: 88,
      detectedTactic: 'Staff / Admin Impersonation Fraud',
      riskSummary: 'Impersonating official administrators or support staff to lure members into private chat scams.',
      recommendation: 'Ban user and remind group that real staff never direct-messages first.',
    };
  }
  if (lower.includes('t.me/') || lower.includes('group') || lower.includes('channel')) {
    return {
      threatScore: 85,
      detectedTactic: 'Cloned Telegram Scam Group / Channel',
      riskSummary: 'Unverified Telegram group or channel clone designed to siphon users into fraudulent schemes.',
      recommendation: 'Forward link to @notoscam and report for abuse takedown.',
    };
  }
  if (lower.includes('profit') || lower.includes('guaranteed') || lower.includes('double') || lower.includes('yield') || lower.includes('wa.me')) {
    return {
      threatScore: 92,
      detectedTactic: 'High-Yield Investment / Ponzi Scheme',
      riskSummary: 'Classic advance-fee or Ponzi scheme promising unrealistic returns on cryptocurrency.',
      recommendation: 'Delete promotional post and block member from chatting.',
    };
  }
  return {
    threatScore: 75,
    detectedTactic: 'Suspicious Telegram Group Activity',
    riskSummary: 'User reported suspicious behavior or unsolicited financial/service offer.',
    recommendation: 'Audit recent member activity and restrict sending links if unverified.',
  };
}

export async function analyzeScamEvidence(evidenceText: string, metadata?: { groupTitle?: string; scammerName?: string }): Promise<ScamAnalysisResult> {
  const fallback = heuristicScamAnalysis(evidenceText);
  const ai = getAIClient();
  if (!ai) {
    return fallback;
  }

  const prompt = `You are a cybersecurity expert analyzing a reported Telegram group scam or phishing message.
Evidence:
"""
${evidenceText}
"""
${metadata?.groupTitle ? `Group Title: "${metadata.groupTitle}"` : ''}
${metadata?.scammerName ? `Target: "${metadata.scammerName}"` : ''}

Respond with a JSON object:
{
  "threatScore": number (0-100),
  "detectedTactic": "string (e.g. Phishing Link, Seed Phrase Theft, Admin Impersonator, Fake Group Clone, Crypto Doubler)",
  "riskSummary": "1-2 sentence risk explanation",
  "recommendation": "1 concise recommendation"
}`;

  try {
    const aiPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    }).then((res) => {
      const text = res.text?.trim() || '{}';
      const parsed = JSON.parse(text);
      return {
        threatScore: typeof parsed.threatScore === 'number' ? Math.min(100, Math.max(0, parsed.threatScore)) : fallback.threatScore,
        detectedTactic: parsed.detectedTactic || fallback.detectedTactic,
        riskSummary: parsed.riskSummary || fallback.riskSummary,
        recommendation: parsed.recommendation || fallback.recommendation,
      };
    });

    const timeoutPromise = new Promise<ScamAnalysisResult>((resolve) => {
      setTimeout(() => resolve(fallback), 2500);
    });

    return await Promise.race([aiPromise, timeoutPromise]);
  } catch (error) {
    return fallback;
  }
}
