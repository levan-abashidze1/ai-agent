import type { WASocket } from 'baileys';
import { getAllSettings } from '@ai-agent/db';
import { db } from '../db.js';
import { logger } from '../logger.js';
import type { ExtractedMessage } from '../whatsapp/extract.js';
import { getRecentMessages, saveMessage } from '../memory/messages.js';
import { chat, type ChatMessage } from './deepseek.js';

const DEFAULT_SYSTEM_PROMPT =
  'შენ ხარ AI აგენტი WhatsApp ჯგუფში. მოკლედ პასუხობ ქართულად (1-3 წინადადება).';

export async function respondTo(
  sock: WASocket,
  msg: ExtractedMessage,
  triggerReason: string,
): Promise<void> {
  const settings = await getAllSettings(db);
  const systemPrompt = settings.system_prompt ?? DEFAULT_SYSTEM_PROMPT;
  const model = settings.llm_model ?? 'deepseek-chat';
  const temperature = settings.llm_temperature ?? 0.7;
  const maxTokens = settings.llm_max_tokens ?? 500;

  const recent = await getRecentMessages(msg.groupJid, 15);

  const contextLines = recent
    .filter((r) => r.wa_message_id !== msg.waMessageId)
    .map((r) => `${r.sender_name ?? r.sender_jid}: ${r.text}`);

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: [
        systemPrompt,
        '',
        `მიმდინარე მომხმარებლის სახელი: ${msg.senderName || msg.senderJid}`,
        `ტრიგერის მიზეზი: ${triggerReason}`,
      ].join('\n'),
    },
  ];

  if (contextLines.length) {
    messages.push({
      role: 'system',
      content: `ბოლო კონტექსტი ჯგუფიდან:\n${contextLines.join('\n')}`,
    });
  }

  messages.push({
    role: 'user',
    content: `${msg.senderName || msg.senderJid}: ${msg.text}`,
  });

  logger.info({ trigger: triggerReason, sender: msg.senderName }, 'calling deepseek');

  const { text, usage } = await chat(messages, { model, temperature, maxTokens });
  logger.info({ usage }, 'deepseek response');

  if (!text) {
    logger.warn('empty response from deepseek');
    return;
  }

  const sent = await sock.sendMessage(msg.groupJid, { text }, { quoted: waMessageStub(msg) });

  if (sent?.key?.id) {
    await saveMessage(
      {
        waMessageId: sent.key.id,
        groupJid: msg.groupJid,
        senderJid: sock.user?.id ?? 'bot',
        senderName: 'Agent',
        text,
        isFromBot: true,
        quotedWaMessageId: msg.waMessageId,
        quotedParticipant: msg.senderJid,
        mentionedJids: [],
        timestamp: Math.floor(Date.now() / 1000),
      },
      false,
    );
  }
}

function waMessageStub(msg: ExtractedMessage): Parameters<WASocket['sendMessage']>[2] extends
  | { quoted?: infer Q }
  | undefined
  ? Q
  : never {
  return {
    key: {
      remoteJid: msg.groupJid,
      id: msg.waMessageId,
      participant: msg.senderJid,
      fromMe: false,
    },
    message: { conversation: msg.text },
  } as never;
}
