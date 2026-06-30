"use client";

import { useState } from "react";
import Link from "next/link";
import GroupCard from "./GroupCard";
import KnockoutMatchCard from "./KnockoutMatchCard";
import type { SupporterMap } from "./GroupCard";
import type { KnockoutMatch } from "./KnockoutMatchCard";
import type { WCGroup } from "@/lib/wc2026-data";

type Phase = "Groups" | "R32" | "R16" | "QF" | "SF" | "Final";

const PHASES: { label: Phase; available: boolean }[] = [
  { label: "Groups", available: true },
  { label: "R32", available: true },
  { label: "R16", available: false },
  { label: "QF", available: false },
  { label: "SF", available: false },
  { label: "Final", available: false },
];

interface Props {
  groups: WCGroup[];
  supporters: SupporterMap;
  liveTeamsList: string[];
  r32Matches: KnockoutMatch[];
  friendGroupCount: number;
  derbyCount: number;
}

export default function BracketView({
  groups,
  supporters,
  liveTeamsList,
  r32Matches,
  friendGroupCount,
  derbyCount,
}: Props) {
  const [activePhase, setActivePhase] = useState<Phase>("R32");
  const liveTeams = new Set(liveTeamsList);
  const hasLiveMatches = liveTeamsList.length > 0;

  const friendR32Count = r32Matches.filter(
    (m) => (m.home_team && supporters[m.home_team]) || (m.away_team && supporters[m.away_team])
  ).length;

  return (
    <>
      {/* Phase navigation bar */}
      <div
        className="sticky top-0 z-20 flex items-center gap-2 px-4 py-2.5 overflow-x-auto"
        style={{
          background: "rgba(240,242,245,0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        {PHASES.map(({ label, available }) => (
          <button
            key={label}
            onClick={() => available && setActivePhase(label)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-black transition-colors"
            style={{
              background:
                activePhase === label
                  ? "#D52B1E"
                  : available
                  ? "rgba(0,0,0,0.08)"
                  : "rgba(0,0,0,0.04)",
              color:
                activePhase === label
                  ? "#FFFFFF"
                  : available
                  ? "rgba(0,0,0,0.55)"
                  : "rgba(0,0,0,0.20)",
              cursor: available ? "pointer" : "not-allowed",
            }}
          >
            {label}
          </button>
        ))}

        <div className="flex-shrink-0 ml-auto text-[10px] font-bold text-text-muted whitespace-nowrap">
          {activePhase === "Groups" ? "Jun 11 – 27" : activePhase === "R32" ? "Jun 28 – Jul 2" : ""}
        </div>
      </div>

      {/* Predict button */}
      <div className="px-4 py-3">
        <Link
          href="/predictions"
          className="w-full py-3 rounded-2xl font-black text-center text-white transition-all active:scale-95"
          style={{
            background: "#3B82F6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <span>🎯</span>
          <span>Predict Upcoming Matches</span>
        </Link>
      </div>

      {/* Groups view */}
      {activePhase === "Groups" && (
        <div className="px-4 py-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-sm font-black text-text-primary uppercase tracking-widest">
                Group Stage
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Tap a group to see fixtures &amp; standings
              </p>
            </div>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide"
              style={{ background: "#D52B1E18", color: "#D52B1E" }}
            >
              {hasLiveMatches && (
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: "#D52B1E" }}
                />
              )}
              {hasLiveMatches ? "Live" : "Voltooid"}
            </div>
          </div>

          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              supporters={supporters}
              liveTeams={liveTeams}
            />
          ))}
          <div className="h-4" />
        </div>
      )}

      {/* R32 view */}
      {activePhase === "R32" && (
        <div className="px-4 py-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-sm font-black text-text-primary uppercase tracking-widest">
                Round of 32
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                {friendR32Count > 0
                  ? `${friendR32Count} wedstrijd${friendR32Count !== 1 ? "en" : ""} met vrienden`
                  : "16 wedstrijden"}
              </p>
            </div>
            {friendR32Count > 0 && (
              <div
                className="px-2.5 py-1 rounded-lg text-[10px] font-black"
                style={{ background: "#F59E0B18", color: "#B45309" }}
              >
                ⚡ {friendR32Count} friend{friendR32Count !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          {r32Matches.length === 0 ? (
            <div
              className="py-8 rounded-2xl text-center"
              style={{ background: "#F9FAFB", border: "1px dashed rgba(0,0,0,0.10)" }}
            >
              <p className="text-text-muted text-sm font-medium">
                R32 schema wordt geladen…
              </p>
            </div>
          ) : (
            r32Matches.map((match) => (
              <KnockoutMatchCard
                key={match.match_number}
                match={match}
                supporters={supporters}
              />
            ))
          )}

          <div className="h-4" />
        </div>
      )}
    </>
  );
}
