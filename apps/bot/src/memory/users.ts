import { db } from '../db.js';

const cache = new Map<string, { id: string; name: string }>();

export async function upsertUser(jid: string, name: string): Promise<{ id: string; name: string }> {
  const cached = cache.get(jid);
  if (cached && cached.name === (name || cached.name)) return cached;

  const { data, error } = await db
    .from('users')
    .upsert(
      { whatsapp_jid: jid, name: name || jid.split('@')[0] },
      { onConflict: 'whatsapp_jid', ignoreDuplicates: false },
    )
    .select('id, name')
    .single();

  if (error) throw error;
  const rec = { id: data.id as string, name: data.name as string };
  cache.set(jid, rec);
  return rec;
}
