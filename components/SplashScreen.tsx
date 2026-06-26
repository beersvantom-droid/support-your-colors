"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const SPLASH_DURATION = 3000;
const COOLDOWN_MS = 60 * 1000;

export default function SplashScreen({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const lastPlayed = parseInt(localStorage.getItem("startup_sound_at") ?? "0", 10);
    if (Date.now() - lastPlayed < COOLDOWN_MS) {
      setShowSplash(false);
      return;
    }

    localStorage.setItem("startup_sound_at", Date.now().toString());

    const audio = new Audio("/sounds/startup.mp3");
    audio.volume = 0.6;
    audio.play().catch(() => {});

    setTimeout(() => setFading(true), SPLASH_DURATION - 600);
    setTimeout(() => setShowSplash(false), SPLASH_DURATION);
  }, []);

  return (
    <>
      {showSplash && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            background: "linear-gradient(160deg, #001845 0%, #002868 30%, #1A3A6E 60%, #006847 100%)",
            opacity: fading ? 0 : 1,
            transition: "opacity 0.6s ease-out",
          }}
        >
          <Image
            src="/icon.png"
            alt="Support Your Colors"
            width={100}
            height={100}
            style={{ borderRadius: 24 }}
            priority
            unoptimized
          />

          <h1
            style={{
              color: "#fff",
              fontWeight: 900,
              fontSize: 22,
              letterSpacing: "-0.02em",
              textAlign: "center",
              margin: 0,
            }}
          >
            Support Your Colors
          </h1>

          <p
            style={{
              fontWeight: 900,
              fontSize: 18,
              margin: 0,
              background: "linear-gradient(90deg, #FFFFFF 0%, #FFD700 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            World Cup 2026
          </p>

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 24 }}>🍁</span>
            <span style={{ fontSize: 24 }}>🇺🇸</span>
            <span style={{ fontSize: 24 }}>🇲🇽</span>
          </div>
        </div>
      )}

      {children}
    </>
  );
}
