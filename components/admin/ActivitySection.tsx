"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getAchievementById } from "@/lib/achievements";

interface ActivityItem {
  type: "post" | "comment" | "vote" | "achievement";
  username: string;
  detail: string;
  timestamp: string;
}

const TYPE_CONFIG = {
  post:        { emoji: "📸", color: "#10B981", label: "posted" },
  comment:     { emoji: "💬", color: "#3B82F6", label: "commented" },
  vote:        { emoji: "🗳️", color: "#F59E0B", label: "voted" },
  achievement: { emoji: "🏆", color: "#A855F7", label: "unlocked" },
};

function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ActivitySection() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Fetch username map first
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, username");
      const userMap = new Map<string, string>(
        ((profileData ?? []) as { id: string; username: string }[]).map(
          (p) => [p.id, p.username]
        )
      );

      const [postsRes, commentsRes, votesRes, achRes] = await Promise.all([
        supabase
          .from("posts")
          .select("username, created_at, caption")
          .order("created_at", { ascending: false })
          .limit(25),
        supabase
          .from("comments")
          .select("username, created_at, comment_text")
          .order("created_at", { ascending: false })
          .limit(25),
        supabase
          .from("daily_votes")
          .select("voter_id, created_at")
          .order("created_at", { ascending: false })
          .limit(25),
        supabase
          .from("user_achievements")
          .select("user_id, achievement_id, unlocked_at")
          .order("unlocked_at", { ascending: false })
          .limit(25),
      ]);

      const all: ActivityItem[] = [];

      for (const p of (postsRes.data ?? []) as {
        username: string;
        created_at: string;
        caption: string | null;
      }[]) {
        const cap = p.caption;
        all.push({
          type: "post",
          username: p.username,
          detail: cap
            ? `"${cap.slice(0, 50)}${cap.length > 50 ? "…" : ""}"`
            : "created a post",
          timestamp: p.created_at,
        });
      }

      for (const c of (commentsRes.data ?? []) as {
        username: string;
        created_at: string;
        comment_text: string;
      }[]) {
        const txt = c.comment_text ?? "";
        all.push({
          type: "comment",
          username: c.username,
          detail: `"${txt.slice(0, 50)}${txt.length > 50 ? "…" : ""}"`,
          timestamp: c.created_at,
        });
      }

      for (const v of (votesRes.data ?? []) as {
        voter_id: string;
        created_at: string;
      }[]) {
        all.push({
          type: "vote",
          username: userMap.get(v.voter_id) ?? v.voter_id.slice(0, 8),
          detail: "voted for today",
          timestamp: v.created_at,
        });
      }

      for (const a of (achRes.data ?? []) as {
        user_id: string;
        achievement_id: string;
        unlocked_at: string;
      }[]) {
        const def = getAchievementById(a.achievement_id);
        all.push({
          type: "achievement",
          username: userMap.get(a.user_id) ?? a.user_id.slice(0, 8),
          detail: `${def?.emoji ?? "🏆"} ${def?.name ?? a.achievement_id}`,
          timestamp: a.unlocked_at,
        });
      }

      all.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setItems(all.slice(0, 50));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-1.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-12 rounded-xl animate-pulse"
            style={{ background: "rgba(255,255,255,0.04)" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <p
        className="text-[10px] font-black uppercase tracking-widest mb-3"
        style={{ color: "#6B7280" }}
      >
        {items.length} recent events
      </p>

      {items.length === 0 ? (
        <p className="text-xs text-center py-6" style={{ color: "#6B7280" }}>
          No activity yet
        </p>
      ) : (
        items.map((item, i) => {
          const cfg = TYPE_CONFIG[item.type];
          return (
            <div
              key={i}
              className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
                style={{ background: `${cfg.color}15` }}
              >
                {cfg.emoji}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs text-white leading-snug">
                  <span className="font-black">{item.username}</span>{" "}
                  <span style={{ color: "#9CA3AF" }}>
                    {item.type === "achievement" ? "unlocked" : cfg.label}{" "}
                    {item.detail}
                  </span>
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "#4B5563" }}>
                  {relativeTime(item.timestamp)}
                </p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
