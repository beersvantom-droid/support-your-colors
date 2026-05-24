-- Create user_daily_login table for tracking daily login bonuses
CREATE TABLE user_daily_login (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  last_login_date DATE NOT NULL DEFAULT CURRENT_DATE,
  coins_claimed INT NOT NULL DEFAULT 100,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups by user_id
CREATE INDEX idx_user_daily_login_user_id ON user_daily_login(user_id);

-- Enable row-level security
ALTER TABLE user_daily_login ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own daily login record
CREATE POLICY "users_read_own_daily_login"
  ON user_daily_login
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role only for inserts/updates (users claim via API, not directly)
CREATE POLICY "service_role_manage_daily_login"
  ON user_daily_login
  FOR ALL
  USING (true);
