"use client";

import { useEffect, useState } from "react";
import type { AchievementDef } from "@/lib/achievements";
import { RARITY_LABEL, RARITY_STYLE } from "@/lib/achievements";
import { getMascotById, getCosmeticById } from "@/lib/cosmetics";
import MascotSprite from "@/components/mascot/MascotSprite";

interface Props {
  achievement: AchievementDef;
  onDismiss: () => void;
}

export default function AchievementUnlockModal({ achievement, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);
  const style = RARITY_STYLE[achievement.rarity];

  // Trigger entrance animation on mount
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Play Jannes sound when achievement unlocks
  useEffect(() => {
    if (achievement.id === "jannes_fan" && visible) {
      try {
        const audio = new Audio("/sounds/reveal/jannes.wav");
        audio.volume = 0.7;
        audio.play().catch(() => {});
      } catch (err) {
        // Silent fail
      }
    }
  }, [achievement.id, visible]);

  function handleDismiss() {
    setVisible(false);
    setTimeout(onDismiss, 280);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-6"
        style={{
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          opacity: visible ? 1 : 0,
          transition: "opacity 280ms ease",
        }}
        onClick={handleDismiss}
      >
        {/* Card */}
        <div
          className="w-full max-w-xs rounded-3xl overflow-hidden"
          style={{
            background: "#FFFFFF",
            border: `2px solid ${style.border}`,
            boxShadow: `0 0 60px ${style.glow}, 0 24px 48px rgba(0,0,0,0.25)`,
            transform: visible ? "scale(1) translateY(0)" : "scale(0.88) translateY(20px)",
            transition: "transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 280ms ease",
            opacity: visible ? 1 : 0,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header accent */}
          <div
            className="h-1.5 w-full"
            style={{
              background: `linear-gradient(90deg, ${style.border}, ${style.border}88)`,
            }}
          />

          <div className="px-6 pt-6 pb-5 text-center">
            {/* Glow ring behind emoji */}
            <div className="relative inline-flex items-center justify-center mb-4">
              <div
                className="absolute w-20 h-20 rounded-full"
                style={{ background: style.glow, filter: "blur(14px)" }}
              />
              <div
                className="relative w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
                style={{
                  background: style.bg,
                  border: `2px solid ${style.border}`,
                }}
              >
                {achievement.emoji}
              </div>
            </div>

            {/* "Achievement Unlocked" label */}
            <p
              className="text-[10px] font-black uppercase tracking-[0.15em] mb-1"
              style={{ color: style.text }}
            >
              Achievement Unlocked
            </p>

            {/* Achievement name */}
            <h2 className="text-xl font-black text-gray-900 mb-1">
              {achievement.name}
            </h2>

            {/* Hint */}
            <p className="text-sm font-semibold text-gray-400 mb-4">
              {achievement.hint}
            </p>

            {/* Rarity badge */}
            <div className="mb-4">
              <span
                className="px-3 py-1 rounded-full text-xs font-black"
                style={{ background: style.badge, color: style.text }}
              >
                {RARITY_LABEL[achievement.rarity]}
              </span>
            </div>

            {/* Cosmetic Reward (if applicable) */}
            {achievement.unlocksCosmetic && (() => {
              const mascot = getMascotById(achievement.unlocksCosmetic);
              const cosmetic = getCosmeticById(achievement.unlocksCosmetic);
              const reward = mascot || cosmetic;

              return reward ? (
                <div className="mb-5">
                  {/* Mascot sprite preview */}
                  {mascot && (
                    <div className="flex justify-center mb-3">
                      <MascotSprite id={achievement.unlocksCosmetic} size={60} />
                    </div>
                  )}

                  {/* Reward text */}
                  <p className="text-sm font-black mb-2" style={{ color: style.text }}>
                    + {reward.label}
                  </p>
                  <p className="text-xs text-gray-400">
                    {mascot ? "Legendary Mascot" : "Cosmetic Unlocked"}
                  </p>
                </div>
              ) : null;
            })()}

            {/* Points or Coins reward row (if no cosmetic) */}
            {!achievement.unlocksCosmetic && (
              <div className="mb-5">
                {achievement.coins ? (
                  <span
                    className="text-sm font-black"
                    style={{ color: style.text }}
                  >
                    +{achievement.coins} 🪙
                  </span>
                ) : (
                  <span
                    className="text-sm font-black"
                    style={{ color: style.text }}
                  >
                    +{achievement.points} pts
                  </span>
                )}
              </div>
            )}

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="w-full py-3.5 rounded-2xl text-sm font-black text-white transition-all active:scale-[0.97]"
              style={{
                background: `linear-gradient(135deg, ${style.border}, ${style.border}bb)`,
                boxShadow: `0 6px 20px ${style.glow}`,
              }}
            >
              Nice! 🎉
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
