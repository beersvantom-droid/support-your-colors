"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TEAMS } from "@/lib/wc2026-data";

const MANUAL_THEMES: { team: string; date: string }[] = [
  { team: "Netherlands", date: "2026-06-29" },
];

export default function MatchDayTheme() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    async function check() {
      const amsNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const today = amsNow.toISOString().split("T")[0];
      const hour = amsNow.getHours();

      // Check manual overrides (active until 5 AM next day)
      const yesterday = new Date(amsNow);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      const manualToday = MANUAL_THEMES.some(t => t.team === "Netherlands" && t.date === today);
      const manualYesterday = MANUAL_THEMES.some(t => t.team === "Netherlands" && t.date === yesterdayStr && hour < 5);

      if (manualToday || manualYesterday) {
        setActive(true);
        return;
      }

      // Auto-detect from match_results
      const { data } = await supabase
        .from("match_results")
        .select("home_team, away_team, status")
        .eq("match_date", today);

      if (!data) return;

      const hasNL = data.some(
        (m) => m.home_team === "Netherlands" || m.away_team === "Netherlands"
      );

      if (hasNL) setActive(true);
    }

    check();
  }, []);

  if (!active) return null;

  return (
    <style>{`
      .bg-surface { background: #FFF7ED !important; }
      header { background: rgba(255,102,0,0.08) !important; backdrop-filter: blur(20px) !important; }
      nav > div > div { background: rgba(255,102,0,0.95) !important; }
      nav span { color: #fff !important; }
      nav svg { color: #fff !important; }
      nav a[style*="transparent"] { background: transparent !important; }
      nav a[style*="14"] { background: rgba(255,255,255,0.2) !important; }
    `}</style>
  );
}
