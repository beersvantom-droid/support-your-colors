-- "Jouw Packs" inventory: packs a user has earned (achievements) or bought
-- (shop) but not yet opened. Opening consumes the row (sets opened_at).

CREATE TABLE IF NOT EXISTS user_pack_inventory (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id    TEXT        NOT NULL,
  source     TEXT        NOT NULL, -- e.g. "achievement:fire_pack_20" or "shop_purchase"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  opened_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_pack_inventory_user
  ON user_pack_inventory (user_id);

ALTER TABLE user_pack_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own pack inventory"
  ON user_pack_inventory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users can insert own pack inventory"
  ON user_pack_inventory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update own pack inventory"
  ON user_pack_inventory FOR UPDATE
  USING (auth.uid() = user_id);
