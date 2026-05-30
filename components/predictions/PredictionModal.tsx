"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { convertETToNL } from "@/lib/wc2026-data";

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  match_date: string;      // e.g. "Jun 12"
  match_time?: string;
  status?: string;
  venue?: string;
  city?: string;
}

interface Props {
  match: Match;
  onClose: () => void;
  onSubmit?: (prediction: "home_win" | "draw" | "away_win") => void;
}

export default function PredictionModal({ match, onClose, onSubmit }: Props) {
  const [selected, setSelected] = useState<"home_win" | "draw" | "away_win" | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selected) return;
    setLoading(true);

    try {
      const token = localStorage.getItem("sb-token") ||
                   document.cookie.split("; ").find(c => c.startsWith("sb-token="))?.split("=")[1];

      const response = await fetch("/api/predictions/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          match_id: match.id,
          prediction: selected,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit prediction");
      }

      onSubmit?.(selected);
      onClose();
    } catch (err) {
      console.error("Prediction error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Parse fixture date like "Jun 12"
  const dateStr = match.match_date;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        <div
          className="w-full max-w-md rounded-t-3xl overflow-hidden bg-white"
          style={{ maxHeight: "90vh" }}
        >
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-black text-gray-900">Predict Match</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Match info */}
            <div className="text-center">
              <p className="text-sm font-bold text-gray-700 mb-1">
                {match.home_team} vs {match.away_team}
              </p>
              <p className="text-xs text-gray-500">{dateStr}</p>
              {match.match_time && (
                <p style={{ fontSize: "12px", color: "#FF6600", fontWeight: "bold", marginTop: "4px" }}>
                  {convertETToNL(match.match_time)}
                </p>
              )}
            </div>
          </div>

          {/* Predictions */}
          <div className="px-4 py-6 space-y-3">
            <button
              onClick={() => setSelected("home_win")}
              className="w-full py-3 rounded-2xl font-bold text-center transition-all"
              style={{
                background: selected === "home_win" ? "#D52B1E" : "#F3F4F6",
                color: selected === "home_win" ? "white" : "#374151",
                border: selected === "home_win" ? "2px solid #B91F15" : "2px solid transparent",
              }}
            >
              {match.home_team} Wins
            </button>

            <button
              onClick={() => setSelected("draw")}
              className="w-full py-3 rounded-2xl font-bold text-center transition-all"
              style={{
                background: selected === "draw" ? "#3B82F6" : "#F3F4F6",
                color: selected === "draw" ? "white" : "#374151",
                border: selected === "draw" ? "2px solid #2563EB" : "2px solid transparent",
              }}
            >
              Draw
            </button>

            <button
              onClick={() => setSelected("away_win")}
              className="w-full py-3 rounded-2xl font-bold text-center transition-all"
              style={{
                background: selected === "away_win" ? "#10B981" : "#F3F4F6",
                color: selected === "away_win" ? "white" : "#374151",
                border: selected === "away_win" ? "2px solid #059669" : "2px solid transparent",
              }}
            >
              {match.away_team} Wins
            </button>
          </div>

          {/* Submit */}
          <div className="px-4 pb-6">
            <button
              onClick={handleSubmit}
              disabled={!selected || loading}
              className="w-full py-3 rounded-2xl font-black text-white transition-all active:scale-95"
              style={{
                background: selected && !loading ? "#D52B1E" : "#D1D5DB",
                opacity: !selected || loading ? 0.5 : 1,
              }}
            >
              {loading ? "Submitting..." : "Submit Prediction"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
