-- ─── Score Sync Tables ────────────────────────────────────────────────────────
-- Run this in the Supabase SQL editor once before deploying the sync service.

-- match_results
-- One row per World Cup match, keyed by external_id from TheSportsDB.
-- The sync service upserts here; the frontend reads from here for live scores.
create table if not exists match_results (
  id           uuid        default gen_random_uuid() primary key,
  external_id  text        not null unique,   -- TheSportsDB idEvent
  home_team    text        not null,          -- normalized to wc2026-data.ts key
  away_team    text        not null,
  match_date   date        not null,
  home_score   int,
  away_score   int,
  status       text        not null default 'upcoming', -- upcoming | live | finished
  winner       text,                                    -- team name | 'draw' | null
  processed    boolean     not null default false,       -- bracket logic already ran
  created_at   timestamptz default now()     not null,
  updated_at   timestamptz default now()     not null
);

-- group_standings
-- Recalculated after every finished group stage match.
create table if not exists group_standings (
  id         uuid        default gen_random_uuid() primary key,
  group_id   text        not null,           -- 'A' – 'L'
  team       text        not null,
  played     int         not null default 0,
  won        int         not null default 0,
  drawn      int         not null default 0,
  lost       int         not null default 0,
  gf         int         not null default 0, -- goals for
  ga         int         not null default 0, -- goals against
  gd         int         not null default 0, -- goals difference (gf - ga)
  points     int         not null default 0, -- won*3 + drawn
  rank       int,                            -- 1-4 within group
  advanced   boolean     not null default false,
  created_at timestamptz default now()     not null,
  updated_at timestamptz default now()     not null,
  unique (group_id, team)
);

-- knockout_matches
-- Bracket slots for R32 → Final. Teams are written here as they advance.
create table if not exists knockout_matches (
  id           uuid        default gen_random_uuid() primary key,
  round        text        not null,         -- R32 | R16 | QF | SF | 3rd | Final
  match_number int         not null,         -- FIFA match number (65–96)
  home_team    text,                         -- null until team advances here
  away_team    text,
  home_source  text,                         -- human label: '1A', 'W65', etc.
  away_source  text,
  home_score   int,
  away_score   int,
  winner       text,
  status       text        not null default 'upcoming',
  external_id  text,                         -- TheSportsDB ID once matched
  processed    boolean     not null default false,
  created_at   timestamptz default now()     not null,
  updated_at   timestamptz default now()     not null,
  unique (round, match_number)
);

-- RLS: anyone can read; only service role (the sync job) can write.
alter table match_results    enable row level security;
alter table group_standings  enable row level security;
alter table knockout_matches enable row level security;

create policy "public read match_results"    on match_results    for select using (true);
create policy "public read group_standings"  on group_standings  for select using (true);
create policy "public read knockout_matches" on knockout_matches for select using (true);

-- No insert/update policies → only the service role key can write.

-- ─── Seed knockout_matches with initial bracket structure ─────────────────────
-- This pre-populates all R32–Final slots with source labels so the bracket UI
-- can show "1A vs 2B" even before teams are known.

insert into knockout_matches (round, match_number, home_source, away_source) values
  -- Round of 32
  ('R32', 65, '1A', '2B'), ('R32', 66, '1C', '2D'), ('R32', 67, '1E', '2F'),
  ('R32', 68, '1G', '2H'), ('R32', 69, '1I', '2J'), ('R32', 70, '1K', '2L'),
  ('R32', 71, '1B', '2A'), ('R32', 72, '1D', '2C'), ('R32', 73, '1F', '2E'),
  ('R32', 74, '1H', '2G'), ('R32', 75, '1J', '2I'), ('R32', 76, '1L', '2K'),
  ('R32', 77, '3rd TBD', '3rd TBD'), ('R32', 78, '3rd TBD', '3rd TBD'),
  ('R32', 79, '3rd TBD', '3rd TBD'), ('R32', 80, '3rd TBD', '3rd TBD'),
  -- Round of 16
  ('R16', 81, 'W65', 'W66'), ('R16', 82, 'W67', 'W68'),
  ('R16', 83, 'W69', 'W70'), ('R16', 84, 'W71', 'W72'),
  ('R16', 85, 'W73', 'W74'), ('R16', 86, 'W75', 'W76'),
  ('R16', 87, 'W77', 'W78'), ('R16', 88, 'W79', 'W80'),
  -- Quarter-finals
  ('QF', 89, 'W81', 'W82'), ('QF', 90, 'W83', 'W84'),
  ('QF', 91, 'W85', 'W86'), ('QF', 92, 'W87', 'W88'),
  -- Semi-finals
  ('SF', 93, 'W89', 'W90'), ('SF', 94, 'W91', 'W92'),
  -- 3rd place & Final
  ('3rd',   95, 'L93', 'L94'),
  ('Final', 96, 'W93', 'W94')
on conflict (round, match_number) do nothing;
