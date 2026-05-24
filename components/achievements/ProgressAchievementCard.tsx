"use client";

import type { AchievementDef } from "@/lib/achievements";

type TierLevel = "bronze" | "silver" | "gold" | null;

interface Props {
  achievement: AchievementDef;
  currentTier: TierLevel;
  currentProgress: number;
  nextTierThreshold: number;
}

const TIER_COLORS = {
  bronze: {
    color: "#CD7F32",
    bg: "rgba(205,127,50,0.1)",
    label: "🥉 Bronze",
  },
  silver: {
    color: "#C0C0C0",
    bg: "rgba(192,192,192,0.1)",
    label: "🥈 Silver",
  },
  gold: {
    color: "#FFD700",
    bg: "rgba(255,215,0,0.1)",
    label: "🥇 Gold",
  },
  locked: {
    color: "#9CA3AF",
    bg: "rgba(0,0,0,0.05)",
    label: "🔒 Locked",
  },
};

export default function ProgressAchievementCard({
  achievement,
  currentTier,
  currentProgress,
  nextTierThreshold,
}: Props) {
  const tierInfo = currentTier ? TIER_COLORS[currentTier] : TIER_COLORS.locked;
  const percentage = Math.min(100, (currentProgress / nextTierThreshold) * 100);

  return (
    <div
      className="rounded-2xl p-4 transition-all"
      style={{
        background: tierInfo.bg,
        border: `2px solid ${tierInfo.color}`,
      }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{achievement.emoji}</span>
            <p className="font-bold text-sm truncate text-gray-900">
              {achievement.name}
            </p>
          </div>
          <p className="text-xs text-gray-500 line-clamp-1">
            {achievement.hint}
          </p>
        </div>

        <div className="flex-shrink-0 text-right ml-3">
          <p
            className="font-black text-sm"
            style={{ color: tierInfo.color }}
          >
            {tierInfo.label}
          </p>
          <p className="text-xs font-semibold text-gray-600 mt-1">
            {currentProgress}/{nextTierThreshold}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
        <div
          className="h-full transition-all duration-300"
          style={{
            background: tierInfo.color,
            width: `${percentage}%`,
          }}
        />
      </div>

      {currentTier === "gold" && (
        <p className="text-xs text-center mt-2 font-bold" style={{ color: tierInfo.color }}>
          ⭐ Maximum tier reached!
        </p>
      )}
    </div>
  );
}
