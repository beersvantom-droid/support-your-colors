import { MapPin } from "lucide-react";
import type { WCFixture } from "@/lib/wc2026-data";
import { TEAMS } from "@/lib/wc2026-data";
import type { SupporterMap } from "./GroupCard";

interface MatchCardProps {
  fixture: WCFixture;
  supporters: SupporterMap;
}

export default function MatchCard({ fixture, supporters }: MatchCardProps) {
  const homeTeam = TEAMS[fixture.home];
  const awayTeam = TEAMS[fixture.away];
  const homeSupporter = supporters[fixture.home];
  const awaySupporter = supporters[fixture.away];

  const isDerby = !!(homeSupporter && awaySupporter);
  const isSolo = !isDerby && !!(homeSupporter || awaySupporter);
  const supporterIsHome = isSolo && !!homeSupporter;
  const soloColor = isSolo
    ? (supporterIsHome ? homeTeam?.color : awayTeam?.color) ?? "#D52B1E"
    : null;
  const soloSupporter = isSolo ? (homeSupporter ?? awaySupporter) : null;
  const soloFlag = isSolo
    ? (supporterIsHome ? homeTeam?.flag : awayTeam?.flag)
    : null;

  const statusLabel =
    fixture.status === "live"
      ? "LIVE"
      : fixture.status === "finished"
      ? "FT"
      : null;

  return (
    <div
      className="relative rounded-2xl overflow-hidden transition-all"
      style={
        isDerby
          ? {
              background: "linear-gradient(135deg, #fffbea 0%, #fff8d6 100%)",
              border: "2px solid #F59E0B",
              boxShadow:
                "0 4px 20px rgba(245, 158, 11, 0.25), 0 1px 4px rgba(0,0,0,0.06)",
            }
          : isSolo
          ? {
              background: `linear-gradient(135deg, #ffffff 0%, ${soloColor}0A 100%)`,
              border: `2px solid ${soloColor}55`,
              boxShadow: `0 4px 16px ${soloColor}25, 0 1px 4px rgba(0,0,0,0.05)`,
            }
          : {
              background: "#FFFFFF",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }
      }
    >
      {/* Derby badge */}
      {isDerby && (
        <div className="absolute top-0 left-0 right-0 flex justify-center">
          <div
            className="px-3 py-0.5 rounded-b-xl text-[10px] font-black tracking-widest uppercase"
            style={{
              background: "linear-gradient(90deg, #F59E0B, #EAB308)",
              color: "#78350F",
            }}
          >
            ⚡ Derby
          </div>
        </div>
      )}

      {/* Solo badge */}
      {isSolo && soloColor && soloSupporter && (
        <div className="absolute top-0 left-0 right-0 flex justify-center">
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

      <div className={`flex items-stretch gap-0 ${isDerby || isSolo ? "pt-5" : ""}`}>
        {/* Home team */}
        <div
          className="flex-1 flex flex-col items-center gap-1.5 px-3 py-3"
          style={
            isSolo && supporterIsHome && soloColor
              ? { background: `${soloColor}07` }
              : undefined
          }
        >
          <span className="text-3xl leading-none">{homeTeam?.flag ?? "🏳️"}</span>
          <span className="text-xs font-black text-text-primary text-center leading-tight">
            {fixture.home}
          </span>
          {homeSupporter && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: `${homeTeam?.color ?? "#1A3A6E"}18`,
                color: homeTeam?.color ?? "#1A3A6E",
              }}
            >
              {homeSupporter.isCurrentUser ? "🍁 " : ""}{homeSupporter.name}
            </span>
          )}
        </div>

        {/* Score / VS */}
        <div className="flex flex-col items-center justify-center px-3 py-3 gap-1 min-w-[64px]">
          {fixture.status === "finished" || fixture.status === "live" ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black" style={{ color: "#111827" }}>
                  {fixture.homeScore ?? 0}
                </span>
                <span className="text-sm font-bold text-text-muted">–</span>
                <span className="text-2xl font-black" style={{ color: "#111827" }}>
                  {fixture.awayScore ?? 0}
                </span>
              </div>
              {statusLabel && (
                <span
                  className="text-[10px] font-black px-2 py-0.5 rounded-full"
                  style={{
                    background: fixture.status === "live" ? "#D52B1E" : "#6B7280",
                    color: "#FFFFFF",
                  }}
                >
                  {statusLabel}
                </span>
              )}
            </>
          ) : (
            <>
              <span className="text-xs font-black text-text-muted">VS</span>
              <span
                className="text-[10px] font-bold text-center"
                style={{ color: "#9CA3AF" }}
              >
                {fixture.date}
              </span>
            </>
          )}
        </div>

        {/* Away team */}
        <div
          className="flex-1 flex flex-col items-center gap-1.5 px-3 py-3"
          style={
            isSolo && !supporterIsHome && soloColor
              ? { background: `${soloColor}07` }
              : undefined
          }
        >
          <span className="text-3xl leading-none">{awayTeam?.flag ?? "🏳️"}</span>
          <span className="text-xs font-black text-text-primary text-center leading-tight">
            {fixture.away}
          </span>
          {awaySupporter && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: `${awayTeam?.color ?? "#1A3A6E"}18`,
                color: awayTeam?.color ?? "#1A3A6E",
              }}
            >
              {awaySupporter.isCurrentUser ? "🍁 " : ""}{awaySupporter.name}
            </span>
          )}
        </div>
      </div>

      {/* Match meta footer */}
      <div
        className="flex items-center justify-between px-4 py-2 mx-3 mb-2.5 rounded-xl"
        style={{
          background: isDerby
            ? "rgba(245,158,11,0.1)"
            : isSolo && soloColor
            ? `${soloColor}0A`
            : "#F0F2F5",
        }}
      >
        <div className="flex items-center gap-1.5">
          <MapPin size={10} className="text-text-muted flex-shrink-0" />
          <span className="text-[10px] text-text-muted font-medium truncate max-w-[120px]">
            {fixture.venue}, {fixture.city}
          </span>
        </div>
        <span
          className="text-[10px] font-bold flex-shrink-0"
          style={{
            color: isDerby
              ? "#B45309"
              : isSolo && soloColor
              ? soloColor
              : "#6B7280",
          }}
        >
          {fixture.time}
        </span>
      </div>
    </div>
  );
}
