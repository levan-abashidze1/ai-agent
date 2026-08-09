# AI Agent — WhatsApp Group Assistant

Monorepo: WhatsApp bot (Baileys + DeepSeek) + Admin panel (Next.js).

## Structure

```
apps/
  bot/      → Hetzner VPS (Baileys + agent loop + cron)
  admin/    → Vercel (Next.js admin panel)
packages/
  db/       → Shared Supabase client + types
```

## Phase 1 Setup

### 1. Supabase project

1. Go to https://supabase.com → New Project
2. Save the DB password
3. Settings → API → copy `Project URL`, `anon key`, `service_role key`

### 2. Run migrations

In Supabase dashboard → SQL Editor → paste and run:

```
packages/db/supabase/migrations/0001_init.sql
```

This creates: `users`, `messages`, `ideas`, `tasks`, `reminders_skip`, `settings` + pgvector extension + `match_messages` RPC.

### 3. DeepSeek API key

1. Go to https://platform.deepseek.com
2. Create API key
3. Save it for `.env`

### 4. Environment

```bash
cp .env.example .env
```

Fill in Supabase and DeepSeek keys.

### 5. Install

```bash
pnpm install
```

## Phases

- **Phase 1** ✅ — Monorepo, DB schema, shared package
- **Phase 2** — Bot MVP (Baileys + DeepSeek reply)
- **Phase 3** — Tools (add_idea, skip_reminder, cron)
- **Phase 4** — Memory (embeddings, semantic search)
- **Phase 5** — Admin panel (Next.js on Vercel)
