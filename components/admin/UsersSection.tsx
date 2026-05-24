"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronDown, ChevronUp, RotateCcw, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getCountryFlag } from "@/lib/countries";
import { getAchievementById, RARITY_STYLE } from "@/lib/achievements";
import type { Profile, UserAchievement } from "@/lib/supabase";

interface UserStat extends Profile {
  postCount: number;
  commentCount: number;
  voteCount: number;
  achievementCount: number;
}

interface AchievementRow extends UserAchievement {
  // joined with ALL_ACHIEVEMENTS definition
  emoji: string;
  name: string;
  rarity: "easy" | "medium" | "hard" | "secret";
}

export default function UsersSection() {
  const [users, setUsers] = useState<UserStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  // achievements keyed by user_id; null = not loaded yet
  const [achievements, setAchievements] = useState<Record<string, AchievementRow[]>>({});
  const [achLoading, setAchLoading] = useState<string | null>(null);
  // resetting = "userId:achievementId"
  const [resetting, setResetting] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [profilesRes, postsRes, commentsRes, votesRes, achRes] = await Promise.all([
        supabase.from("profiles").select("*").order("supporter_points", { ascending: false }),
        supabase.from("posts").select("username"),
        supabase.from("comments").select("username"),
        supabase.from("daily_votes").select("voter_id"),
        supabase.from("user_achievements").select("user_id"),
      ]);

      const profiles = (profilesRes.data ?? []) as Profile[];

      const postCounts = new Map<string, number>();
      for (const p of postsRes.data ?? []) {
        postCounts.set(p.username, (postCounts.get(p.username) ?? 0) + 1);
      }
      const commentCounts = new Map<string, number>();
      for (const c of commentsRes.data ?? []) {
        commentCounts.set(c.username, (commentCounts.get(c.username) ?? 0) + 1);
      }
      const voteCounts = new Map<string, number>();
      for (const v of votesRes.data ?? []) {
        voteCounts.set(v.voter_id, (voteCounts.get(v.voter_id) ?? 0) + 1);
      }
      const achCounts = new Map<string, number>();
      for (const a of achRes.data ?? []) {
        achCounts.set(a.user_id, (achCounts.get(a.user_id) ?? 0) + 1);
      }

      setUsers(
        profiles.map((p) => ({
          ...p,
          postCount: postCounts.get(p.username) ?? 0,
          commentCount: commentCounts.get(p.username) ?? 0,
          voteCount: voteCounts.get(p.id) ?? 0,
          achievementCount: achCounts.get(p.id) ?? 0,
        }))
      );
      setLoading(false);
    }
    load();
  }, []);

  // Load achievements for a user the first time they expand
  const loadAchievements = useCallback(async (userId: string) => {
    if (achievements[userId]) return; // already loaded
    setAchLoading(userId);

    const { data } = await supabase
      .from("user_achievements")
      .select("*")
      .eq("user_id", userId)
      .order("unlocked_at", { ascending: false });

    const rows: AchievementRow[] = ((data ?? []) as UserAchievement[]).flatMap((row) => {
      const def = getAchievementById(row.achievement_id);
      if (!def) return [];
      return [{ ...row, emoji: def.emoji, name: def.name, rarity: def.rarity }];
    });

    setAchievements((prev) => ({ ...prev, [userId]: rows }));
    setAchLoading(null);
  }, [achievements]);

  function toggleExpand(userId: string) {
    const next = expanded === userId ? null : userId;
    setExpanded(next);
    setResetError(null);
    if (next) loadAchievements(next);
  }

  async function handleReset(user: UserStat, ach: AchievementRow) {
    const key = `${user.id}:${ach.achievement_id}`;
    setResetting(key);
    setResetError(null);

    try {
      const res = await fetch("/api/admin/reset-achievement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          achievementRowId: ach.id,
          userId:           user.id,
          pointsAwarded:    ach.points_awarded,
        }),
      });

      let data: { success?: boolean; error?: string } = {};
      try { data = await res.json(); } catch { /* empty / non-JSON body */ }

      if (!res.ok) {
        throw new Error(data.error ?? "Reset failed");
      }

      // Remove from local state
      setAchievements((prev) => ({
        ...prev,
        [user.id]: prev[user.id].filter((r) => r.id !== ach.id),
      }));

      // Decrement trophy count badge on the user card
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, achievementCount: Math.max(0, u.achievementCount - 1) }
            : u
        )
      );
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setResetting(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-14 rounded-2xl animate-pulse"
            style={{ background: "rgba(255,255,255,0.04)" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p
        className="text-[10px] font-black uppercase tracking-widest mb-3"
        style={{ color: "#6B7280" }}
      >
        {users.length} users
      </p>

      {users.map((u) => {
        const countryFlag = getCountryFlag(u.country);
        const isOpen = expanded === u.id;
        const userAch = achievements[u.id] ?? [];

        return (
          <div
            key={u.id}
            className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* ── User row header ─────────────────────────────────────────── */}
            <button
              className="w-full flex items-center gap-3 px-3 py-3 text-left"
              onClick={() => toggleExpand(u.id)}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                {countryFlag}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white truncate">{u.username}</p>
                <p className="text-[10px]" style={{ color: "#6B7280" }}>
                  {u.rank}
                </p>
              </div>

              <div className="text-right flex-shrink-0 mr-1">
                <p className="text-xs font-black" style={{ color: "#F59E0B" }}>
                  {u.supporter_points} SP
                </p>
                <p className="text-[10px]" style={{ color: "#3B82F6" }}>
                  {u.tournament_points} TP
                </p>
              </div>

              {isOpen ? (
                <ChevronUp size={14} color="#4B5563" className="flex-shrink-0" />
              ) : (
                <ChevronDown size={14} color="#4B5563" className="flex-shrink-0" />
              )}
            </button>

            {isOpen && (
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                {/* ── Stats grid ────────────────────────────────────────── */}
                <div className="grid grid-cols-4 gap-2 px-3 pt-2.5 pb-3">
                  {[
                    { label: "Posts",    value: u.postCount,        color: "#10B981" },
                    { label: "Comments", value: u.commentCount,     color: "#3B82F6" },
                    { label: "Votes",    value: u.voteCount,        color: "#F59E0B" },
                    { label: "Trophies", value: u.achievementCount, color: "#A855F7" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center">
                      <p className="text-sm font-black" style={{ color }}>{value}</p>
                      <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: "#4B5563" }}>
                        {label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* ── Achievements list ──────────────────────────────────── */}
                <div
                  className="px-3 pb-3 space-y-1.5"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <p
                    className="text-[9px] font-black uppercase tracking-widest pt-2.5 pb-1"
                    style={{ color: "#4B5563" }}
                  >
                    Unlocked achievements
                  </p>

                  {achLoading === u.id && (
                    <div className="flex items-center gap-2 py-2">
                      <Loader2 size={12} color="#4B5563" className="animate-spin" />
                      <span className="text-[10px]" style={{ color: "#4B5563" }}>Loading…</span>
                    </div>
                  )}

                  {achLoading !== u.id && userAch.length === 0 && (
                    <p className="text-[10px] py-1" style={{ color: "#374151" }}>
                      No achievements yet
                    </p>
                  )}

                  {userAch.map((ach) => {
                    const style = RARITY_STYLE[ach.rarity];
                    const key = `${u.id}:${ach.achievement_id}`;
                    const isResetting = resetting === key;
                    const unlockedAt = new Date(ach.unlocked_at).toLocaleString("en-GB", {
                      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                    });

                    return (
                      <div
                        key={ach.id}
                        className="flex items-center gap-2.5 rounded-xl px-2.5 py-2"
                        style={{
                          background: style.bg,
                          border: `1px solid ${style.border}40`,
                        }}
                      >
                        <span className="text-base flex-shrink-0">{ach.emoji}</span>

                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black leading-tight" style={{ color: style.text }}>
                            {ach.name}
                            <span
                              className="ml-1.5 text-[10px] font-bold"
                              style={{ color: "#6B7280" }}
                            >
                              +{ach.points_awarded}
                            </span>
                          </p>
                          <p className="text-[9px] font-medium mt-0.5" style={{ color: "#4B5563" }}>
                            {unlockedAt}
                          </p>
                        </div>

                        <button
                          onClick={() => handleReset(u, ach)}
                          disabled={isResetting}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black flex-shrink-0 transition-all active:scale-95"
                          style={{
                            background: "rgba(239,68,68,0.12)",
                            color: isResetting ? "#4B5563" : "#EF4444",
                            border: "1px solid rgba(239,68,68,0.20)",
                          }}
                        >
                          {isResetting ? (
                            <Loader2 size={9} className="animate-spin" />
                          ) : (
                            <RotateCcw size={9} />
                          )}
                          {isResetting ? "…" : "Reset"}
                        </button>
                      </div>
                    );
                  })}

                  {resetError && (
                    <p className="text-[10px] font-semibold pt-1" style={{ color: "#EF4444" }}>
                      ⚠️ {resetError}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
