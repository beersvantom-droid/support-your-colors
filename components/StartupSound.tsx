"use client";

import { useEffect } from "react";

const COOLDOWN_MS = 30 * 60 * 1000;

export default function StartupSound() {
  useEffect(() => {
    const lastPlayed = parseInt(localStorage.getItem("startup_sound_at") ?? "0", 10);
    if (Date.now() - lastPlayed < COOLDOWN_MS) return;
    localStorage.setItem("startup_sound_at", Date.now().toString());

    const audio = new Audio("/sounds/startup.mp3");
    audio.volume = 0.6;
    audio.play().catch(() => {});
  }, []);

  return null;
}
