"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCountryFlag } from "@/lib/countries";
import { getTitleByRank, SUPPORTER_TITLES } from "@/lib/leaderboard-titles";
import { nameColorProps, borderContainerProps, badgeInfo, cardBgLayerProps, isCardBgDark } from "@/lib/cosmetics";
import MascotSprite from "@/components/mascot/MascotSprite";
import type { Profile } from "@/lib/supabase";

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
      {/* Rankings list */}
      <div className="px-4 space-y-2">
        {profiles.map((profile, index) => {

          const titleData   = getTitleByRank(Math.min(index + 1, SUPPORTER_TITLES.length));
          const countryFlag = getCountryFlag(profile.country);
          const ncProps     = nameColorProps(profile.equipped_name_color);
          const bdrProps    = borderContainerProps(profile.equipped_border);
          const badge       = badgeInfo(profile.equipped_badge);
          const bgLayer     = cardBgLayerProps(profile.equipped_card_bg);
          const bgIsDark    = isCardBgDark(profile.equipped_card_bg);
          const textColor   = bgIsDark ? "#FFFFFF" : "#111827"; // white if dark bg, black if light
          const mascots     = (profile.equipped_mascots ?? []).slice(0, 3);

          return (
            <div
              key={profile.id}
              className={`flex items-center gap-2 rounded-2xl p-3 relative overflow-hidden ${bdrProps.className}`}
              style={{ background: "#FFFFFF", ...bdrProps.style }}
            >
              {/* Card background layer (patterns / animations) */}
              {bgLayer && (
                <div
                  className={`absolute inset-0 pointer-events-none ${bgLayer.className ?? ""}`}
                  style={bgLayer.style}
                />
              )}

              {/* Rank & title emoji */}
              <div className="flex-shrink-0 w-12 text-center relative">
                <p className="text-sm font-black" style={{ color: textColor }}>{index + 1}</p>
                <p className="text-xl">{titleData.emoji}</p>
              </div>

              {/* Flag, badge & username */}
              <div className="flex items-center gap-2 min-w-0 relative">
                <span className="text-xl">{countryFlag}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate flex items-center gap-1">
                    {badge && (
                      <span className={`text-sm leading-none ${badge.className}`}>
                        {badge.emoji}
                      </span>
                    )}
                    <span className={ncProps.className ?? ""} style={ncProps.style}>
                      {profile.username}
                    </span>
                  </p>
                  <p className="text-xs text-text-muted">{titleData.title}</p>
                </div>
              </div>

              {/* Mascots — side by side between name and points */}
              {mascots.length > 0 && (
                <div className="flex items-end gap-0.5 flex-shrink-0" style={{ minWidth: mascots.length * 32 }}>
                  {mascots.map((id, i) => (
                    <MascotSprite
                      key={id}
                      id={id}
                      size={32}
                      animationDelay={i * 1200}
                    />
                  ))}
                </div>
              )}

              {/* Points */}
              <div className="flex-shrink-0 text-right relative">
                <p className="text-sm font-black" style={{ color: textColor }}>{profile.supporter_points ?? 0}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {profiles.length === 0 && !loading && (
        <div className="px-4 space-y-3">
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
