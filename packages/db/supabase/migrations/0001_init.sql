-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists vector;

-- ============================================================
-- users: ვინ ვინ არის ჯგუფში (WhatsApp JID → სახელი → როლი)
-- ============================================================
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  whatsapp_jid text unique not null,
  name text not null,
  role text not null default 'member',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- messages: ჯგუფის მთელი ისტორია + embeddings სემანტიკური ძებნისთვის
-- ============================================================
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  wa_message_id text unique,
  group_jid text not null,
  sender_jid text not null,
  sender_name text,
  text text,
  replied_to_id uuid references messages(id) on delete set null,
  mentioned_bot boolean not null default false,
  is_from_bot boolean not null default false,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create index if not exists messages_group_idx on messages(group_jid, created_at desc);
create index if not exists messages_sender_idx on messages(sender_jid, created_at desc);
create index if not exists messages_embedding_idx
  on messages using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ============================================================
-- ideas: ჩანიშნული იდეები
-- ============================================================
create table if not exists ideas (
  id uuid primary key default uuid_generate_v4(),
  text text not null,
  created_by_jid text,
  created_by_name text,
  status text not null default 'open', -- open | done | dropped
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ideas_status_idx on ideas(status, created_at desc);

-- ============================================================
-- tasks: დღიური/კონკრეტული დავალებები
-- ============================================================
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  text text not null,
  due_date date,
  assigned_to_jid text,
  created_by_jid text,
  status text not null default 'open', -- open | done | dropped
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_status_due_idx on tasks(status, due_date);

-- ============================================================
-- reminders_skip: "ხვალ არ გამახსენო" ტიპის ჩანაწერები
-- ============================================================
create table if not exists reminders_skip (
  id uuid primary key default uuid_generate_v4(),
  skip_date date not null,
  reason text,
  created_by_jid text,
  created_at timestamptz not null default now(),
  unique (skip_date)
);

-- ============================================================
-- settings: key-value კონფიგი (system prompt, დილის საათი, tools toggles და ა.შ.)
-- Admin panel-იდან ედიტდება, ბოტი კითხულობს
-- ============================================================
create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

-- სტანდარტული პარამეტრები
insert into settings (key, value) values
  ('system_prompt', to_jsonb('შენ ხარ AI აგენტი WhatsApp ჯგუფში. მოკლედ პასუხობ ქართულად (1-3 წინადადება). ეხმარები მომხმარებლებს იდეების ჩანიშვნაში, დავალებების მართვასა და დისკუსიაში.'::text)),
  ('morning_time', to_jsonb('09:00'::text)),
  ('morning_days', '["mon","tue","wed","thu","fri","sat","sun"]'::jsonb),
  ('timezone', to_jsonb('Asia/Tbilisi'::text)),
  ('bot_name', to_jsonb('Agent'::text)),
  ('trigger_words', '["agent","აგენტ","აგენტი","ბოტ"]'::jsonb),
  ('llm_model', to_jsonb('deepseek-chat'::text)),
  ('llm_temperature', to_jsonb(0.7)),
  ('llm_max_tokens', to_jsonb(500)),
  ('tools_enabled', '{"add_idea":true,"add_task":true,"skip_reminder":true,"delete_idea":true,"delete_task":true,"search_history":true}'::jsonb)
on conflict (key) do nothing;

-- ============================================================
-- semantic search RPC (embedding-ით ძველი მესიჯების ძებნა)
-- ============================================================
create or replace function match_messages(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 10,
  filter_group_jid text default null
)
returns table (
  id uuid,
  text text,
  sender_name text,
  created_at timestamptz,
  similarity float
)
language sql stable
as $$
  select
    m.id,
    m.text,
    m.sender_name,
    m.created_at,
    1 - (m.embedding <=> query_embedding) as similarity
  from messages m
  where m.embedding is not null
    and (filter_group_jid is null or m.group_jid = filter_group_jid)
    and 1 - (m.embedding <=> query_embedding) > match_threshold
  order by m.embedding <=> query_embedding
  limit match_count;
$$;
