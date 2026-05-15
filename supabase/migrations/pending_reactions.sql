-- pending_commentator_reactions
-- When a user posts, scheduled commentary reactions are stored here.
-- The /api/process-commentary cron (every 2 min) processes rows that are due.

create table if not exists pending_commentator_reactions (
  id             uuid        default gen_random_uuid() primary key,
  post_id        uuid        references posts(id) on delete cascade not null,
  commentator_id text        not null,                    -- 'jeroen' | 'sierd' | 'fabrizio'
  action_type    text        not null,                    -- 'comment' | 'standalone_post'
  fire_at        timestamptz not null,
  context_json   jsonb       not null default '{}',       -- tone, country, flag, isNight, isDerby, caption
  processed      boolean     not null default false,
  created_at     timestamptz default now() not null
);

create index if not exists idx_pending_reactions_fire_at
  on pending_commentator_reactions (fire_at, processed)
  where processed = false;

alter table pending_commentator_reactions enable row level security;

-- Authenticated users can schedule reactions when they create a post
create policy "auth users can insert pending reactions"
  on pending_commentator_reactions for insert
  with check (auth.uid() is not null);

-- Service role (the cron) reads and updates via bypass — no select/update policy needed.
