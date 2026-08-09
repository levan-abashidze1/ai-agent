import { createServiceClient } from '@ai-agent/db';
import { env } from './env.js';

export const db = createServiceClient({
  url: env.SUPABASE_URL,
  key: env.SUPABASE_SERVICE_ROLE_KEY,
});
