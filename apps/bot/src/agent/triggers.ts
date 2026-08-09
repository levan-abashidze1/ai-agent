import type { ExtractedMessage } from '../whatsapp/extract.js';

export interface TriggerResult {
  shouldRespond: boolean;
  reason?: 'mention' | 'reply_to_bot' | 'trigger_word';
}

export function detectTrigger(
  msg: ExtractedMessage,
  botJid: string,
  triggerWords: string[],
): TriggerResult {
  if (msg.isFromBot) return { shouldRespond: false };

  const botBareJid = bareJid(botJid);
  if (msg.mentionedJids.some((j) => bareJid(j) === botBareJid)) {
    return { shouldRespond: true, reason: 'mention' };
  }

  if (msg.quotedParticipant && bareJid(msg.quotedParticipant) === botBareJid) {
    return { shouldRespond: true, reason: 'reply_to_bot' };
  }

  const lower = msg.text.toLowerCase();
  for (const w of triggerWords) {
    const wl = w.toLowerCase().trim();
    if (!wl) continue;
    if (matchesWord(lower, wl)) {
      return { shouldRespond: true, reason: 'trigger_word' };
    }
  }

  return { shouldRespond: false };
}

function bareJid(jid: string): string {
  return jid.split(':')[0].split('@')[0];
}

function matchesWord(text: string, word: string): boolean {
  const idx = text.indexOf(word);
  if (idx === -1) return false;
  const before = idx === 0 ? '' : text[idx - 1];
  const after = idx + word.length >= text.length ? '' : text[idx + word.length];
  return !isWordChar(before) && !isWordChar(after);
}

function isWordChar(ch: string): boolean {
  return /[\p{L}\p{N}_]/u.test(ch);
}
