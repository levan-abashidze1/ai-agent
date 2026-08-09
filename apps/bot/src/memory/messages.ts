import { db } from '../db.js';
import type { ExtractedMessage } from '../whatsapp/extract.js';

export interface SavedMessage {
  id: string;
  wa_message_id: string;
  text: string;
  sender_name: string | null;
  sender_jid: string;
  created_at: string;
}

export async function saveMessage(
  msg: ExtractedMessage,
  mentionedBot: boolean,
): Promise<string | null> {
  const repliedToId = msg.quotedWaMessageId
    ? await findMessageIdByWaId(msg.quotedWaMessageId)
    : null;

  const { data, error } = await db
    .from('messages')
    .upsert(
      {
        wa_message_id: msg.waMessageId,
        group_jid: msg.groupJid,
        sender_jid: msg.senderJid,
        sender_name: msg.senderName || null,
        text: msg.text,
        replied_to_id: repliedToId,
        mentioned_bot: mentionedBot,
        is_from_bot: msg.isFromBot,
      },
      { onConflict: 'wa_message_id', ignoreDuplicates: false },
    )
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
}

async function findMessageIdByWaId(waId: string): Promise<string | null> {
  const { data } = await db.from('messages').select('id').eq('wa_message_id', waId).maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

export async function getRecentMessages(
  groupJid: string,
  limit = 15,
): Promise<SavedMessage[]> {
  const { data, error } = await db
    .from('messages')
    .select('id, wa_message_id, text, sender_name, sender_jid, created_at')
    .eq('group_jid', groupJid)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data as SavedMessage[]) ?? []).reverse();
}
