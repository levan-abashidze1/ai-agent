import { chat } from './deepseek.js';
import { logger } from '../logger.js';
import type { SavedMessage } from '../memory/messages.js';
import type { ExtractedMessage } from '../whatsapp/extract.js';

export interface SmartDecision {
  shouldRespond: boolean;
  reason: string;
}

const CLASSIFIER_SYSTEM_PROMPT = `შენ ხარ WhatsApp ჯგუფის AI აგენტის კლასიფიკატორი.
შენი ერთადერთი დავალებაა გადაწყვიტო: აგენტმა უნდა უპასუხოს ამ ბოლო შეტყობინებას თუ არა.

წესები:
- YES: მომხმარებელი სვამს კითხვას რომელზეც აგენტმა შეიძლება უპასუხოს
- YES: მომხმარებელი მოითხოვს დახმარებას ან რჩევას (AI, tech, business, კოდი, გეგმა, იდეა)
- YES: მომხმარებელი პირდაპირ ესაუბრება აგენტს
- YES: საუბრის კონტექსტში აგენტს რაიმე მნიშვნელოვანი შეაქვს
- NO: მომხმარებლები ერთმანეთს ესაუბრებიან პირად თემებზე
- NO: მარტივი მისალმება/თანხმობა/დადასტურება
- NO: off-topic უცნაური სიტყვები
- NO: აგენტმა ცოტახნის წინ უკვე უპასუხა და დამატებითი პასუხი ზედმეტი იქნებოდა

უპასუხე მხოლოდ JSON-ით (არაფერი სხვა):
{"respond": true/false, "reason": "მოკლე ახსნა"}`;

export async function decideSmartResponse(
  msg: ExtractedMessage,
  recent: SavedMessage[],
): Promise<SmartDecision> {
  const contextLines = recent
    .filter((r) => r.wa_message_id !== msg.waMessageId)
    .slice(-8)
    .map((r) => `${r.sender_name ?? r.sender_jid}: ${r.text}`)
    .join('\n');

  const userPrompt = [
    contextLines ? `ბოლო კონტექსტი:\n${contextLines}` : '',
    '',
    `ახალი შეტყობინება:`,
    `${msg.senderName || msg.senderJid}: ${msg.text}`,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const { text } = await chat(
      [
        { role: 'system', content: CLASSIFIER_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.2, maxTokens: 100 },
    );

    const cleaned = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned) as { respond: boolean; reason?: string };
    return {
      shouldRespond: !!parsed.respond,
      reason: parsed.reason ?? 'no reason given',
    };
  } catch (err) {
    logger.warn({ err }, 'smart classifier failed, defaulting to no-respond');
    return { shouldRespond: false, reason: 'classifier error' };
  }
}
