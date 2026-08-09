import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type DB = SupabaseClient;

export interface CreateClientOptions {
  url: string;
  key: string;
}

export function createServiceClient({ url, key }: CreateClientOptions): DB {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createAnonClient({ url, key }: CreateClientOptions): DB {
  return createClient(url, key);
}
