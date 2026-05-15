import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { WCGroup } from "@/lib/wc2026-data";
import { TEAMS } from "@/lib/wc2026-data";

export type SupporterMap = Record<string, { name: string; isCurrentUser?: boolean }>;

const GROUP_COLORS: Record<string, string> = {
  A: "#006847",
  B: "#D52B1E",
  C: "#009C3B",
  D: "#002868",
  E: "#DD0000",
  F: "#FF6600",
  G: "#EF3340",
  H: "#AA151B",
  I: "#002395",
  J: "#74ACDF",
  K: "#006600",
  L: "#CF091C",
};

export default function GroupCard({
  group,
  supporters,
}: {
  group: WCGroup;
  supporters: SupporterMap;
}) {
  const accentColor = GROUP_COLORS[group.id] ?? "#1A3A6E";
  const hasFriends = group.teams.some((t) => supporters[t]);
  const derbyCount = group.fixtures.filter(
    (f) => supporters[f.home] && supporters[f.away]
  ).length;

  return (
    <Link href={`/bracket/group/${group.id.toLowerCase()}`} className="block">
      <div
        className="rounded-2xl overflow-hidden active:scale-[0.98] transition-transform duration-100"
        style={{
          border: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        {/* Gradient header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{
            background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 100%)`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.2)", color: "#FFFFFF" }}
            >
              {group.id}
            </div>
            <div>
              <p className="text-white font-black text-sm tracking-wide">
                GROUP {group.id}
              </p>
              {hasFriends && (
                <span
                  className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded mt-0.5 inline-block"
                  style={{
                    background: "rgba(255,255,255,0.25)",
                    color: "rgba(255,255,255,0.95)",
                  }}
                >
                  Friends here
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-0.5">
              {group.teams.map((t) => (
                <span key={t} className="text-xl leading-none">
                  {TEAMS[t]?.flag ?? "🏳️"}
                </span>
              ))}
            </div>
            <ChevronRight
              size={16}
              style={{ color: "rgba(255,255,255,0.6)" }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="bg-white px-4 py-3">
          <div className="flex flex-wrap gap-1.5">
            {hasFriends ? (
              <>
                {group.teams.map((t) => {
                  const supporter = supporters[t];
                  const team = TEAMS[t];
                  if (!supporter) return null;
                  return (
                    <div
                      key={t}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                      style={{
                        background: supporter.isCurrentUser
                          ? "#D52B1E0D"
                          : "#1A3A6E0A",
                        border: supporter.isCurrentUser
                          ? "1px solid #D52B1E20"
                          : "1px solid #1A3A6E18",
                      }}
                    >
                      <span className="text-sm">{team?.flag ?? "🏳️"}</span>
                      <span
                        className="text-[11px] font-bold"
                        style={{
                          color: supporter.isCurrentUser ? "#D52B1E" : "#374151",
                        }}
                      >
                        {supporter.isCurrentUser ? "🍁 " : ""}
                        {supporter.name}
                      </span>
                    </div>
                  );
                })}
                {derbyCount > 0 && (
                  <div
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
                    style={{
                      background: "rgba(245,158,11,0.1)",
                      border: "1px solid rgba(245,158,11,0.25)",
                    }}
                  >
                    <span
                      className="text-[11px] font-black"
                      style={{ color: "#92400E" }}
                    >
                      ⚡ {derbyCount}{" "}
                      {derbyCount === 1 ? "derby" : "derbies"}
                    </span>
                  </div>
                )}
              </>
            ) : (
              group.teams.map((t) => {
                const team = TEAMS[t];
                return (
                  <div
                    key={t}
                    className="flex items-center justify-center w-8 h-8 rounded-lg"
                    style={{ background: "#F3F4F6" }}
                  >
                    <span className="text-lg leading-none">{team?.flag ?? "🏳️"}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
