"use client";

import { useEffect } from "react";

export default function StartupSound() {
  useEffect(() => {
    if (sessionStorage.getItem("startup_played")) return;
    sessionStorage.setItem("startup_played", "1");

    const audio = new Audio("/sounds/startup.mp3");
    audio.volume = 0.6;
    audio.play().catch(() => {});
  }, []);

  return null;
}
