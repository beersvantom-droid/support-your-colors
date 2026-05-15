"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TEAMS } from "@/lib/wc2026-data";
import { getCountryFlag } from "@/lib/countries";
import type { Profile } from "@/lib/supabase";
import { Award, Target, Zap } from "lucide-react";

interface PlayerWithTournamentPoints {
  profile: Profile;
  tournamentPoints: number;
  countryRecord: { wins: number; draws: number; losses: number };
}

export default function TournamentPerformance() {
  const [rankings, setRankings] = useState<PlayerWithTournamentPoints[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTournamentRankings() {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .not("country", "is", null)
        .order("supporter_points", { ascending: false });

      if (!error && data) {
        const withTournamentPoints = (data as Profile[]).map((profile) => ({
          profile,
          tournamentPoints: profile.tournament_points ?? 0,
          countryRecord: { wins: 0, draws: 0, losses: 0 },
        }));

        withTournamentPoints.sort((a, b) => b.tournamentPoints - a.tournamentPoints);
        setRankings(withTournamentPoints);
      }
      setLoading(false);
    }

    fetchTournamentRankings();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-3xl mb-2">⚽</div>
          <p className="text-sm font-semibold text-text-muted">Loading tournament data…</p>
        </div>
      </div>
    );
  }

  const tournamentStarted = rankings.some((r) => r.tournamentPoints > 0);

  return (
    <div className="space-y-3 px-4">
      {/* Pre-tournament banner */}
      {!tournamentStarted && rankings.length > 0 && (
        <div
          className="rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}
        >
          <span className="text-xl flex-shrink-0">⏳</span>
          <div>
            <p className="text-xs font-black text-blue-800">Tournament starts June 2026</p>
            <p className="text-xs font-semibold text-blue-600 mt-0.5">
              Points update after each match · Win=500 · Draw=250 · Loss=100
            </p>
          </div>
        </div>
      )}

      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Award, label: "Leader", value: rankings[0]?.profile.username || "—", color: "#FFD700" },
          { icon: Target, label: "Avg Points", value: rankings.length > 0 ? Math.floor(rankings.reduce((sum, r) => sum + (r.tournamentPoints ?? 0), 0) / rankings.length) : 0, color: "#3B82F6" },
          { icon: Zap, label: "Total Matches", value: rankings.length > 0 ? (rankings[0].countryRecord.wins + rankings[0].countryRecord.draws + rankings[0].countryRecord.losses) * rankings.length : 0, color: "#F59E0B" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div
            key={label}
            className="rounded-2xl p-3 text-center"
            style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <Icon size={16} style={{ color }} className="mx-auto mb-1" />
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">{label}</p>
            <p className="text-sm font-black text-text-primary mt-1 truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* Rankings Table */}
      <div className="space-y-2">
        {rankings.map((item, index) => {
          const teamInfo = TEAMS[item.profile.country || ""];
          const countryFlag = getCountryFlag(item.profile.country);
          const wins = item.countryRecord.wins ?? 0;
          const draws = item.countryRecord.draws ?? 0;
          const losses = item.countryRecord.losses ?? 0;
          const totalMatches = wins + draws + losses;
          const winRate = totalMatches > 0 ? Math.floor((wins / totalMatches) * 100) : 0;

          return (
            <div
              key={item.profile.id}
              className="rounded-2xl p-4"
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  {/* Rank Badge */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white"
                    style={{
                      background: index === 0 ? "#FFD700" : index === 1 ? "#C0C0C0" : index === 2 ? "#CD7F32" : "#E5E7EB",
                      color: index < 3 ? "white" : "#6B7280",
                    }}
                  >
                    {index + 1}
                  </div>

                  {/* Country & Supporter */}
                  <div>
                    <p className="text-sm font-bold text-text-primary flex items-center gap-2">
                      <span className="text-lg">{countryFlag}</span>
                      {item.profile.username}
                    </p>
                    <p className="text-xs text-text-muted">
                      {wins}W-{draws}D-{losses}L
                    </p>
                  </div>
                </div>

                {/* Tournament Points */}
                <div className="text-right">
                  <p className="text-lg font-black text-text-primary">{item.tournamentPoints ?? 0}</p>
                  {totalMatches > 0 && (
                    <p className="text-xs font-semibold text-green-600">{winRate}% Win Rate</p>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(((item.tournamentPoints ?? 0) / 2500) * 100, 100)}%`,
                    background: "linear-gradient(90deg, #3B82F6, #06B6D4)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {rankings.length === 0 && !loading && (
        <div className="space-y-3 px-4">
          <div
            className="rounded-2xl p-5 text-center"
            style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <p className="text-3xl mb-2">⚽</p>
            <p className="text-sm font-black text-text-primary">Tournament hasn't started yet</p>
            <p className="text-xs font-semibold mt-1 text-text-muted">
              Country performance will appear here once matches begin
            </p>
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-2xl p-4"
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(0,0,0,0.06)",
                opacity: 1 - i * 0.12,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg"
                    style={{ background: "#F3F4F6" }}
                  />
                  <div className="space-y-1.5">
                    <div className="h-3 w-24 rounded-full" style={{ background: "#F3F4F6" }} />
                    <div className="h-2 w-14 rounded-full" style={{ background: "#F9FAFB" }} />
                  </div>
                </div>
                <div className="h-6 w-10 rounded-full" style={{ background: "#F3F4F6" }} />
              </div>
              <div className="w-full h-2 rounded-full" style={{ background: "#F3F4F6" }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
