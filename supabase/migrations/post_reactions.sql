-- post_reactions: one row per (post, user) pair
-- This replaces the flame_count field on posts for reaction tracking.

create table if not exists post_reactions (
  id         uuid        default gen_random_uuid() primary key,
  post_id    uuid        references posts(id) on delete cascade not null,
  user_id    uuid        references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique (post_id, user_id)
);

alter table post_reactions enable row level security;

create policy "Anyone can read reactions"
  on post_reactions for select
  using (true);

create policy "Authenticated users can react"
  on post_reactions for insert
  with check (auth.uid() = user_id);

create policy "Users can remove own reactions"
  on post_reactions for delete
  using (auth.uid() = user_id);
