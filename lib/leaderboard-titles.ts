export const SUPPORTER_TITLES = [
  { rank: 1, emoji: "👑", title: "Ultimate Supporter", color: "#FFD700" },
  { rank: 2, emoji: "🥈", title: "Devoted Fan", color: "#C0C0C0" },
  { rank: 3, emoji: "🥉", title: "Faithful Follower", color: "#CD7F32" },
  { rank: 4, emoji: "⚡", title: "Rising Star", color: "#FF6B35" },
  { rank: 5, emoji: "🔥", title: "Flame Keeper", color: "#FF4500" },
  { rank: 6, emoji: "✨", title: "Shining Light", color: "#FFD700" },
  { rank: 7, emoji: "🎯", title: "True Believer", color: "#4169E1" },
  { rank: 8, emoji: "💪", title: "Steadfast Supporter", color: "#20B2AA" },
  { rank: 9, emoji: "🌟", title: "Fan Favorite", color: "#FF69B4" },
  { rank: 10, emoji: "🎭", title: "Supporting Cast", color: "#8B4513" },
  { rank: 11, emoji: "👀", title: "Watchful Observer", color: "#696969" },
  { rank: 12, emoji: "💤", title: "Casual Spectator", color: "#A9A9A9" },
  { rank: 13, emoji: "🪦", title: "Tournament Ghost", color: "#708090" },
] as const;

export function getTitleByRank(rank: number) {
  return SUPPORTER_TITLES.find((t) => t.rank === rank) || SUPPORTER_TITLES[SUPPORTER_TITLES.length - 1];
}
