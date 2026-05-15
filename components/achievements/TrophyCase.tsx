"use client";

import { getAchievementById, RARITY_LABEL, RARITY_SORT, RARITY_STYLE } from "@/lib/achievements";
import type { UserAchievement } from "@/lib/supabase";

interface Props {
  userAchievements: UserAchievement[];
}

export default function TrophyCase({ userAchievements }: Props) {
  if (userAchievements.length === 0) {
    return (
      <div
        className="rounded-2xl p-6 text-center"
        style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
      >
        <p className="text-3xl mb-2">🏆</p>
        <p className="text-sm font-black text-gray-800">No trophies yet</p>
        <p className="text-xs font-semibold mt-1" style={{ color: "#9CA3AF" }}>
          Achievements unlock automatically — keep supporting!
        </p>
      </div>
    );
  }

  // Sort by rarity (rarest first) then unlock date (newest first)
  const sorted = [...userAchievements].sort((a, b) => {
    const defA = getAchievementById(a.achievement_id);
    const defB = getAchievementById(b.achievement_id);
    if (!defA || !defB) return 0;
    const rarityDiff = RARITY_SORT[defA.rarity] - RARITY_SORT[defB.rarity];
    if (rarityDiff !== 0) return rarityDiff;
    return new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime();
  });

  return (
    <div className="space-y-2">
      {sorted.map((ua) => {
        const def = getAchievementById(ua.achievement_id);
        if (!def) return null;
        const style = RARITY_STYLE[def.rarity];

        const unlockDate = new Date(ua.unlocked_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        return (
          <div
            key={ua.id || ua.achievement_id}
            className="flex items-center gap-3 rounded-2xl p-3"
            style={{
              background: style.bg,
              border: `1.5px solid ${style.border}`,
              boxShadow: `0 2px 12px ${style.glow}`,
            }}
          >
            {/* Emoji badge */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{
                background: "#FFFFFF",
                border: `1.5px solid ${style.border}`,
                boxShadow: `0 0 12px ${style.glow}`,
              }}
            >
              {def.emoji}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-gray-900 truncate">
                {def.name}
              </p>
              <p
                className="text-[11px] font-semibold truncate"
                style={{ color: "#9CA3AF" }}
              >
                {def.hint}
              </p>
            </div>

            {/* Right: rarity + points */}
            <div className="flex-shrink-0 text-right">
              <span
                className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black"
                style={{ background: style.badge, color: style.text }}
              >
                {RARITY_LABEL[def.rarity]}
              </span>
              <p
                className="text-xs font-black mt-0.5"
                style={{ color: style.text }}
              >
                +{ua.points_awarded} pts
              </p>
              <p
                className="text-[10px] font-semibold"
                style={{ color: "#C4C4C4" }}
              >
                {unlockDate}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
