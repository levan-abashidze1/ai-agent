import type { WAMessage, proto } from 'baileys';

export interface ExtractedMessage {
  waMessageId: string;
  groupJid: string;
  senderJid: string;
  senderName: string;
  text: string;
  isFromBot: boolean;
  quotedWaMessageId: string | null;
  quotedParticipant: string | null;
  mentionedJids: string[];
  timestamp: number;
}

export function extractMessage(msg: WAMessage, botJid: string): ExtractedMessage | null {
  const remoteJid = msg.key.remoteJid;
  const waMessageId = msg.key.id;
  if (!remoteJid || !waMessageId) return null;

  // group JIDs end with @g.us
  const isGroup = remoteJid.endsWith('@g.us');
  if (!isGroup) return null;

  const isFromBot = msg.key.fromMe === true;
  const senderJid = isFromBot
    ? botJid
    : (msg.key.participant ?? msg.participant ?? '');
  if (!senderJid) return null;

  const senderName = msg.pushName ?? '';

  const m = msg.message;
  if (!m) return null;

  const text = extractText(m);
  if (!text) return null;

  const contextInfo = getContextInfo(m);
  const quotedWaMessageId = contextInfo?.stanzaId ?? null;
  const quotedParticipant = contextInfo?.participant ?? null;
  const mentionedJids = contextInfo?.mentionedJid ?? [];

  return {
    waMessageId,
    groupJid: remoteJid,
    senderJid,
    senderName,
    text,
    isFromBot,
    quotedWaMessageId,
    quotedParticipant,
    mentionedJids,
    timestamp: Number(msg.messageTimestamp ?? Math.floor(Date.now() / 1000)),
  };
}

function extractText(m: proto.IMessage): string {
  if (m.conversation) return m.conversation;
  if (m.extendedTextMessage?.text) return m.extendedTextMessage.text;
  if (m.imageMessage?.caption) return m.imageMessage.caption;
  if (m.videoMessage?.caption) return m.videoMessage.caption;
  if (m.ephemeralMessage?.message) return extractText(m.ephemeralMessage.message);
  if (m.viewOnceMessage?.message) return extractText(m.viewOnceMessage.message);
  if (m.viewOnceMessageV2?.message) return extractText(m.viewOnceMessageV2.message);
  return '';
}

function getContextInfo(m: proto.IMessage): proto.IContextInfo | null {
  if (m.extendedTextMessage?.contextInfo) return m.extendedTextMessage.contextInfo;
  if (m.imageMessage?.contextInfo) return m.imageMessage.contextInfo;
  if (m.videoMessage?.contextInfo) return m.videoMessage.contextInfo;
  return null;
}
