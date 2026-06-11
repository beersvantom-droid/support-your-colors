"use client";

import { useEffect, useState } from "react";
import PredictionModal from "@/components/predictions/PredictionModal";
import PredictionStats from "@/components/predictions/PredictionStats";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { convertETToNL, isDerby } from "@/lib/wc2026-data";

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  match_date: string;      // e.g. "Jun 12"
  match_time?: string;
  status: string;
  venue?: string;
  city?: string;
}

export default function PredictionsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/predictions/upcoming");
      if (!response.ok) throw new Error("Failed to fetch matches");
      const data = await response.json();
      setMatches(data.matches || []);
    } catch (err) {
      console.error("Error fetching matches:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePredictionSubmit = () => {
    // Refresh page or update stats
    fetchMatches();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-3xl mb-3">⚽</div>
          <p className="text-sm font-bold text-gray-600">Loading matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/bracket" className="flex-none">
            <ChevronLeft size={24} className="text-gray-900" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-black text-gray-900">Predictions</h1>
            <p className="text-xs text-gray-500">Next 18 upcoming matches</p>
          </div>
        </div>
      </div>

      {/* Match List */}
      <div className="max-w-md mx-auto px-4 py-4 space-y-3">
        {matches.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-gray-500">No upcoming matches</p>
          </div>
        ) : (
          matches.map((match) => {
            const matchIsDerby = isDerby(match.home_team, match.away_team);
            return (
              <button
                key={match.id}
                onClick={() => setSelectedMatch(match)}
                className="w-full text-left p-4 rounded-2xl transition-all active:scale-95 relative"
                style={
                  matchIsDerby
                    ? {
                        background: "linear-gradient(135deg, #fffbea 0%, #fff8d6 100%)",
                        border: "2px solid #F59E0B",
                        boxShadow: "0 4px 20px rgba(245, 158, 11, 0.25), 0 1px 4px rgba(0,0,0,0.06)",
                      }
                    : {
                        background: "#ffffff",
                        border: "1px solid #E5E7EB",
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                      }
                }
              >
                {/* Derby badge */}
                {matchIsDerby && (
                  <div className="absolute top-0 left-0 right-0 flex justify-center z-10">
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

                <div className={`flex items-center justify-between mb-2 ${matchIsDerby ? "pt-4" : ""}`}>
                  <span className="text-xs font-bold text-gray-500 uppercase">{match.match_date}</span>
                  <span className="text-xs font-bold text-blue-600">🎯 Predict</span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-gray-900">{match.home_team}</span>
                  <span className="text-xs text-gray-400">vs</span>
                  <span className="text-sm font-bold text-gray-900">{match.away_team}</span>
                </div>
                {match.match_time && (
                  <div className="text-xs text-gray-500 mb-2">
                    <span style={{ color: "#FF6600", fontWeight: "bold" }}>
                      {convertETToNL(match.match_time)}
                    </span>
                    {match.city && <span> · {match.city}</span>}
                  </div>
                )}
                {/* Prediction Stats */}
                <PredictionStats
                  matchId={match.id}
                  homeTeam={match.home_team}
                  awayTeam={match.away_team}
                  matchDate={match.match_date}
                  compact={true}
                />
              </button>
            );
          })
        )}
      </div>

      {/* Modal */}
      {selectedMatch && (
        <PredictionModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onSubmit={handlePredictionSubmit}
        />
      )}
    </div>
  );
}
