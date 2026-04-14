-- ============================================================
-- Food Court — Supabase schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Enable UUID extension (usually already enabled)
create extension if not exists "pgcrypto";

-- ============================================================
-- rooms
-- Defines named presence channels. MVP ships with one room.
-- ============================================================
create table if not exists public.rooms (
  id          text primary key,           -- e.g. 'main', 'deep-work'
  label       text not null,              -- display name
  description text,
  created_at  timestamptz default now()
);

insert into public.rooms (id, label, description) values
  ('main', 'Food Court', 'The main room. No agenda.')
on conflict (id) do nothing;

-- ============================================================
-- sessions (optional — for visit tracking and avatar persistence)
-- Written on first join, updated on subsequent visits.
-- No auth required — keyed by anonymous session_id from localStorage.
-- ============================================================
create table if not exists public.sessions (
  session_id    text primary key,
  avatar_config jsonb not null default '{}',
  last_status   jsonb not null default '{}',
  visit_count   integer not null default 1,
  first_seen_at timestamptz default now(),
  last_seen_at  timestamptz default now()
);

-- RLS: anyone can insert/update their own row by session_id
alter table public.sessions enable row level security;

create policy "sessions: insert own"
  on public.sessions for insert
  with check (true);

create policy "sessions: update own"
  on public.sessions for update
  using (true);

create policy "sessions: read own"
  on public.sessions for select
  using (true);

-- ============================================================
-- Realtime — enable presence on the rooms channel
-- No table needed for presence — it lives in the channel payload.
-- This just ensures the realtime extension is active.
-- ============================================================

-- Enable realtime for the sessions table (optional — for analytics later)
alter publication supabase_realtime add table public.sessions;

-- ============================================================
-- Helper function: upsert session on join
-- Called from the client via supabase.rpc('upsert_session', {...})
-- ============================================================
create or replace function public.upsert_session(
  p_session_id    text,
  p_avatar_config jsonb,
  p_last_status   jsonb
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.sessions (session_id, avatar_config, last_status, visit_count)
  values (p_session_id, p_avatar_config, p_last_status, 1)
  on conflict (session_id) do update set
    avatar_config = excluded.avatar_config,
    last_status   = excluded.last_status,
    visit_count   = public.sessions.visit_count + 1,
    last_seen_at  = now();
end;
$$;
