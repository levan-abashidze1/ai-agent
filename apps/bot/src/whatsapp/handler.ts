import type { WAMessage, WASocket } from 'baileys';
import { getAllSettings } from '@ai-agent/db';
import { db } from '../db.js';
import { logger } from '../logger.js';
import { extractMessage } from './extract.js';
import { getRecentMessages, saveMessage } from '../memory/messages.js';
import { upsertUser } from '../memory/users.js';
import { detectTrigger } from '../agent/triggers.js';
import { decideSmartResponse } from '../agent/smart-trigger.js';
import { respondTo } from '../agent/respond.js';
import { recordBotResponse, secondsSinceLastResponse } from '../agent/throttle.js';

export function bindHandlers(sock: WASocket): void {
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const m of messages) {
      try {
        await handleOne(sock, m);
      } catch (err) {
        logger.error({ err }, 'error handling message');
      }
    }
  });
}

async function handleOne(sock: WASocket, m: WAMessage): Promise<void> {
  const botJid = sock.user?.id;
  if (!botJid) return;

  const msg = extractMessage(m, botJid);
  if (!msg) return;

  const settings = await getAllSettings(db);
  const triggerWords = settings.trigger_words ?? [];
  const smartMode = settings.smart_mode ?? true;
  const minGapSeconds = settings.smart_min_gap_seconds ?? 30;
  const proactiveProb = settings.proactive_probability ?? 0.05;

  const hardTrigger = detectTrigger(msg, botJid, triggerWords);

  if (!msg.isFromBot && msg.senderJid) {
    await upsertUser(msg.senderJid, msg.senderName);
  }

  await saveMessage(msg, hardTrigger.shouldRespond);

  logger.info(
    { from: msg.senderName, text: msg.text.slice(0, 80), hardTrigger: hardTrigger.reason },
    'message received',
  );

  if (msg.isFromBot) return;

  // 1. Hard trigger: always respond
  if (hardTrigger.shouldRespond && hardTrigger.reason) {
    await respondAndRecord(sock, msg, hardTrigger.reason);
    return;
  }

  // 2. Smart mode: ask classifier + honor throttle window
  if (smartMode) {
    const gap = secondsSinceLastResponse(msg.groupJid);
    if (gap < minGapSeconds) {
      logger.info({ gap, minGapSeconds }, 'smart trigger skipped (throttle)');
    } else {
      const recent = await getRecentMessages(msg.groupJid, 12);
      const decision = await decideSmartResponse(msg, recent);
      logger.info({ decision }, 'smart trigger decision');
      if (decision.shouldRespond) {
        await respondAndRecord(sock, msg, `smart:${decision.reason}`);
        return;
      }
    }
  }

  // 3. Proactive occasional chime-in
  if (proactiveProb > 0 && Math.random() < proactiveProb) {
    const gap = secondsSinceLastResponse(msg.groupJid);
    if (gap >= minGapSeconds * 3) {
      logger.info({ prob: proactiveProb }, 'proactive chime-in triggered');
      await respondAndRecord(sock, msg, 'proactive');
    }
  }
}

async function respondAndRecord(
  sock: WASocket,
  msg: ReturnType<typeof extractMessage> & object,
  reason: string,
): Promise<void> {
  recordBotResponse(msg.groupJid);
  await respondTo(sock, msg, reason);
}
