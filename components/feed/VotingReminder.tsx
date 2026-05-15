"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import { getVotingDay, getTimeUntilVotingReset } from "@/lib/voting";

export default function VotingReminder() {
  const { user, loading } = useAuth();
  const [hasVoted, setHasVoted] = useState<boolean | null>(null);
  const [timeLeft, setTimeLeft] = useState(getTimeUntilVotingReset);

  useEffect(() => {
    if (!user) {
      setHasVoted(false);
      return;
    }
    Promise.resolve(
      supabase
        .from("daily_votes")
        .select("id")
        .eq("voter_id", user.id)
        .eq("vote_date", getVotingDay())
        .maybeSingle()
    )
      .then(({ data }) => setHasVoted(!!data))
      .catch(() => setHasVoted(false));
  }, [user]);

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(getTimeUntilVotingReset()), 60000);
    return () => clearInterval(t);
  }, []);

  if (loading || hasVoted === null) return null;

  if (hasVoted) {
    return (
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
          border: "1.5px solid #86efac",
          boxShadow: "0 2px 12px rgba(34,197,94,0.12)",
        }}
      >
        <div className="px-4 py-3 flex items-center gap-3">
          <span className="text-2xl flex-shrink-0">✅</span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-black text-green-800 leading-tight">
              Votes submitted
            </p>
            <p className="text-[10px] font-semibold text-green-600 mt-0.5">
              Rankings locked in · Resets in {timeLeft}
            </p>
          </div>
          <Link
            href="/leaderboard"
            className="text-[10px] font-black px-2.5 py-1.5 rounded-lg flex-shrink-0"
            style={{ background: "#22c55e", color: "#ffffff" }}
          >
            Standings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden relative"
      style={{
        background: "linear-gradient(135deg, #1A3A6E 0%, #0f2347 100%)",
        boxShadow: "0 4px 20px rgba(26,58,110,0.25)",
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />
      <div className="relative px-4 py-3 flex items-center gap-3">
        <span className="text-2xl flex-shrink-0">🗳️</span>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-black text-white leading-tight">
            Daily voting is open
          </p>
          <p className="text-[10px] font-semibold mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
            ⏳ {timeLeft} remaining · Closes at 05:00
          </p>
        </div>
        <Link
          href="/voting"
          className="text-[11px] font-black px-3 py-1.5 rounded-xl flex-shrink-0 transition-all active:scale-95"
          style={{
            background: "#D52B1E",
            color: "#ffffff",
            boxShadow: "0 2px 8px rgba(213,43,30,0.4)",
          }}
        >
          Cast votes
        </Link>
      </div>
    </div>
  );
}
