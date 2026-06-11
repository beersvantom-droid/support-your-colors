import { supabase } from "@/lib/supabase";
import { TEAMS } from "@/lib/wc2026-data";

interface LiveMatch {
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
}

async function getLiveMatches(): Promise<LiveMatch[]> {
  const { data } = await supabase
    .from("match_results")
    .select("home_team, away_team, home_score, away_score")
    .eq("status", "live");

  return data ?? [];
}

export default async function LiveScoresBar() {
  const liveMatches = await getLiveMatches();

  if (liveMatches.length === 0) return null;

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 overflow-x-auto border-b border-border"
      style={{ background: "#FAFAFA" }}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{
          background: "#D52B1E",
          boxShadow: "0 0 0 2px #D52B1E33",
          animation: "pulse 2s ease-in-out infinite",
        }}
      />
      <span
        className="text-[9px] font-black uppercase tracking-widest flex-shrink-0"
        style={{ color: "#9CA3AF" }}
      >
        Live
      </span>

      <div className="flex items-center gap-3 overflow-x-auto">
        {liveMatches.map((m, i) => {
          const home = TEAMS[m.home_team];
          const away = TEAMS[m.away_team];
          return (
            <div
              key={`${m.home_team}-${m.away_team}-${i}`}
              className="flex items-center gap-1.5 flex-shrink-0 px-2 py-0.5 rounded-full"
              style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
            >
              <span className="text-sm leading-none">{home?.flag ?? "🏳️"}</span>
              <span className="text-[11px] font-black tabular-nums" style={{ color: "#111827" }}>
                {m.home_score ?? 0}–{m.away_score ?? 0}
              </span>
              <span className="text-sm leading-none">{away?.flag ?? "🏳️"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
