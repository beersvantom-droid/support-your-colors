"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TEAMS } from "@/lib/wc2026-data";

interface MatchDayTheme {
  color: string;
  flag: string;
  team: string;
}

export default function MatchDayTheme() {
  const [theme, setTheme] = useState<MatchDayTheme | null>(null);

  useEffect(() => {
    async function checkMatchDay() {
      const amsNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const today = amsNow.toISOString().split("T")[0];

      const { data } = await supabase
        .from("match_results")
        .select("home_team, away_team, status")
        .eq("match_date", today)
        .in("status", ["live", "upcoming", "finished"]);

      if (!data || data.length === 0) return;

      const match = data.find(
        (m) => m.home_team === "Netherlands" || m.away_team === "Netherlands"
      );

      if (match) {
        const info = TEAMS["Netherlands"];
        setTheme({ color: info.color, flag: info.flag, team: "Netherlands" });
      }
    }

    checkMatchDay();
  }, []);

  if (!theme) return null;

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
