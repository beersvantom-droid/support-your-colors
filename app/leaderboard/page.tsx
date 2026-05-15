"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import FanSupportRanking from "@/components/leaderboard/FanSupportRanking";
import TournamentPerformance from "@/components/leaderboard/TournamentPerformance";

const ACCENT = "#D52B1E";

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<"fan-support" | "tournament">("fan-support");

  return (
    <div className="min-h-full pb-24">
      <PageHeader
        title="Rankings"
        subtitle={activeTab === "fan-support" ? "Top supporters this week" : "Country performance points"}
        accentColor={ACCENT}
      />

      {/* Tab Toggle */}
      <div className="px-4 py-4">
        <div
          className="flex gap-2 p-1.5 rounded-full"
          style={{ background: "rgba(0,0,0,0.04)" }}
        >
          {[
            { id: "fan-support", label: "👥 Fan Support" },
            { id: "tournament", label: "🏆 Tournament" },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className="flex-1 py-2 px-4 rounded-full text-sm font-bold transition-all"
              style={{
                background: activeTab === id ? ACCENT : "transparent",
                color: activeTab === id ? "white" : "#6B7280",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="py-4">
        {activeTab === "fan-support" ? (
          <FanSupportRanking />
        ) : (
          <TournamentPerformance />
        )}
      </div>
    </div>
  );
}
