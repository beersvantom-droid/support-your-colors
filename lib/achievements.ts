export type AchievementRarity = "easy" | "medium" | "hard" | "secret";

export interface AchievementDef {
  id: string;
  emoji: string;
  name: string;
  hint: string; // revealed only after unlock
  rarity: AchievementRarity;
  points: number;
  coins?: number; // coins awarded (for progression achievements)
  unlocksCosmetic?: string; // cosmetic_id if this achievement unlocks a cosmetic
}

export const RARITY_POINTS: Record<AchievementRarity, number> = {
  easy: 150,
  medium: 300,
  hard: 500,
  secret: 1000,
};

export const RARITY_LABEL: Record<AchievementRarity, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  secret: "Secret",
};

export const RARITY_STYLE: Record<
  AchievementRarity,
  { bg: string; border: string; glow: string; text: string; badge: string }
> = {
  easy: {
    bg: "rgba(34,197,94,0.07)",
    border: "#22C55E",
    glow: "rgba(34,197,94,0.28)",
    text: "#16A34A",
    badge: "#DCFCE7",
  },
  medium: {
    bg: "rgba(59,130,246,0.07)",
    border: "#3B82F6",
    glow: "rgba(59,130,246,0.28)",
    text: "#2563EB",
    badge: "#DBEAFE",
  },
  hard: {
    bg: "rgba(239,68,68,0.07)",
    border: "#EF4444",
    glow: "rgba(239,68,68,0.28)",
    text: "#DC2626",
    badge: "#FEE2E2",
  },
  secret: {
    bg: "rgba(168,85,247,0.07)",
    border: "#A855F7",
    glow: "rgba(168,85,247,0.28)",
    text: "#9333EA",
    badge: "#F3E8FF",
  },
};

// Sort order for Trophy Case: rarest first
export const RARITY_SORT: Record<AchievementRarity, number> = {
  secret: 0,
  hard: 1,
  medium: 2,
  easy: 3,
};

export const ALL_ACHIEVEMENTS: AchievementDef[] = [
  // ── Easy — 150 pts ──────────────────────────────────────────────────────────
  {
    id: "first_upload",
    emoji: "📸",
    name: "First Upload",
    hint: "Created your first post",
    rarity: "easy",
    points: 150,
  },
  {
    id: "chatterbox",
    emoji: "💬",
    name: "Chatterbox",
    hint: "Left 10 comments",
    rarity: "easy",
    points: 150,
  },
  {
    id: "loyal_voter",
    emoji: "🗳️",
    name: "Loyal Voter",
    hint: "Voted on 3 different days",
    rarity: "easy",
    points: 150,
  },
  {
    id: "midnight_watcher",
    emoji: "🌙",
    name: "Midnight Watcher",
    hint: "Posted between midnight and 5 AM",
    rarity: "easy",
    points: 150,
  },
  {
    id: "matchday_ready",
    emoji: "⚽",
    name: "Matchday Ready",
    hint: "Posted on a matchday for your country",
    rarity: "easy",
    points: 150,
  },
  // ── Medium — 300 pts ─────────────────────────────────────────────────────────
  {
    id: "always_watching",
    emoji: "📱",
    name: "Always Watching",
    hint: "Active 3 consecutive days",
    rarity: "medium",
    points: 300,
  },
  {
    id: "true_supporter",
    emoji: "🧣",
    name: "True Supporter",
    hint: "Created 5 posts",
    rarity: "medium",
    points: 300,
  },
  {
    id: "daily_presence",
    emoji: "🔥",
    name: "Daily Presence",
    hint: "Active 5 consecutive days",
    rarity: "medium",
    points: 300,
  },
  {
    id: "fast_responder",
    emoji: "🎯",
    name: "Fast Responder",
    hint: "Commented within 2 minutes of a new post",
    rarity: "medium",
    points: 300,
  },
  {
    id: "democracy_enjoyer",
    emoji: "🗳️",
    name: "Democracy Enjoyer",
    hint: "Voted on 7 different days",
    rarity: "medium",
    points: 300,
  },
  // ── Hard — 500 pts ───────────────────────────────────────────────────────────
  {
    id: "stadium_presence",
    emoji: "🏟️",
    name: "Stadium Presence",
    hint: "Active 10 consecutive days",
    rarity: "hard",
    points: 500,
  },
  {
    id: "instant_reaction",
    emoji: "🚨",
    name: "Instant Reaction",
    hint: "Posted within 5 minutes after a World Cup match",
    rarity: "hard",
    points: 500,
  },
  {
    id: "around_the_clock",
    emoji: "🌍",
    name: "Around The Clock",
    hint: "Morning, afternoon, and night post on the same day",
    rarity: "hard",
    points: 500,
  },
  {
    id: "night_shift",
    emoji: "🧊",
    name: "Night Shift",
    hint: "3 posts after midnight",
    rarity: "hard",
    points: 500,
  },
  {
    id: "media_veteran",
    emoji: "📸",
    name: "Media Veteran",
    hint: "Created 10 posts",
    rarity: "hard",
    points: 500,
  },
  // ── Secret — 1000 pts ────────────────────────────────────────────────────────
  {
    id: "tournament_ghost",
    emoji: "🪦",
    name: "Tournament Ghost",
    hint: "...",
    rarity: "secret",
    points: 1000,
  },
  {
    id: "villain_arc",
    emoji: "👹",
    name: "Villain Arc",
    hint: "...",
    rarity: "secret",
    points: 1000,
  },
  {
    id: "silent_operator",
    emoji: "🕵️",
    name: "Silent Operator",
    hint: "...",
    rarity: "secret",
    points: 1000,
  },
  {
    id: "democracy_addict",
    emoji: "🗳️",
    name: "Democracy Addict",
    hint: "...",
    rarity: "secret",
    points: 1000,
  },
  {
    id: "content_machine",
    emoji: "📸",
    name: "Content Machine",
    hint: "Created 15 posts",
    rarity: "secret",
    points: 1000,
  },
  {
    id: "dj_derksen_fan",
    emoji: "🎧",
    name: "DJ Approved",
    hint: "Received 10 comments from DJ Derksen",
    rarity: "secret",
    points: 0,
    unlocksCosmetic: "mascot_dj_derksen",
  },
  {
    id: "abu_harb_fan",
    emoji: "🦅",
    name: "Reckless Companion",
    hint: "Received 10 comments from أبو حرب",
    rarity: "secret",
    points: 0,
    unlocksCosmetic: "mascot_abu_harb",
  },
  {
    id: "jannes_fan",
    emoji: "🤪",
    name: "Clumsy Ref",
    hint: "Commented with the word 'scheidsrechter'",
    rarity: "secret",
    points: 0,
    unlocksCosmetic: "mascot_jannes",
  },
  {
    id: "ron_jans_fan",
    emoji: "🧻",
    name: "Kitchen Roll Chaos",
    hint: "Commented with 'keukenrol', 'ronjansdans', or 'pec zwolle'",
    rarity: "secret",
    points: 0,
    unlocksCosmetic: "mascot_ron_jans",
  },
  {
    id: "golden_cor_fan",
    emoji: "🧣",
    name: "Golden Ragebait",
    hint: "Received 20 comments on a single post",
    rarity: "secret",
    points: 0,
    unlocksCosmetic: "mascot_golden_cor",
  },
  {
    id: "udo_fan",
    emoji: "😎",
    name: "Chill Vibes",
    hint: "Commented with 'huts' or 'niffo'",
    rarity: "secret",
    points: 0,
    unlocksCosmetic: "mascot_udo",
  },

  // ── Progression Achievements (visible progress, coins-only) ───────────────────
  {
    id: "login_7days",
    emoji: "📅",
    name: "Week Warrior",
    hint: "Log in 7 consecutive days",
    rarity: "easy",
    points: 0,
    coins: 50,
  },
  {
    id: "login_10days",
    emoji: "🔥",
    name: "Habitué",
    hint: "Log in 10 consecutive days",
    rarity: "medium",
    points: 0,
    coins: 100,
  },
  {
    id: "login_15days",
    emoji: "⭐",
    name: "Season Devotee",
    hint: "Log in 15 consecutive days",
    rarity: "hard",
    points: 0,
    coins: 150,
  },
  {
    id: "open_10packs",
    emoji: "📦",
    name: "Pack Hunter",
    hint: "Open 10 packs",
    rarity: "easy",
    points: 0,
    coins: 50,
  },
  {
    id: "collect_5cosmetics",
    emoji: "👕",
    name: "Starter Collector",
    hint: "Collect 5 unique cosmetics",
    rarity: "easy",
    points: 0,
    coins: 50,
  },
  {
    id: "collect_10cosmetics",
    emoji: "🎨",
    name: "Outfit Master",
    hint: "Collect 10 unique cosmetics",
    rarity: "medium",
    points: 0,
    coins: 100,
  },
  {
    id: "collect_1mascot",
    emoji: "🎭",
    name: "First Friend",
    hint: "Collect 1 mascot",
    rarity: "easy",
    points: 0,
    coins: 50,
  },
  {
    id: "collect_2mascots",
    emoji: "👯",
    name: "Dynamic Duo",
    hint: "Collect 2 mascots",
    rarity: "medium",
    points: 0,
    coins: 100,
  },
  {
    id: "collect_5mascots",
    emoji: "🎪",
    name: "Mascot Collector",
    hint: "Collect 5 mascots",
    rarity: "hard",
    points: 0,
    coins: 150,
  },
];

export function getAchievementById(id: string): AchievementDef | undefined {
  return ALL_ACHIEVEMENTS.find((a) => a.id === id);
}

// ── Pure check logic (called by the provider) ─────────────────────────────────

export interface AchievementStats {
  postCount: number;
  commentCount: number;
  voteDayCount: number;
  consecutiveActivityDays: number;
  consecutiveVoteDays: number;
  nightPostCount: number; // posts between 22:00–05:00
  midnightPostCount: number; // posts between 00:00–05:00
  hasAroundTheClock: boolean; // morning + afternoon + night on same calendar day
  hasFastResponse: boolean; // commented within 2 min of a post
  villain_arc_max_comments: number; // max comments on any single post
  djDerksenCommentCount: number;    // comments from "dj derksen" fan on user's posts
  abuHarbCommentCount: number;      // comments from "abu harb" fan on user's posts
  hasScheidrechterComment: boolean; // user commented with "scheidsrechter"
  hasRonJansKeyword: boolean;       // user commented with "keukenrol", "ronjansdans", or "pec zwolle"
  hasHutsOrNiffo: boolean;          // user commented with "huts" or "niffo"
  // Progression achievements stats
  packsOpenedCount: number;         // unique pack types opened
  cosmeticsOwnedCount: number;      // total unique cosmetics
  mascotsOwnedCount: number;        // total unique mascots
}

export function resolveNewUnlocks(
  stats: AchievementStats,
  alreadyUnlocked: Set<string>
): AchievementDef[] {
  const checks: [string, boolean][] = [
    ["first_upload",      stats.postCount >= 1],
    ["chatterbox",        stats.commentCount >= 10],
    ["loyal_voter",       stats.voteDayCount >= 3],
    ["midnight_watcher",  stats.midnightPostCount >= 1],
    ["always_watching",   stats.consecutiveActivityDays >= 3],
    ["true_supporter",    stats.postCount >= 5],
    ["daily_presence",    stats.consecutiveActivityDays >= 5],
    ["fast_responder",    stats.hasFastResponse],
    ["democracy_enjoyer", stats.voteDayCount >= 7],
    ["stadium_presence",  stats.consecutiveActivityDays >= 10],
    ["around_the_clock",  stats.hasAroundTheClock],
    ["night_shift",       stats.nightPostCount >= 3],
    ["media_veteran",     stats.postCount >= 10],
    ["content_machine",   stats.postCount >= 15],
    ["democracy_addict",  stats.consecutiveVoteDays >= 14],
    ["villain_arc",       stats.villain_arc_max_comments >= 25],
    ["golden_cor_fan",    stats.villain_arc_max_comments >= 20],
    ["dj_derksen_fan",    stats.djDerksenCommentCount >= 10],
    ["abu_harb_fan",      stats.abuHarbCommentCount >= 10],
    ["jannes_fan",        stats.hasScheidrechterComment],
    ["ron_jans_fan",      stats.hasRonJansKeyword],
    ["udo_fan",           stats.hasHutsOrNiffo],
    // silent_operator: active 5 days but zero posts
    [
      "silent_operator",
      stats.consecutiveActivityDays >= 5 && stats.postCount === 0,
    ],
    // Progression achievements (visible progress, coins-based)
    ["login_7days",        stats.consecutiveActivityDays >= 7],
    ["login_10days",       stats.consecutiveActivityDays >= 10],
    ["login_15days",       stats.consecutiveActivityDays >= 15],
    ["open_10packs",       stats.packsOpenedCount >= 10],
    ["collect_5cosmetics", stats.cosmeticsOwnedCount >= 5],
    ["collect_10cosmetics", stats.cosmeticsOwnedCount >= 10],
    ["collect_1mascot",    stats.mascotsOwnedCount >= 1],
    ["collect_2mascots",   stats.mascotsOwnedCount >= 2],
    ["collect_5mascots",   stats.mascotsOwnedCount >= 5],
  ];

  return checks
    .filter(([id, met]) => met && !alreadyUnlocked.has(id))
    .map(([id]) => getAchievementById(id)!)
    .filter(Boolean);
}

// Consecutive days from a sorted-descending array of "YYYY-MM-DD" strings
export function calcConsecutiveDays(descDates: string[]): number {
  if (descDates.length === 0) return 0;
  let streak = 1;
  for (let i = 1; i < descDates.length; i++) {
    const prev = Date.parse(descDates[i - 1] + "T12:00:00Z");
    const curr = Date.parse(descDates[i] + "T12:00:00Z");
    if (Math.round((prev - curr) / 86_400_000) === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
