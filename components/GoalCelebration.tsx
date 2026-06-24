"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import { TEAMS } from "@/lib/wc2026-data";

interface GoalEvent {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  isOwnCountry: boolean;
  countryColor: string;
  homeFlag: string;
  awayFlag: string;
}

interface StoredScores {
  [key: string]: { home: number; away: number; updatedAt: string };
}

function createBallElement(isFlag: boolean, flagEmoji: string, delay: number): HTMLDivElement {
  const el = document.createElement("div");
  const left = Math.random() * 94 + 3;
  const dur = 2.5 + Math.random() * 2.5;

  if (isFlag) {
    const size = 22 + Math.random() * 10;
    el.textContent = flagEmoji;
    el.style.cssText = `position:absolute;left:${left}%;top:-50px;font-size:${size}px;pointer-events:none;animation:goalFlagFall ${dur}s ${delay}s linear forwards;`;
  } else {
    const size = 30 + Math.random() * 18;
    const img = document.createElement("img");
    img.src = "/chat/wk-bal.png";
    img.style.cssText = "width:100%;height:100%;object-fit:contain;";
    el.appendChild(img);
    el.style.cssText = `position:absolute;left:${left}%;top:-50px;width:${size}px;height:${size}px;pointer-events:none;animation:goalBallFall ${dur}s ${delay}s linear forwards;`;
  }

  return el;
}

export default function GoalCelebration() {
  const { profile } = useAuth();
  const [queue, setQueue] = useState<GoalEvent[]>([]);
  const [active, setActive] = useState<GoalEvent | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const ballsRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const scoresRef = useRef<StoredScores>({});
  const initializedRef = useRef(false);

  const userCountry = profile?.country ?? null;

  // Load stored scores on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("goal_scores");
      if (stored) scoresRef.current = JSON.parse(stored);
    } catch { /* empty */ }
    initializedRef.current = true;
  }, []);

  // Poll for score changes
  useEffect(() => {
    if (!initializedRef.current) return;

    const checkGoals = async () => {
      const { data } = await supabase
        .from("match_results")
        .select("home_team, away_team, home_score, away_score, updated_at")
        .in("status", ["live", "finished"])
        .not("home_score", "is", null)
        .not("away_score", "is", null);

      if (!data) return;

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const newGoals: GoalEvent[] = [];

      for (const match of data) {
        const key = `${match.home_team}_${match.away_team}`;
        const prev = scoresRef.current[key];
        const currHome = match.home_score as number;
        const currAway = match.away_score as number;

        if (prev && match.updated_at > fiveMinutesAgo) {
          const homeScored = currHome > prev.home;
          const awayScored = currAway > prev.away;

          if (homeScored || awayScored) {
            const scoringTeam = homeScored ? match.home_team : match.away_team;
            const isOwn = scoringTeam === userCountry;
            const teamInfo = TEAMS[scoringTeam as string];

            newGoals.push({
              homeTeam: match.home_team as string,
              awayTeam: match.away_team as string,
              homeScore: currHome,
              awayScore: currAway,
              isOwnCountry: isOwn,
              countryColor: isOwn && teamInfo ? teamInfo.color : "#ffffff",
              homeFlag: TEAMS[match.home_team as string]?.flag ?? "🏳️",
              awayFlag: TEAMS[match.away_team as string]?.flag ?? "🏳️",
            });
          }
        }

        scoresRef.current[key] = { home: currHome, away: currAway, updatedAt: match.updated_at as string };
      }

      localStorage.setItem("goal_scores", JSON.stringify(scoresRef.current));

      if (newGoals.length > 0) {
        setQueue(prev => [...prev, ...newGoals]);
      }
    };

    checkGoals();
    const interval = setInterval(checkGoals, 30_000);
    return () => clearInterval(interval);
  }, [userCountry]);

  // Play next goal from queue
  useEffect(() => {
    if (active || queue.length === 0) return;
    const [next, ...rest] = queue;
    setActive(next);
    setQueue(rest);
  }, [queue, active]);

  // Run animation when active goal changes
  const playAnimation = useCallback((goal: GoalEvent) => {
    const overlay = overlayRef.current;
    const balls = ballsRef.current;
    const text = textRef.current;
    if (!overlay || !balls || !text) return;

    balls.innerHTML = "";
    overlay.style.opacity = "1";

    const count = goal.isOwnCountry ? 35 : 25;
    const flag = goal.isOwnCountry
      ? (TEAMS[userCountry!]?.flag ?? "🏳️")
      : "";

    for (let i = 0; i < count; i++) {
      const isFlag = goal.isOwnCountry && Math.random() < 0.35;
      const delay = Math.random() * 3.5;
      balls.appendChild(createBallElement(isFlag, flag, delay));
    }

    if (goal.isOwnCountry) {
      try {
        const audio = new Audio("/sounds/goal.wav");
        audio.volume = 0.8;
        audio.play().catch(() => {});
      } catch { /* empty */ }
    }

    text.style.animation = "goalTextIn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards";

    setTimeout(() => {
      if (text) text.style.animation = "goalTextOut 0.8s ease-in forwards";
    }, 4200);

    setTimeout(() => {
      if (overlay) overlay.style.opacity = "0";
      if (balls) balls.innerHTML = "";
      if (text) text.style.animation = "";
      setActive(null);
    }, 5000);
  }, [userCountry]);

  useEffect(() => {
    if (active) playAnimation(active);
  }, [active, playAnimation]);

  if (!active) return null;

  return (
    <div
      ref={overlayRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "none",
        opacity: 0,
        transition: "opacity 0.3s",
      }}
    >
      <div ref={ballsRef} style={{ position: "absolute", inset: 0, overflow: "hidden" }} />

      <div
        ref={textRef}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          opacity: 0,
        }}
      >
        <p
          style={{
            fontSize: active.isOwnCountry ? 56 : 48,
            fontWeight: 900,
            margin: 0,
            letterSpacing: "0.05em",
            color: active.isOwnCountry ? active.countryColor : "#fff",
            textShadow: active.isOwnCountry
              ? `0 0 30px ${active.countryColor}, 0 0 60px ${active.countryColor}`
              : "0 0 30px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.8)",
            animation: active.isOwnCountry
              ? "goalOwnGlow 0.8s ease-in-out infinite"
              : "none",
            WebkitTextStroke: active.isOwnCountry ? "none" : "1px rgba(0,0,0,0.3)",
          }}
        >
          GOAL!
        </p>
        <p
          style={{
            fontSize: 20,
            fontWeight: 700,
            margin: "8px 0 0",
            color: active.isOwnCountry ? active.countryColor : "#333",
            textShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }}
        >
          {active.homeFlag} {active.homeScore} - {active.awayScore} {active.awayFlag}
        </p>
      </div>
    </div>
  );
}
