"use client";

import { useEffect, useState } from "react";

interface Stats {
  home_win: number;
  draw: number;
  away_win: number;
  total: number;
}

interface Props {
  matchId?: string;
  homeTeam: string;
  awayTeam: string;
  matchDate?: string;
  compact?: boolean;
}

export default function PredictionStats({
  matchId,
  homeTeam,
  awayTeam,
  matchDate,
  compact = false,
}: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvedMatchId, setResolvedMatchId] = useState<string | null>(
    matchId || null
  );

  useEffect(() => {
    const resolveMatchId = async () => {
      // If matchId is provided, use it directly
      if (matchId) {
        setResolvedMatchId(matchId);
        return;
      }

      // Otherwise, try to fetch it using home_team, away_team, and match_date
      if (!matchDate) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/predictions/match-id?home_team=${encodeURIComponent(
            homeTeam
          )}&away_team=${encodeURIComponent(awayTeam)}&match_date=${matchDate}`
        );
        if (!response.ok) throw new Error("Failed to fetch match_id");
        const data = await response.json();
        setResolvedMatchId(data.id);
      } catch (err) {
        console.error("Error resolving match_id:", err);
        setLoading(false);
      }
    };

    resolveMatchId();
  }, [matchId, homeTeam, awayTeam, matchDate]);

  useEffect(() => {
    if (!resolvedMatchId) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await fetch(
          `/api/predictions/stats?match_id=${resolvedMatchId}`
        );
        if (!response.ok) {
          // Silently fail if no stats found - this is normal for new matches
          setStats(null);
          setLoading(false);
          return;
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        // Silently fail on network errors - don't break the UI
        console.debug("Debug: Could not fetch prediction stats (this is normal):", err);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [resolvedMatchId]);

  if (loading || !stats) {
    return null;
  }

  if (stats.total === 0) {
    return (
      <div className="text-xs text-gray-400 text-center">
        No predictions yet
      </div>
    );
  }

  if (compact) {
    return (
      <div className="text-xs font-bold text-gray-600 text-center">
        <span style={{ color: "#D52B1E" }}>{stats.home_win}%</span>
        {" | "}
        <span style={{ color: "#3B82F6" }}>{stats.draw}%</span>
        {" | "}
        <span style={{ color: "#10B981" }}>{stats.away_win}%</span>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-1">
      {/* Home win */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 flex-1">
          <span className="font-bold text-gray-700">{homeTeam}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-12 bg-gray-200 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all"
              style={{
                width: `${stats.home_win}%`,
                background: "#D52B1E",
              }}
            />
          </div>
          <span className="font-bold text-gray-700 w-8 text-right">
            {stats.home_win}%
          </span>
        </div>
      </div>

      {/* Draw */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 flex-1">
          <span className="font-bold text-gray-700">Draw</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-12 bg-gray-200 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all"
              style={{
                width: `${stats.draw}%`,
                background: "#3B82F6",
              }}
            />
          </div>
          <span className="font-bold text-gray-700 w-8 text-right">
            {stats.draw}%
          </span>
        </div>
      </div>

      {/* Away win */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 flex-1">
          <span className="font-bold text-gray-700">{awayTeam}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-12 bg-gray-200 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all"
              style={{
                width: `${stats.away_win}%`,
                background: "#10B981",
              }}
            />
          </div>
          <span className="font-bold text-gray-700 w-8 text-right">
            {stats.away_win}%
          </span>
        </div>
      </div>

      {/* Total votes */}
      <div className="text-[10px] text-gray-400 text-center mt-1 pt-1 border-t border-gray-100">
        {stats.total} prediction{stats.total !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
