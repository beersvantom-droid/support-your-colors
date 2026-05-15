"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ALL_ACHIEVEMENTS,
  RARITY_LABEL,
  RARITY_STYLE,
  getAchievementById,
} from "@/lib/achievements";

interface Row {
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  profiles: { username: string } | null;
}

export default function AdminAchievementsPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("user_achievements")
      .select("user_id, achievement_id, unlocked_at, profiles(username)")
      .order("unlocked_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setRows((data as unknown as Row[]) ?? []);
        setLoading(false);
      });
  }, []);

  // Count per achievement
  const counts = new Map<string, number>();
  for (const r of rows) {
    counts.set(r.achievement_id, (counts.get(r.achievement_id) ?? 0) + 1);
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#0F172A", border: "1px solid rgba(168,85,247,0.3)" }}
    >
      {/* Header */}
      <div
        className="px-4 py-2.5 flex items-center gap-2"
        style={{ borderBottom: "1px solid rgba(168,85,247,0.15)" }}
      >
        <span className="text-sm">🕵️</span>
        <span
          className="text-[10px] font-black uppercase tracking-widest"
          style={{ color: "#A855F7" }}
        >
          Admin — Achievement Stats
        </span>
      </div>

      <div className="p-3 space-y-3">
        {/* Achievement unlock counts */}
        <div className="space-y-1.5">
          {ALL_ACHIEVEMENTS.map((def) => {
            const count = counts.get(def.id) ?? 0;
            const style = RARITY_STYLE[def.rarity];
            return (
              <div
                key={def.id}
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                <span className="text-base w-6 text-center">{def.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-white truncate">
                    {def.name}
                  </p>
                  <p className="text-[10px]" style={{ color: "#6B7280" }}>
                    {RARITY_LABEL[def.rarity]} · {def.points}pts
                  </p>
                </div>
                <span
                  className="text-xs font-black px-2 py-0.5 rounded-full"
                  style={{
                    background: count > 0 ? style.badge : "rgba(255,255,255,0.06)",
                    color: count > 0 ? style.text : "#4B5563",
                  }}
                >
                  {count}×
                </span>
              </div>
            );
          })}
        </div>

        {/* Recent unlocks */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} className="pt-3">
          <p
            className="text-[10px] font-black uppercase tracking-widest mb-2"
            style={{ color: "#6B7280" }}
          >
            Recent unlocks
          </p>
          {loading ? (
            <p className="text-xs text-gray-500">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-xs text-gray-500">No unlocks yet.</p>
          ) : (
            <div className="space-y-1">
              {rows.slice(0, 15).map((r, i) => {
                const def = getAchievementById(r.achievement_id);
                const username =
                  (r.profiles as any)?.username ?? r.user_id.slice(0, 8);
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm">{def?.emoji ?? "?"}</span>
                    <span className="text-xs font-semibold" style={{ color: "#9CA3AF" }}>
                      {username}
                    </span>
                    <span className="text-xs text-gray-600 flex-1 truncate">
                      {def?.name ?? r.achievement_id}
                    </span>
                    <span className="text-[10px]" style={{ color: "#4B5563" }}>
                      {new Date(r.unlocked_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
