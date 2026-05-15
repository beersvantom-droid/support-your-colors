-- Fan personas: custom community members that auto-comment under posts
create table if not exists fan_personas (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  avatar_url  text,
  personality text not null check (personality in ('sarcastic','hype','toxic','funny','tactical','chill','chaotic')),
  active      boolean not null default true,
  created_at  timestamptz default now() not null
);

-- Job queue: one pending comment per fan per post
create table if not exists pending_fan_reactions (
  id             uuid default gen_random_uuid() primary key,
  post_id        uuid references posts(id) on delete cascade not null,
  fan_persona_id uuid references fan_personas(id) on delete cascade not null,
  fire_at        timestamptz not null,
  context_json   jsonb not null default '{}',
  processed      boolean not null default false,
  created_at     timestamptz default now() not null,
  unique (post_id, fan_persona_id)
);

create index if not exists idx_pending_fan_reactions_fire_at
  on pending_fan_reactions (fire_at, processed) where processed = false;

-- RLS
alter table fan_personas         enable row level security;
alter table pending_fan_reactions enable row level security;

-- fan_personas: public read, service role write
create policy "public can read fan personas"
  on fan_personas for select using (true);

-- pending_fan_reactions: auth users insert, public read for cron
create policy "auth users can insert pending fan reactions"
  on pending_fan_reactions for insert with check (auth.uid() is not null);

create policy "public can read pending fan reactions"
  on pending_fan_reactions for select using (true);

create policy "public can update pending fan reactions"
  on pending_fan_reactions for update using (true);
