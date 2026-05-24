"use client";

import type { AchievementDef } from "@/lib/achievements";
import { RARITY_STYLE } from "@/lib/achievements";

interface Props {
  achievement: AchievementDef;
  currentProgress: number;
  targetProgress: number;
  unlocked: boolean;
}

export default function ProgressAchievementCard({
  achievement,
  currentProgress,
  targetProgress,
  unlocked,
}: Props) {
  const style = RARITY_STYLE[achievement.rarity];
  const percentage = Math.min(100, (currentProgress / targetProgress) * 100);

  return (
    <div
      className="rounded-2xl p-4 transition-all"
      style={{
        background: unlocked ? style.bg : "rgba(0,0,0,0.05)",
        border: `2px solid ${unlocked ? style.border : "#E5E7EB"}`,
      }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{achievement.emoji}</span>
            <p
              className="font-bold text-sm truncate"
              style={{
                color: unlocked ? style.text : "#6B7280",
              }}
            >
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
            style={{
              color: unlocked ? style.text : "#9CA3AF",
            }}
          >
            {currentProgress}/{targetProgress}
          </p>
          {achievement.coins && (
            <p
              className="text-xs font-black"
              style={{
                color: unlocked ? style.text : "#D1D5DB",
              }}
            >
              +{achievement.coins} 🪙
            </p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
        <div
          className="h-full transition-all duration-300"
          style={{
            background: unlocked
              ? `linear-gradient(90deg, ${style.border}, ${style.border}dd)`
              : "#9CA3AF",
            width: `${percentage}%`,
          }}
        />
      </div>

      {unlocked && (
        <p className="text-xs text-center mt-2 font-bold" style={{ color: style.text }}>
          ✓ Unlocked!
        </p>
      )}
    </div>
  );
}
