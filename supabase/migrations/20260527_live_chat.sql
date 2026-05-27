-- ─── Live Match Chat ──────────────────────────────────────────────────────────
-- Global chat for all WC 2026 matches.
-- Messages are auto-deleted at 07:00 UTC daily via cron job.

create table if not exists live_chat_messages (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  username     text        not null,
  user_country text,
  user_flag    text,
  message      text        not null,
  created_at   timestamptz not null default now(),
  constraint live_chat_message_length check (length(message) <= 140)
);

-- Fast retrieval of last N messages
create index idx_live_chat_created_at on live_chat_messages(created_at desc);
-- Fast rate-limit check per user
create index idx_live_chat_user_id    on live_chat_messages(user_id, created_at desc);

alter table live_chat_messages enable row level security;

-- Anyone (logged in or not) can read messages
create policy "anyone read live chat"
  on live_chat_messages for select using (true);

-- Users can only insert their own messages
create policy "users insert own live chat"
  on live_chat_messages for insert
  with check (auth.uid() = user_id);

-- Service role can delete (for cron cleanup)
-- No delete policy needed — service role bypasses RLS
