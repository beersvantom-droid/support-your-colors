"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getCountryFlag } from "@/lib/countries";
import type { Profile } from "@/lib/supabase";

interface UserStat extends Profile {
  postCount: number;
  commentCount: number;
  voteCount: number;
  achievementCount: number;
}

export default function UsersSection() {
  const [users, setUsers] = useState<UserStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

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

        return (
          <div
            key={u.id}
            className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <button
              className="w-full flex items-center gap-3 px-3 py-3 text-left"
              onClick={() => setExpanded(isOpen ? null : u.id)}
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
              <div
                className="grid grid-cols-4 gap-2 px-3 pb-3 pt-2.5"
                style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
              >
                {[
                  { label: "Posts", value: u.postCount, color: "#10B981" },
                  { label: "Comments", value: u.commentCount, color: "#3B82F6" },
                  { label: "Votes", value: u.voteCount, color: "#F59E0B" },
                  { label: "Trophies", value: u.achievementCount, color: "#A855F7" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center">
                    <p className="text-sm font-black" style={{ color }}>
                      {value}
                    </p>
                    <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: "#4B5563" }}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
