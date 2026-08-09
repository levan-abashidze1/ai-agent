import type { DB } from './client.js';
import type { SettingsMap } from './types.js';

export async function getSetting<K extends keyof SettingsMap>(
  db: DB,
  key: K,
): Promise<SettingsMap[K] | null> {
  const { data, error } = await db.from('settings').select('value').eq('key', key).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return (data as { value: SettingsMap[K] }).value;
}

export async function getAllSettings(db: DB): Promise<Partial<SettingsMap>> {
  const { data, error } = await db.from('settings').select('key, value');
  if (error) throw error;
  const out: Record<string, unknown> = {};
  for (const row of (data as Array<{ key: string; value: unknown }>) ?? []) {
    out[row.key] = row.value;
  }
  return out as Partial<SettingsMap>;
}

export async function setSetting<K extends keyof SettingsMap>(
  db: DB,
  key: K,
  value: SettingsMap[K],
  updatedBy?: string,
): Promise<void> {
  const { error } = await db.from('settings').upsert({
    key,
    value,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy ?? null,
  });
  if (error) throw error;
}
