"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ALL_ACHIEVEMENTS,
  RARITY_LABEL,
  RARITY_SORT,
  RARITY_STYLE,
  getAchievementById,
} from "@/lib/achievements";

interface UnlockRow {
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  username: string;
}

type View = "overview" | "recent";

export default function AchievementsSection() {
  const [rows, setRows] = useState<UnlockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("overview");

  useEffect(() => {
    async function load() {
      // Fetch unlocks + username map in parallel
      const [unlockRes, profileRes] = await Promise.all([
        supabase
          .from("user_achievements")
          .select("user_id, achievement_id, unlocked_at")
          .order("unlocked_at", { ascending: false })
          .limit(200),
        supabase.from("profiles").select("id, username"),
      ]);

      const userMap = new Map<string, string>(
        ((profileRes.data ?? []) as { id: string; username: string }[]).map(
          (p) => [p.id, p.username]
        )
      );

      const mapped: UnlockRow[] = ((unlockRes.data ?? []) as {
        user_id: string;
        achievement_id: string;
        unlocked_at: string;
      }[]).map((r) => ({
        ...r,
        username: userMap.get(r.user_id) ?? r.user_id.slice(0, 8),
      }));

      setRows(mapped);
      setLoading(false);
    }
    load();
  }, []);

  const countMap = new Map<string, number>();
  for (const r of rows) {
    countMap.set(r.achievement_id, (countMap.get(r.achievement_id) ?? 0) + 1);
  }

  const sortedDefs = [...ALL_ACHIEVEMENTS].sort(
    (a, b) => RARITY_SORT[a.rarity] - RARITY_SORT[b.rarity]
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["overview", "recent"] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="px-3 py-1.5 rounded-full text-xs font-black"
            style={{
              background: view === v ? "#A855F7" : "rgba(255,255,255,0.06)",
              color: view === v ? "#FFFFFF" : "#6B7280",
            }}
          >
            {v === "overview" ? "All Achievements" : "Recent Unlocks"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-11 rounded-2xl animate-pulse"
              style={{ background: "rgba(255,255,255,0.04)" }}
            />
          ))}
        </div>
      ) : view === "overview" ? (
        <div className="space-y-1.5">
          {sortedDefs.map((def) => {
            const count = countMap.get(def.id) ?? 0;
            const style = RARITY_STYLE[def.rarity];
            return (
              <div
                key={def.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-2xl"
                style={{
                  background: count > 0 ? style.bg : "rgba(255,255,255,0.03)",
                  border: `1px solid ${count > 0 ? style.border + "40" : "rgba(255,255,255,0.04)"}`,
                }}
              >
                <span className="text-base">{def.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-black truncate"
                    style={{ color: count > 0 ? "#FFFFFF" : "#374151" }}
                  >
                    {def.name}
                  </p>
                  <p className="text-[10px]" style={{ color: "#4B5563" }}>
                    {RARITY_LABEL[def.rarity]} · {def.points} pts
                  </p>
                </div>
                <span
                  className="text-xs font-black px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    background:
                      count > 0 ? style.badge : "rgba(255,255,255,0.05)",
                    color: count > 0 ? style.text : "#374151",
                  }}
                >
                  {count}×
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-1.5">
          {rows.length === 0 ? (
            <p className="text-xs text-center py-6" style={{ color: "#6B7280" }}>
              No unlocks yet
            </p>
          ) : (
            rows.slice(0, 30).map((r, i) => {
              const def = getAchievementById(r.achievement_id);
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <span className="text-base">{def?.emoji ?? "?"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-white truncate">
                      {def?.name ?? r.achievement_id}
                    </p>
                    <p className="text-[10px]" style={{ color: "#6B7280" }}>
                      {r.username}
                    </p>
                  </div>
                  <span
                    className="text-[10px] flex-shrink-0"
                    style={{ color: "#4B5563" }}
                  >
                    {new Date(r.unlocked_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
