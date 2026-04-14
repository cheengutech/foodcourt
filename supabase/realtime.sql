-- ============================================================
-- Food Court — Realtime channel configuration
-- Run this AFTER schema.sql
-- ============================================================

-- Authorize the presence channel for anonymous (unauthenticated) users.
-- Supabase Realtime requires explicit channel authorization when RLS is on.

-- Allow anyone to subscribe to the foodcourt:* presence channels
create policy "realtime presence: allow anon"
  on public.rooms for select
  using (true);

-- ============================================================
-- Supabase Dashboard steps (can't be done via SQL):
--
-- 1. Go to Realtime → Configuration
-- 2. Confirm "Realtime" is enabled (green toggle)
-- 3. Go to API Settings → confirm anon key has SELECT on public schema
-- ============================================================
