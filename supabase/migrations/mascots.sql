-- ── Mascots migration ────────────────────────────────────────────────────────
-- Run this in the Supabase SQL editor.

-- 1. Add equipped_mascots column to profiles
--    Stores an ordered array of up to 3 mascot IDs (e.g. ["mascot_dj_derksen"])
alter table profiles
  add column if not exists equipped_mascots text[] default '{}';

-- 2. The user_cosmetics table already handles mascot inventory.
--    Mascot IDs follow the same pattern: "mascot_dj_derksen"
--    No additional table needed.

-- 3. DJ Derksen is unlocked via:
--    a) Wheel of Chaos (legendary pool) — handled in app/api/wheel/claim/route.ts
--    b) Achievement "dj_derksen_fan" (10 DJ Derksen comments on user's posts)
--       — handled in AchievementsProvider.tsx which auto-inserts to user_cosmetics
