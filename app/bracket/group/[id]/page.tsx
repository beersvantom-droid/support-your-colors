import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { GROUPS, TEAMS, type WCGroup } from "@/lib/wc2026-data";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/supabase";
import MatchCard from "@/components/bracket/MatchCard";
import type { SupporterMap } from "@/components/bracket/GroupCard";

export const dynamic = "force-dynamic";

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

interface StandingRow {
  team: string;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  gd?: number;
}

interface MatchResult {
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
}

async function getGroupStandings(groupId: string): Promise<StandingRow[]> {
  const { data } = await supabase
    .from("group_standings")
    .select("team, won, drawn, lost, points, gd")
    .eq("group_id", groupId)
    .order("rank", { ascending: true });

  return data ?? [];
}

async function getMatchResults(teams: string[]): Promise<MatchResult[]> {
  const { data } = await supabase
    .from("match_results")
    .select("home_team, away_team, home_score, away_score, status")
    .in("home_team", teams)
    .in("away_team", teams);

  return data ?? [];
}

function buildDefaultStandings(teams: string[]): StandingRow[] {
  return teams.map((team) => ({ team, won: 0, drawn: 0, lost: 0, points: 0 }));
}

function groupByMatchday(fixtures: WCGroup["fixtures"]) {
  const days: Record<number, WCGroup["fixtures"]> = {};
  for (const f of fixtures) {
    if (!days[f.matchday]) days[f.matchday] = [];
    days[f.matchday].push(f);
  }
  return days;
}

async function buildSupporterMap(): Promise<SupporterMap> {
  const [profilesResult, sessionResult] = await Promise.all([
    supabase.from("profiles").select("id, username, country"),
    supabase.auth.getSession(),
  ]);

  const profiles = (profilesResult.data ?? []) as Pick<Profile, "id" | "username" | "country">[];
  const currentUserId = sessionResult.data.session?.user?.id ?? null;

  const map: SupporterMap = {};
  for (const p of profiles) {
    if (p.country) {
      map[p.country] = {
        name: p.username,
        isCurrentUser: p.id === currentUserId,
      };
    }
  }
  return map;
}

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const groupId = id.toUpperCase();
  const group = GROUPS.find((g) => g.id === groupId);

  if (!group) notFound();

  const supporters = await buildSupporterMap();

  const accentColor = GROUP_COLORS[groupId] ?? "#1A3A6E";

  // Get live standings from database, fall back to empty if not available
  const liveStandings = await getGroupStandings(groupId);
  const standings = liveStandings.length > 0 ? liveStandings : buildDefaultStandings(group.teams);

  // Get live match results
  const matchResults = await getMatchResults(group.teams);

  // Teams currently playing a live match (for the "live" indicator dot)
  const liveTeams = new Set<string>();
  for (const m of matchResults) {
    if (m.status === "live") {
      liveTeams.add(m.home_team);
      liveTeams.add(m.away_team);
    }
  }

  const matchdays = groupByMatchday(group.fixtures);
  const hasFixtures = group.fixtures.length > 0;
  const hasFriends = group.teams.some((t) => supporters[t]);
  const derbyCount = group.fixtures.filter(
    (f) => supporters[f.home] && supporters[f.away]
  ).length;

  return (
    <div className="slide-in-right min-h-full" style={{ background: "#F0F2F5" }}>
      {/* ── Sticky header ────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-20 flex items-center px-4 py-3 gap-3"
        style={{
          background: accentColor,
          boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
        }}
      >
        <Link
          href="/bracket"
          className="flex items-center gap-0.5 flex-shrink-0"
          style={{ color: "rgba(255,255,255,0.85)" }}
        >
          <ChevronLeft size={18} />
          <span className="text-sm font-bold">Groups</span>
        </Link>

        <div className="flex-1 text-center">
          <span className="text-white font-black text-sm tracking-wide">
            GROUP {groupId}
          </span>
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0">
          {group.teams.map((t) => (
            <span key={t} className="text-base leading-none">
              {TEAMS[t]?.flag ?? "🏳️"}
            </span>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* ── Supporters card (only shown when friends are here) ───── */}
        {hasFriends && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <div
              className="px-4 py-2.5"
              style={{
                background: `${accentColor}12`,
                borderBottom: `1px solid ${accentColor}20`,
              }}
            >
              <span
                className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: accentColor }}
              >
                Supporters in this group
              </span>
            </div>
            <div className="px-4 py-3 flex flex-wrap gap-2">
              {group.teams.map((t) => {
                const supporter = supporters[t];
                const team = TEAMS[t];
                if (!supporter) return null;
                return (
                  <div
                    key={t}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{
                      background: supporter.isCurrentUser
                        ? "#D52B1E0D"
                        : "#1A3A6E0A",
                      border: supporter.isCurrentUser
                        ? "1px solid #D52B1E20"
                        : "1px solid #1A3A6E15",
                    }}
                  >
                    <span className="text-xl">{team?.flag ?? "🏳️"}</span>
                    <div>
                      <p
                        className="text-xs font-black"
                        style={{
                          color: supporter.isCurrentUser ? "#D52B1E" : "#111827",
                        }}
                      >
                        {supporter.isCurrentUser ? "🍁 " : ""}
                        {supporter.name}
                      </p>
                      <p className="text-[10px] font-semibold text-gray-400">
                        {t}
                      </p>
                    </div>
                  </div>
                );
              })}
              {derbyCount > 0 && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl self-center"
                  style={{
                    background: "rgba(245,158,11,0.1)",
                    border: "1px solid rgba(245,158,11,0.3)",
                  }}
                >
                  <span className="text-xl">⚡</span>
                  <div>
                    <p className="text-xs font-black" style={{ color: "#92400E" }}>
                      {derbyCount} {derbyCount === 1 ? "Derby" : "Derbies"}
                    </p>
                    <p
                      className="text-[10px] font-semibold"
                      style={{ color: "#B45309" }}
                    >
                      in this group
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Standings ────────────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div
            className="px-4 py-2.5"
            style={{
              background: `${accentColor}12`,
              borderBottom: `1px solid ${accentColor}20`,
            }}
          >
            <span
              className="text-[10px] font-black uppercase tracking-widest"
              style={{ color: accentColor }}
            >
              Standings
            </span>
          </div>
          <div className="px-4 py-2">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-[9px] font-black text-gray-400 uppercase pb-2 w-full">
                    Team
                  </th>
                  <th className="text-center text-[9px] font-black text-gray-400 uppercase pb-2 w-7">
                    W
                  </th>
                  <th className="text-center text-[9px] font-black text-gray-400 uppercase pb-2 w-7">
                    D
                  </th>
                  <th className="text-center text-[9px] font-black text-gray-400 uppercase pb-2 w-7">
                    L
                  </th>
                  <th className="text-center text-[9px] font-black text-gray-400 uppercase pb-2 w-8">
                    Pts
                  </th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row, i) => {
                  const team = TEAMS[row.team];
                  const supporter = supporters[row.team];
                  const isLast = i === standings.length - 1;

                  return (
                    <tr
                      key={row.team}
                      className={!isLast ? "border-b border-gray-50" : ""}
                      style={
                        supporter
                          ? {
                              background: supporter.isCurrentUser
                                ? "#D52B1E06"
                                : "#1A3A6E04",
                            }
                          : undefined
                      }
                    >
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="relative text-base leading-none">
                            {team?.flag ?? "🏳️"}
                            {liveTeams.has(row.team) && (
                              <span
                                className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full animate-pulse"
                                style={{
                                  background: "#D52B1E",
                                  boxShadow: "0 0 0 2px #FFFFFF",
                                }}
                              />
                            )}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-gray-800">
                              {row.team}
                            </p>
                            {supporter && (
                              <p
                                className="text-[10px] font-semibold"
                                style={{
                                  color: supporter.isCurrentUser
                                    ? "#D52B1E"
                                    : "#6B7280",
                                }}
                              >
                                {supporter.isCurrentUser ? "🍁 " : ""}
                                {supporter.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-center text-xs font-bold text-gray-500 py-2.5">
                        {row.won}
                      </td>
                      <td className="text-center text-xs font-bold text-gray-500 py-2.5">
                        {row.drawn}
                      </td>
                      <td className="text-center text-xs font-bold text-gray-500 py-2.5">
                        {row.lost}
                      </td>
                      <td className="text-center py-2.5">
                        <span
                          className="text-xs font-black px-1.5 py-0.5 rounded"
                          style={{
                            background:
                              row.points > 0
                                ? `${accentColor}18`
                                : "transparent",
                            color: row.points > 0 ? accentColor : "#9CA3AF",
                          }}
                        >
                          {row.points}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Fixtures ─────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-gray-700 uppercase tracking-widest">
              Fixtures
            </h2>
            {hasFixtures && (
              <span className="text-[10px] font-bold text-gray-400">
                {group.fixtures.length} matches
              </span>
            )}
          </div>

          {hasFixtures ? (
            <div className="space-y-5">
              {Object.entries(matchdays).map(([day, fixtures]) => (
                <div key={day}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span
                      className="text-[9px] font-black uppercase tracking-widest"
                      style={{ color: accentColor }}
                    >
                      Matchday {day}
                    </span>
                    <div
                      className="flex-1 h-px"
                      style={{ background: `${accentColor}20` }}
                    />
                    <span className="text-[9px] text-gray-400 font-semibold">
                      {fixtures[0].date}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {fixtures.map((f, i) => {
                      // Find live score for this match
                      const liveScore = matchResults.find(
                        (m) =>
                          (m.home_team === f.home && m.away_team === f.away) ||
                          (m.home_team === f.away && m.away_team === f.home)
                      );

                      return (
                        <MatchCard
                          key={i}
                          fixture={f}
                          supporters={supporters}
                          liveScore={liveScore}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="rounded-2xl p-6 text-center"
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3"
                style={{ background: "#F3F4F6" }}
              >
                📅
              </div>
              <p className="text-sm font-black text-gray-700">
                Schedule coming soon
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Fixture details will be added before the tournament
              </p>
            </div>
          )}
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}
