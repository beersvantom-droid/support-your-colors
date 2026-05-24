-- Create user_coins table for tracking player coin balance
CREATE TABLE user_coins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups by user_id
CREATE INDEX idx_user_coins_user_id ON user_coins(user_id);

-- Enable row-level security
ALTER TABLE user_coins ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own coins
CREATE POLICY "users_read_own_coins"
  ON user_coins
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own coins (service role handles balance changes via API)
CREATE POLICY "users_update_own_coins"
  ON user_coins
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Service role can insert new coin records
CREATE POLICY "service_role_insert_coins"
  ON user_coins
  FOR INSERT
  WITH CHECK (true);
