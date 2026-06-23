"use client";

import { useState, useEffect } from "react";

type Phase = "idle" | "opening" | "flash" | "reveal" | "result";

interface Props {
  packImage: string;
  onDone: () => void;
}

interface Particle {
  id: number;
  angle: number;
  dist: number;
  size: number;
  color: string;
  dur: number;
}

function makeParticles(isMascot: boolean): Particle[] {
  const count = isMascot ? 50 : 20;
  const colors = isMascot
    ? ["#FFD700", "#FFF44F", "#FFED4E", "#FFE135", "#FFC700", "#DAA520"]
    : ["#10B981", "#34D399", "#6EE7B7", "#A7F3D0"];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: (i / count) * 360 + (Math.random() - 0.5) * 30,
    dist: 80 + Math.random() * 120,
    size: 3 + Math.random() * 6,
    color: colors[Math.floor(Math.random() * colors.length)],
    dur: 0.6 + Math.random() * 0.5,
  }));
}

export default function ChallengeRewardOpener({ packImage, onDone }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [reward, setReward] = useState<{
    rewardType: "mascot" | "coins";
    coinsAmount: number;
    mascotLabel?: string;
    mascotEmoji?: string;
    rank: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);

  const isMascot = reward?.rewardType === "mascot";
  const glowRgb = isMascot ? "255,215,0" : "16,185,129";
  const accent = isMascot ? "#FFD700" : "#10B981";

  function openPack() {
    if (phase !== "idle") return;
    setPhase("opening");

    fetch("/api/challenge/claim", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.alreadyClaimed ? "Je hebt deze beloning al opgehaald!" : data.error);
          return;
        }
        setReward(data);
        setParticles(makeParticles(data.rewardType === "mascot"));
      })
      .catch(() => setError("Er ging iets mis, probeer opnieuw"));

    setTimeout(() => setPhase("flash"), 1600);
    setTimeout(() => setPhase("reveal"), 2400);
    setTimeout(() => setPhase("result"), 3800);
  }

  // Auto-start after a brief moment
  useEffect(() => {
    const t = setTimeout(openPack, 600);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Result screen
  if (phase === "result") {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden">
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(24px)" }} />

        {/* Glow bg */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: `radial-gradient(ellipse at 50% 70%, rgba(${glowRgb},0.28) 0%, transparent 65%)`,
          animation: "rareBg 0.6s ease-out both",
        }} />

        {/* Confetti for mascot */}
        {isMascot && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 20 }}>
            {Array.from({ length: 40 }, (_, i) => ({
              id: i,
              left: `${3 + (i * 2.4) % 94}%`,
              delay: `${(i * 0.07) % 1.8}s`,
              dur: `${1.8 + (i % 4) * 0.3}s`,
              color: ["#FFD700", "#FFF44F", "#FFC700", "#DAA520", "#FBBF24"][i % 5],
              size: 4 + (i % 4),
              rounded: i % 3 === 0,
            })).map(p => (
              <div key={p.id} style={{
                position: "absolute", left: p.left, top: "-8%",
                width: p.size, height: p.size,
                borderRadius: p.rounded ? "50%" : "2px",
                background: p.color, opacity: 0.85,
                animation: `confettiFall ${p.dur} ${p.delay} linear forwards`,
              }} />
            ))}
          </div>
        )}

        {/* Sheet */}
        <div
          className="relative z-10 w-full max-w-md px-6 pt-8 pb-10 flex flex-col items-center gap-5"
          style={{
            background: `rgba(${isMascot ? "8,3,0" : "0,5,3"},0.97)`,
            borderTop: `1px solid rgba(${glowRgb},0.60)`,
            borderLeft: `1px solid rgba(${glowRgb},0.20)`,
            borderRight: `1px solid rgba(${glowRgb},0.20)`,
            borderRadius: "28px 28px 0 0",
            animation: "sheetUp 0.44s cubic-bezier(0.34,1.52,0.64,1) both",
            boxShadow: `0 -40px 100px rgba(${glowRgb},0.40)`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div style={{
            position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
            width: 40, height: 4, borderRadius: 9999,
            background: `rgba(${glowRgb},0.35)`,
          }} />

          {/* Badge */}
          <div style={{
            padding: "6px 20px", borderRadius: 9999,
            background: `rgba(${glowRgb},0.12)`,
            color: accent,
            border: `1px solid rgba(${glowRgb},0.60)`,
            boxShadow: `0 0 28px rgba(${glowRgb},0.35)`,
            fontSize: 11, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase",
            animation: isMascot ? "badgePulse 1.8s ease-in-out 0.6s infinite" : "none",
          }}>
            {isMascot ? "Special Mascot" : "Community Reward"}
          </div>

          {/* Icon */}
          <div style={{
            fontSize: isMascot ? 96 : 80,
            lineHeight: 1,
            filter: `drop-shadow(0 0 ${isMascot ? 32 : 20}px ${accent}) drop-shadow(0 0 ${isMascot ? 64 : 40}px rgba(${glowRgb},0.5))`,
            animation: `cosmeticReveal 0.55s cubic-bezier(0.34,1.56,0.64,1) both${isMascot ? ", legendaryGlow 1.6s ease-in-out 0.6s infinite" : ""}`,
          }}>
            {error ? "❌" : isMascot ? reward?.mascotEmoji : "🪙"}
          </div>

          {/* Text */}
          <div style={{ textAlign: "center", minHeight: 52 }}>
            {error ? (
              <p style={{ color: "#EF4444", fontSize: 14, fontWeight: 700 }}>{error}</p>
            ) : reward ? (
              <div style={{ animation: "cosmeticReveal 0.35s 0.10s both" }}>
                <p style={{
                  fontWeight: 900, color: "#fff", fontSize: isMascot ? 28 : 22,
                  letterSpacing: "-0.02em", marginBottom: 4,
                }}>
                  {isMascot ? reward.mascotLabel : `${reward.coinsAmount} Munten`}
                </p>
                <p style={{ fontWeight: 700, fontSize: isMascot ? 15 : 13, color: accent }}>
                  {isMascot ? "SPECIAL MASCOT UNLOCKED! 🐐👑" : "Community Challenge beloning!"}
                </p>
                <p style={{ color: "#6B7280", fontSize: 11, marginTop: 8 }}>
                  #{reward.rank} in de groep
                </p>
              </div>
            ) : (
              <p style={{ color: "#374151", fontSize: 13 }}>Laden…</p>
            )}
          </div>

          {/* Actions */}
          <div style={{ width: "100%", display: "flex", gap: 12, marginTop: 4 }}>
            <button
              onClick={onDone}
              style={{
                flex: 1, padding: "16px 0", borderRadius: 16,
                background: reward && isMascot
                  ? `linear-gradient(135deg, rgba(${glowRgb},0.25), rgba(${glowRgb},0.40))`
                  : "rgba(255,255,255,0.05)",
                color: reward && isMascot ? accent : "#6B7280",
                border: `1px solid rgba(${glowRgb},${reward && isMascot ? 0.5 : 0.06})`,
                fontWeight: 900, fontSize: 14, cursor: "pointer",
              }}
            >
              {reward && isMascot ? "Naar Locker →" : "Sluiten"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Opening / flash / reveal phases
  if (phase !== "idle") {
    return (
      <>
        <div style={{ position: "fixed", inset: 0, zIndex: 49, pointerEvents: "auto" }} />
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.96)", backdropFilter: "blur(8px)", overflow: "hidden",
        }}>
          {/* Flash */}
          {phase === "flash" && reward && (
            <>
              <div style={{
                position: "absolute", inset: 0,
                background: `radial-gradient(circle at 50% 50%, rgba(${glowRgb},0.85) 0%, rgba(${glowRgb},0.30) 45%, transparent 70%)`,
                animation: "packFlash 0.5s ease-out both", pointerEvents: "none",
              }} />
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
                animation: "premiumShimmer 0.8s ease-out 0.1s both", pointerEvents: "none",
              }} />
            </>
          )}

          {/* Particles */}
          {(phase === "flash" || phase === "reveal") && particles.length > 0 && (
            <div style={{ position: "absolute", top: "50%", left: "50%", pointerEvents: "none" }}>
              {particles.map(p => (
                <div key={p.id} style={{
                  position: "absolute", width: p.size, height: p.size,
                  borderRadius: "50%", background: p.color,
                  boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                  animation: `particleBurst ${p.dur}s ease-out forwards`,
                  ["--px" as string]: `${Math.cos(p.angle * Math.PI / 180) * p.dist}px`,
                  ["--py" as string]: `${Math.sin(p.angle * Math.PI / 180) * p.dist}px`,
                }} />
              ))}
            </div>
          )}

          {/* Pack card */}
          {phase === "opening" && (
            <div style={{ animation: "packOpen 1.6s cubic-bezier(0.36,0,0.66,-0.56) forwards" }}>
              <div style={{
                width: 200, height: 280, borderRadius: 18,
                background: `url("${packImage}") center/cover no-repeat`,
                border: "2px solid rgba(255,215,0,0.30)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(255,215,0,0.15)",
                position: "relative", overflow: "hidden",
                animation: "packIdle 3s ease-in-out infinite",
              }}>
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%, rgba(255,255,255,0.06) 100%)",
                  borderRadius: "inherit", pointerEvents: "none",
                }} />
              </div>
            </div>
          )}

          {/* Reveal emoji */}
          {(phase === "flash" || phase === "reveal") && reward && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
              animation: phase === "reveal" ? "packRevealItem 0.6s cubic-bezier(0.34,1.56,0.64,1) both" : "none",
            }}>
              <div style={{
                position: "relative", width: 160, height: 160,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{
                  position: "absolute", inset: -20, borderRadius: "50%",
                  background: `radial-gradient(circle, rgba(${glowRgb},0.5) 0%, transparent 70%)`,
                  animation: "revealGlow 1s ease-out both",
                }} />
                <div style={{
                  fontSize: 100, lineHeight: 1,
                  filter: `drop-shadow(0 0 30px ${accent}) drop-shadow(0 0 60px rgba(${glowRgb},0.6))`,
                  animation: "packRevealItem 0.6s cubic-bezier(0.34,1.56,0.64,1) both",
                }}>
                  {isMascot ? reward.mascotEmoji : "🪙"}
                </div>
              </div>
              <div style={{
                color: accent, fontWeight: 900, fontSize: 22,
                textShadow: `0 0 20px ${accent}`,
                animation: "cosmeticReveal 0.4s 0.2s both",
              }}>
                {isMascot ? reward.mascotLabel : `${reward.coinsAmount} Munten`}
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  // Idle — shouldn't show since we auto-start
  return null;
}
