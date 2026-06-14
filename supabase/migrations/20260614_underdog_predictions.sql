-- Track whether a prediction was an "underdog pick" (≤25% of voters at the
-- time of submission picked the same outcome). Used for the "Onderbuikgevoel"
-- achievement: correctly predicting a minority outcome.

ALTER TABLE match_predictions
  ADD COLUMN IF NOT EXISTS was_underdog_pick BOOLEAN NOT NULL DEFAULT FALSE;
