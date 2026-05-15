"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCountryFlag } from "@/lib/countries";
import { getTitleByRank, SUPPORTER_TITLES } from "@/lib/leaderboard-titles";
import type { Profile } from "@/lib/supabase";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function FanSupportRanking() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("supporter_points", { ascending: false })
        .limit(13);

      if (!error && data) {
        setProfiles(data as Profile[]);
      }
      setLoading(false);
    }

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-3xl mb-2">⚽</div>
          <p className="text-sm font-semibold text-text-muted">Loading rankings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Podium for Top 3 */}
      {profiles.length > 0 && (
        <div className="relative px-4 pt-8 pb-4">
          <div className="flex items-flex-end justify-center gap-2 h-40">
            {/* 2nd Place */}
            {profiles[1] && (
              <div className="flex-1 flex flex-col items-center">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-2xl mb-2 shadow-md">
                  {getCountryFlag(profiles[1].country)}
                </div>
                <div className="w-full rounded-t-3xl bg-gradient-to-b from-gray-300 to-gray-400 p-3 text-center h-24 flex flex-col justify-between">
                  <div>
                    <p className="text-2xl font-black text-white">🥈</p>
                    <p className="text-xs font-black text-white/90 line-clamp-1">
                      {profiles[1].username}
                    </p>
                  </div>
                  <p className="text-sm font-black text-white">{profiles[1].supporter_points ?? 0}</p>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {profiles[0] && (
              <div className="flex-1 flex flex-col items-center -mx-2 z-10">
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl mb-2 shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, #FFD700, #FFA500)",
                    boxShadow: "0 0 30px rgba(255, 215, 0, 0.6)",
                  }}
                >
                  {getCountryFlag(profiles[0].country)}
                </div>
                <div
                  className="w-full rounded-t-3xl p-3 text-center h-32 flex flex-col justify-between"
                  style={{
                    background: "linear-gradient(to bottom, #FFD700, #FFA500)",
                    boxShadow: "0 0 20px rgba(255, 215, 0, 0.4)",
                  }}
                >
                  <div>
                    <p className="text-3xl font-black text-white">👑</p>
                    <p className="text-xs font-black text-white/95 line-clamp-1">
                      {profiles[0].username}
                    </p>
                  </div>
                  <p className="text-lg font-black text-white">{profiles[0].supporter_points ?? 0}</p>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {profiles[2] && (
              <div className="flex-1 flex flex-col items-center">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-yellow-700 to-orange-700 flex items-center justify-center text-2xl mb-2 shadow-md">
                  {getCountryFlag(profiles[2].country)}
                </div>
                <div className="w-full rounded-t-3xl bg-gradient-to-b from-yellow-700 to-orange-700 p-3 text-center h-20 flex flex-col justify-between">
                  <div>
                    <p className="text-2xl font-black text-white">🥉</p>
                    <p className="text-xs font-black text-white/90 line-clamp-1">
                      {profiles[2].username}
                    </p>
                  </div>
                  <p className="text-sm font-black text-white">{profiles[2].supporter_points ?? 0}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rest of the Rankings */}
      <div className="px-4 space-y-2">
        {profiles.map((profile, index) => {
          if (index < 3) return null; // Skip top 3, already shown in podium

          const titleData = getTitleByRank(Math.min(index + 1, SUPPORTER_TITLES.length));
          const countryFlag = getCountryFlag(profile.country);

          return (
            <div
              key={profile.id}
              className="flex items-center gap-3 rounded-2xl p-3"
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              {/* Rank & Title */}
              <div className="flex-shrink-0 w-12 text-center">
                <p className="text-sm font-black text-text-primary">{index + 1}</p>
                <p className="text-xl">{titleData.emoji}</p>
              </div>

              {/* Flag & Username */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xl">{countryFlag}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-text-primary truncate">
                    {profile.username}
                  </p>
                  <p className="text-xs text-text-muted">{titleData.title}</p>
                </div>
              </div>

              {/* Points & Trend */}
              <div className="flex-shrink-0 text-right">
                <p className="text-sm font-black text-text-primary">{profile.supporter_points ?? 0}</p>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <TrendingUp size={12} className="text-green-500" />
                  <span className="text-xs font-semibold text-green-500">+{Math.floor(Math.random() * 100) + 10}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {profiles.length === 0 && !loading && (
        <div className="px-4 space-y-3">
          {/* Status card */}
          <div
            className="rounded-2xl p-5 text-center"
            style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <p className="text-3xl mb-2">🏆</p>
            <p className="text-sm font-black text-text-primary">Season hasn't started yet</p>
            <p className="text-xs font-semibold mt-1 text-text-muted">
              Be the first to earn points and claim your spot
            </p>
          </div>
          {/* Placeholder rows */}
          {SUPPORTER_TITLES.slice(0, 7).map((title, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-2xl p-3"
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(0,0,0,0.04)",
                opacity: 1 - i * 0.1,
              }}
            >
              <div className="flex-shrink-0 w-12 text-center">
                <p className="text-sm font-black" style={{ color: "#E5E7EB" }}>{i + 1}</p>
                <p className="text-xl">{title.emoji}</p>
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xl">⚽</span>
                <div className="min-w-0 space-y-1.5">
                  <div className="h-3 w-20 rounded-full" style={{ background: "#F3F4F6" }} />
                  <div className="h-2 w-28 rounded-full" style={{ background: "#F9FAFB" }} />
                </div>
              </div>
              <div className="flex-shrink-0">
                <p className="text-sm font-black" style={{ color: "#E5E7EB" }}>—</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
