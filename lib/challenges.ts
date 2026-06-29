export interface ChallengeReward {
  type: "mascot" | "card_bg" | "badge" | "coins";
  cosmeticId?: string;
  amount?: number;
  label: string;
  emoji: string;
}

export interface Challenge {
  id: string;
  mascotLabel: string;
  mascotEmoji: string;
  mascotImage: string;
  packImage: string;
  targetPoints: number;
  startDate: string;
  endDate: string;
  mode: "community" | "mystery";
  multipliers?: Record<string, number>;
  rewards: ChallengeReward[];
  fallbackReward: { type: "coins"; amount: number };
}

export const ACTION_POINTS = {
  post: 100,
  comment: 40,
  reaction: 10,
  prediction: 5,
  chat_message: 3,
  vote: 50,
} as const;

export const CHALLENGES: Challenge[] = [
  {
    id: "week1_goat",
    mascotLabel: "GOAT",
    mascotEmoji: "🐐",
    mascotImage: "/mascots/goat.png",
    packImage: "/packs/goatpack.png",
    targetPoints: 12_500,
    startDate: "2026-06-23",
    endDate: "2026-06-29",
    mode: "community",
    rewards: [
      { type: "mascot", cosmeticId: "mascot_goat", label: "GOAT", emoji: "🐐" },
      { type: "mascot", cosmeticId: "mascot_goat", label: "GOAT", emoji: "🐐" },
      { type: "mascot", cosmeticId: "mascot_goat", label: "GOAT", emoji: "🐐" },
    ],
    fallbackReward: { type: "coins", amount: 50 },
  },
  {
    id: "week2_hand_van_god",
    mascotLabel: "Hand van God",
    mascotEmoji: "✋",
    mascotImage: "/mascots/hand-van-god.png",
    packImage: "/packs/hand-van-god-pack.png",
    targetPoints: 15_000,
    startDate: "2026-06-29",
    endDate: "2026-07-06",
    mode: "mystery",
    multipliers: {
      "Tuur": 10, "Finn": 8, "Siem": 6, "Tobias ": 5, "Tiemen": 4,
      "Michiel": 4, "Sep": 3, "Roel": 3, "Kas": 2, "Jokk": 2,
      "Willem": 1, "Albert": 1, "Tom (Built)": 1,
    },
    rewards: [
      { type: "mascot", cosmeticId: "mascot_hand_van_god", label: "Hand van God", emoji: "✋" },
      { type: "card_bg", cosmeticId: "bg_hand_van_god", label: "Hand van God BG", emoji: "🎴" },
      { type: "badge", cosmeticId: "badge_kami", label: "神 Kami Badge", emoji: "神" },
    ],
    fallbackReward: { type: "coins", amount: 150 },
  },
];

export function getActiveChallenge(): Challenge | null {
  const now = new Date();
  return CHALLENGES.find((c) => {
    const start = new Date(c.startDate + "T00:00:00+02:00");
    const end = new Date(c.endDate + "T23:59:59+02:00");
    return now >= start && now <= end;
  }) ?? null;
}
