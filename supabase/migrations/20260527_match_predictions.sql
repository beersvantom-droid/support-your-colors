-- Match predictions table for WC 2026
-- Users predict match outcomes (home_win, draw, away_win)

CREATE TABLE IF NOT EXISTS match_predictions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id       TEXT        NOT NULL,
  prediction     TEXT        NOT NULL CHECK (prediction IN ('home_win', 'draw', 'away_win')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, match_id)  -- One prediction per user per match
);

-- Fast lookups by match
CREATE INDEX IF NOT EXISTS idx_match_predictions_match_id
  ON match_predictions(match_id);

-- Fast lookups by user
CREATE INDEX IF NOT EXISTS idx_match_predictions_user_id
  ON match_predictions(user_id);

-- Enable RLS
ALTER TABLE match_predictions ENABLE ROW LEVEL SECURITY;

-- Anyone (logged in) can read predictions for stats
CREATE POLICY "anyone read match predictions"
  ON match_predictions FOR SELECT USING (true);

-- Users can only insert their own predictions
CREATE POLICY "users insert own predictions"
  ON match_predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own predictions
CREATE POLICY "users update own predictions"
  ON match_predictions FOR UPDATE
  USING (auth.uid() = user_id);
