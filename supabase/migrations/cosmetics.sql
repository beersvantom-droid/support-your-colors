-- ── Cosmetics migration ────────────────────────────────────────────────────────
-- Run this in the Supabase SQL editor.

-- 1. User inventory table
create table if not exists user_cosmetics (
  id           uuid        default gen_random_uuid() primary key,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  cosmetic_id  text        not null,
  unlocked_at  timestamptz not null default now(),
  unique (user_id, cosmetic_id)
);

-- Index for fast per-user lookups
create index if not exists user_cosmetics_user_id_idx on user_cosmetics (user_id);

-- RLS: users can read their own inventory
alter table user_cosmetics enable row level security;

create policy "users read own inventory"
  on user_cosmetics for select
  using (auth.uid() = user_id);

-- Users can insert rows for themselves (route handler already validates auth).
create policy "users insert own inventory"
  on user_cosmetics for insert
  with check (auth.uid() = user_id);


-- 2. Equipped cosmetic columns on profiles
alter table profiles
  add column if not exists equipped_name_color text,
  add column if not exists equipped_border      text,
  add column if not exists equipped_badge       text,
  add column if not exists equipped_card_bg     text;

-- Allow users to update their own equipped columns
-- (the equip API uses service role, but this makes direct client calls safe too)
create policy "users update own equipped"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
