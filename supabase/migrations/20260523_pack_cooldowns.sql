-- Pack cooldown tracking
-- Stores when a user last opened each pack type.

CREATE TABLE IF NOT EXISTS user_pack_cooldowns (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id        TEXT        NOT NULL,
  last_opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, pack_id)
);

CREATE INDEX IF NOT EXISTS idx_user_pack_cooldowns_user
  ON user_pack_cooldowns (user_id);

-- RLS: users can only read/write their own rows
ALTER TABLE user_pack_cooldowns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own cooldowns"
  ON user_pack_cooldowns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users can upsert own cooldowns"
  ON user_pack_cooldowns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update own cooldowns"
  ON user_pack_cooldowns FOR UPDATE
  USING (auth.uid() = user_id);
