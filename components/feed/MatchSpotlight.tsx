"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { GROUPS, TEAMS, SUPPORTERS } from "@/lib/wc2026-data";
import type { WCFixture } from "@/lib/wc2026-data";

const MONTH_INDEX: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

function parseFixtureDate(date: string, time: string): Date {
  const [monthStr, dayStr] = date.split(" ");
  const month = MONTH_INDEX[monthStr] ?? 5;
  const day = parseInt(dayStr, 10);
  const timeMatch = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  let hours = 0, minutes = 0;
  if (timeMatch) {
    hours = parseInt(timeMatch[1], 10);
    minutes = parseInt(timeMatch[2], 10);
    if (timeMatch[3].toUpperCase() === "PM" && hours !== 12) hours += 12;
    if (timeMatch[3].toUpperCase() === "AM" && hours === 12) hours = 0;
    hours += 4; // EDT → UTC
  }
  return new Date(Date.UTC(2026, month, day, hours, minutes));
}

function formatCountdown(target: Date, now: Date): string {
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return "Starting now";
  const totalMins = Math.floor(diff / 60000);
  if (totalMins < 60) return `${totalMins}m`;
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

interface EnrichedFixture {
  fixture: WCFixture;
  groupId: string;
  parsedDate: Date;
}

const ROTATION_MS = 5000;
const FADE_MS = 300;

export default function MatchSpotlight() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [now, setNow] = useState(() => new Date());
  const [progressKey, setProgressKey] = useState(0);

  // Only show matches where at least one supporter is involved
  const upcoming: EnrichedFixture[] = useMemo(
    () =>
      GROUPS.flatMap((g) =>
        g.fixtures
          .filter(
            (f) =>
              (f.status === "upcoming" || f.status === "live") &&
              (SUPPORTERS[f.home] || SUPPORTERS[f.away])
          )
          .map((f) => ({
            fixture: f,
            groupId: g.id,
            parsedDate: parseFixtureDate(f.date, f.time),
          }))
      ).sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime()),
    []
  );

  const advance = useCallback(() => {
    if (upcoming.length <= 1) return;
    setVisible(false);
    setTimeout(() => {
      setActiveIndex((i) => (i + 1) % upcoming.length);
      setProgressKey((k) => k + 1);
      setVisible(true);
    }, FADE_MS);
  }, [upcoming.length]);

  useEffect(() => {
    const timer = setInterval(advance, ROTATION_MS);
    return () => clearInterval(timer);
  }, [advance]);

  useEffect(() => {
    const clock = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(clock);
  }, []);

  if (upcoming.length === 0) return null;

  const { fixture, groupId, parsedDate } = upcoming[activeIndex];
  const homeTeam = TEAMS[fixture.home];
  const awayTeam = TEAMS[fixture.away];
  const homeSupporter = SUPPORTERS[fixture.home];
  const awaySupporter = SUPPORTERS[fixture.away];

  const isDerby = !!(homeSupporter && awaySupporter);
  const isSolo = !isDerby && !!(homeSupporter || awaySupporter);
  const soloColor = isSolo
    ? (homeSupporter ? homeTeam?.color : awayTeam?.color) ?? "#D52B1E"
    : null;

  const accentColor = isDerby ? "#F59E0B" : soloColor ?? "#D52B1E";
  const countdown = formatCountdown(parsedDate, now);

  return (
    <div
      className="border-b border-border"
      style={{ background: "#FFFFFF" }}
    >
      {/* Header strip */}
      <div className="flex items-center justify-between px-4 pt-2.5 pb-1.5">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{
              background: "#D52B1E",
              boxShadow: "0 0 0 2px #D52B1E33",
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
          <span
            className="text-[9px] font-black uppercase tracking-widest"
            style={{ color: "#9CA3AF" }}
          >
            {isDerby ? "⚡ Derby" : "Supporter Match"}
          </span>
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
            style={{ background: "#F3F4F6", color: "#9CA3AF" }}
          >
            Group {groupId}
          </span>
        </div>
        {upcoming.length > 1 && (
          <span
            className="text-[9px] font-bold tabular-nums"
            style={{ color: "#C4C9D4" }}
          >
            {activeIndex + 1}/{upcoming.length}
          </span>
        )}
      </div>

      {/* Match row — compact horizontal */}
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateX(0)" : "translateX(8px)",
          transition: `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`,
        }}
      >
        <div
          className="mx-3 mb-2 rounded-xl overflow-hidden relative"
          style={
            isDerby
              ? {
                  background: "linear-gradient(135deg, #fffbea 0%, #fff8d6 100%)",
                  border: "1.5px solid #F59E0B",
                  boxShadow: "0 2px 12px rgba(245,158,11,0.2)",
                }
              : isSolo && soloColor
              ? {
                  background: `linear-gradient(135deg, #ffffff 0%, ${soloColor}0A 100%)`,
                  border: `1.5px solid ${soloColor}45`,
                  boxShadow: `0 2px 10px ${soloColor}20`,
                }
              : {
                  background: "#F9FAFB",
                  border: "1px solid rgba(0,0,0,0.06)",
                }
          }
        >
          <div className="flex items-center px-3 py-2.5 gap-2">
            {/* Home team */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <span className="text-[28px] leading-none flex-shrink-0">
                {homeTeam?.flag ?? "🏳️"}
              </span>
              <div className="min-w-0">
                <p
                  className="text-[11px] font-black leading-tight truncate"
                  style={{ color: "#111827" }}
                >
                  {fixture.home}
                </p>
                {homeSupporter ? (
                  <p
                    className="text-[10px] font-bold leading-tight truncate"
                    style={{ color: homeTeam?.color ?? accentColor }}
                  >
                    👤 {homeSupporter.name}
                  </p>
                ) : (
                  <p className="text-[10px]" style={{ color: "#D1D5DB" }}>—</p>
                )}
              </div>
            </div>

            {/* VS */}
            <div className="flex flex-col items-center flex-shrink-0 px-1 gap-0.5">
              <span
                className="text-[10px] font-black"
                style={{ color: isDerby ? "#B45309" : soloColor ?? "#C4C9D4" }}
              >
                VS
              </span>
              <span
                className="text-[9px] font-black"
                style={{
                  color: isDerby ? "#B45309" : soloColor ?? "#9CA3AF",
                }}
              >
                {countdown}
              </span>
              <span className="text-[8px] font-medium" style={{ color: "#C4C9D4" }}>
                {fixture.date}
              </span>
            </div>

            {/* Away team */}
            <div className="flex-1 flex items-center gap-2 justify-end min-w-0">
              <div className="min-w-0 text-right">
                <p
                  className="text-[11px] font-black leading-tight truncate"
                  style={{ color: "#111827" }}
                >
                  {fixture.away}
                </p>
                {awaySupporter ? (
                  <p
                    className="text-[10px] font-bold leading-tight truncate"
                    style={{ color: awayTeam?.color ?? accentColor }}
                  >
                    {awaySupporter.name} 👤
                  </p>
                ) : (
                  <p className="text-[10px] text-right" style={{ color: "#D1D5DB" }}>—</p>
                )}
              </div>
              <span className="text-[28px] leading-none flex-shrink-0">
                {awayTeam?.flag ?? "🏳️"}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[2px]"
            style={{ background: "rgba(0,0,0,0.04)" }}
          >
            <div
              key={progressKey}
              style={{
                height: "100%",
                background: accentColor,
                opacity: 0.6,
                animation: `spotlight-progress ${ROTATION_MS}ms linear forwards`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
