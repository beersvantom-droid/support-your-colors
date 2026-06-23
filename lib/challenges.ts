export interface Challenge {
  id: string;
  mascotId: string;
  mascotLabel: string;
  mascotEmoji: string;
  mascotImage: string;
  targetPoints: number;
  startDate: string;
  endDate: string;
  rewards: {
    top3: { type: "mascot"; mascotId: string };
    rank4to6: { type: "coins"; amount: number };
    rest: { type: "coins"; amount: number };
  };
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
    mascotId: "mascot_goat",
    mascotLabel: "GOAT",
    mascotEmoji: "🐐",
    mascotImage: "/mascots/goat.png",
    targetPoints: 12_500,
    startDate: "2026-06-23",
    endDate: "2026-06-29",
    rewards: {
      top3: { type: "mascot", mascotId: "mascot_goat" },
      rank4to6: { type: "coins", amount: 150 },
      rest: { type: "coins", amount: 50 },
    },
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
