"use client";

import { TEAMS } from "@/lib/wc2026-data";
import type { SupporterMap } from "./GroupCard";

export interface KnockoutMatch {
  round: string;
  match_number: number;
  home_team: string | null;
  away_team: string | null;
  home_source: string | null;
  away_source: string | null;
  home_score: number | null;
  away_score: number | null;
  winner: string | null;
  status: string;
}

interface Props {
  match: KnockoutMatch;
  supporters: SupporterMap;
}

interface TeamSlotProps {
  team: string | null;
  source: string | null;
  supporter: { name: string; isCurrentUser?: boolean } | null;
  align?: "left" | "right";
}

function TeamSlot({ team, source, supporter }: TeamSlotProps) {
  const info = team ? TEAMS[team] : null;

  if (!team) {
    return (
      <div className="flex-1 flex flex-col items-center gap-1 px-3 py-3">
        <span className="text-2xl leading-none opacity-30">🏳️</span>
        <span className="text-[11px] font-black text-text-muted text-center leading-tight">
          {source ?? "TBD"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center gap-1 px-3 py-3">
      <span className="text-3xl leading-none">{info?.flag ?? "🏳️"}</span>
      <span className="text-xs font-black text-text-primary text-center leading-tight">
        {team}
      </span>
      {supporter && (
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{
            background: `${info?.color ?? "#1A3A6E"}18`,
            color: info?.color ?? "#1A3A6E",
          }}
        >
          {supporter.isCurrentUser ? "🍁 " : ""}{supporter.name}
        </span>
      )}
    </div>
  );
}

export default function KnockoutMatchCard({ match, supporters }: Props) {
  const homeInfo = match.home_team ? TEAMS[match.home_team] : null;
  const awayInfo = match.away_team ? TEAMS[match.away_team] : null;
  const homeSupporter = match.home_team ? (supporters[match.home_team] ?? null) : null;
  const awaySupporter = match.away_team ? (supporters[match.away_team] ?? null) : null;

  const isDerby = !!(homeSupporter && awaySupporter);
  const isSolo = !isDerby && !!(homeSupporter || awaySupporter);
  const soloColor = isSolo
    ? (homeSupporter ? homeInfo?.color : awayInfo?.color) ?? "#D52B1E"
    : null;
  const soloSupporter = isSolo ? (homeSupporter ?? awaySupporter) : null;
  const soloFlag = isSolo ? (homeSupporter ? homeInfo?.flag : awayInfo?.flag) : null;

  const isFinished = match.status === "finished";
  const isLive = match.status === "live";

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={
        isDerby
          ? {
              background: "linear-gradient(135deg, #fffbea 0%, #fff8d6 100%)",
              border: "2px solid #F59E0B",
              boxShadow: "0 4px 20px rgba(245,158,11,0.20)",
            }
          : isSolo && soloColor
          ? {
              background: `linear-gradient(135deg, #ffffff 0%, ${soloColor}0A 100%)`,
              border: `2px solid ${soloColor}55`,
              boxShadow: `0 4px 16px ${soloColor}20`,
            }
          : {
              background: "#FFFFFF",
              border: "1px solid rgba(0,0,0,0.07)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }
      }
    >
      {/* Derby/solo badge */}
      {isDerby && (
        <div className="flex justify-center">
          <div
            className="px-3 py-0.5 rounded-b-xl text-[10px] font-black tracking-widest uppercase"
            style={{ background: "linear-gradient(90deg,#F59E0B,#EAB308)", color: "#78350F" }}
          >
            ⚡ Derby
          </div>
        </div>
      )}
      {isSolo && soloColor && soloSupporter && (
        <div className="flex justify-center">
          <div
            className="px-3 py-0.5 rounded-b-xl text-[10px] font-black tracking-wide"
            style={{
              background: `${soloColor}20`,
              color: soloColor,
              border: `1px solid ${soloColor}40`,
              borderTop: "none",
            }}
          >
            {soloFlag} {soloSupporter.name}
          </div>
        </div>
      )}

      <div className={`flex items-stretch ${isDerby || isSolo ? "pt-5" : ""}`}>
        <TeamSlot
          team={match.home_team}
          source={match.home_source}
          supporter={homeSupporter}
        />

        {/* Score / VS */}
        <div className="flex flex-col items-center justify-center px-2 py-3 gap-1 min-w-[60px]">
          {isFinished || isLive ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-text-primary">{match.home_score ?? 0}</span>
                <span className="text-sm font-bold text-text-muted">–</span>
                <span className="text-xl font-black text-text-primary">{match.away_score ?? 0}</span>
              </div>
              <span
                className="text-[10px] font-black px-2 py-0.5 rounded-full"
                style={{ background: isLive ? "#D52B1E" : "#6B7280", color: "#fff" }}
              >
                {isLive ? "LIVE" : "FT"}
              </span>
            </>
          ) : (
            <span className="text-xs font-black text-text-muted">VS</span>
          )}
          <span className="text-[9px] font-bold text-text-muted">M{match.match_number}</span>
        </div>

        <TeamSlot
          team={match.away_team}
          source={match.away_source}
          supporter={awaySupporter}
        />
      </div>
    </div>
  );
}
