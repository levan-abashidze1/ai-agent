import type { WAMessage, WASocket } from 'baileys';
import { getSetting } from '@ai-agent/db';
import { db } from '../db.js';
import { logger } from '../logger.js';
import { extractMessage } from './extract.js';
import { saveMessage } from '../memory/messages.js';
import { upsertUser } from '../memory/users.js';
import { detectTrigger } from '../agent/triggers.js';
import { respondTo } from '../agent/respond.js';

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

  const [triggerWords] = await Promise.all([
    getSetting(db, 'trigger_words').then((v) => v ?? []),
  ]);

  const trigger = detectTrigger(msg, botJid, triggerWords);

  if (!msg.isFromBot && msg.senderJid) {
    await upsertUser(msg.senderJid, msg.senderName);
  }

  await saveMessage(msg, trigger.shouldRespond);

  logger.info(
    { from: msg.senderName, text: msg.text.slice(0, 80), trigger: trigger.reason },
    'message received',
  );

  if (trigger.shouldRespond && trigger.reason) {
    await respondTo(sock, msg, trigger.reason);
  }
}
