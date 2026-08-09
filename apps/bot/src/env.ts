import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../../.env') });

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const env = {
  SUPABASE_URL: required('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: required('SUPABASE_SERVICE_ROLE_KEY'),
  DEEPSEEK_API_KEY: required('DEEPSEEK_API_KEY'),
  DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL ?? 'deepseek-chat',
  DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com',
  BOT_NAME: process.env.BOT_NAME ?? 'Agent',
  GROUP_JID: process.env.GROUP_JID ?? '',
  AUTH_DIR: process.env.AUTH_DIR ?? resolve(__dirname, '../auth_info_baileys'),
};
