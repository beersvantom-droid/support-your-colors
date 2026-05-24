"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { Pack } from "@/lib/packs";
import type { Cosmetic, Mascot } from "@/lib/cosmetics";
import { RARITY_META } from "@/lib/cosmetics";

// ── Types ─────────────────────────────────────────────────────────────────────

type Rarity = "common" | "rare" | "epic" | "legendary" | "mascots" | "cor";

type Phase =
  | "idle"       // pack shown, button ready
  | "opening"    // pack flying/flipping (0-1.2s)
  | "flash"      // white/color flash (1.2-1.6s)
  | "reveal"     // item zooms in (1.6-2.4s)
  | "result";    // full result sheet

interface PackOpenerProps {
  pack: Pack;
  onReset: () => void; // go back to selector
}

// ── Rarity config ─────────────────────────────────────────────────────────────

const RARITY_CFG: Record<Rarity, {
  bg: string; glow: string; glowRgb: string; accent: string;
  particleCount: number; flavor: string;
}> = {
  common:    { bg: "rgba(3,5,10,0.97)",   glow: "#4A6080", glowRgb: "74,96,128",   accent: "#7890A8", particleCount: 8,  flavor: "Solide pull!"          },
  rare:      { bg: "rgba(1,3,14,0.97)",   glow: "#3B82F6", glowRgb: "59,130,246",  accent: "#60A5FA", particleCount: 16, flavor: "Mooie pack!"           },
  epic:      { bg: "rgba(3,1,10,0.97)",   glow: "#A855F7", glowRgb: "168,85,247",  accent: "#C084FC", particleCount: 24, flavor: "EPIC PULL! 🔥"         },
  legendary: { bg: "rgba(8,3,0,0.97)",    glow: "#F59E0B", glowRgb: "245,158,11",  accent: "#FBBF24", particleCount: 40, flavor: "LEGENDARY! 🏆"         },
  mascots:   { bg: "rgba(8,1,1,0.97)",    glow: "#EF4444", glowRgb: "239,68,68",   accent: "#FCA5A5", particleCount: 32, flavor: "MASCOT UNLOCKED! 🎭"   },
  cor:       { bg: "rgba(8,6,0,0.99)",    glow: "#FFD700", glowRgb: "255,215,0",   accent: "#FFF44F", particleCount: 60, flavor: "THE COR LEGEND! 👑"   },
};

// ── Particle helpers ──────────────────────────────────────────────────────────

interface Particle { id: number; angle: number; dist: number; size: number; color: string; dur: number }

function makeParticles(rarity: Rarity, count: number): Particle[] {
  const colors: Record<Rarity, string[]> = {
    common:    ["#7890A8","#AAC0D8","#C8D8E8"],
    rare:      ["#60A5FA","#93C5FD","#BFDBFE","#DBEAFE"],
    epic:      ["#C084FC","#E9D5FF","#A855F7","#D8B4FE"],
    legendary: ["#FBBF24","#FDE68A","#F59E0B","#FFFDE0","#FCD34D"],
    mascots:   ["#EF4444","#FCA5A5","#FEE2E2","#F87171","#DC2626"],
    cor:       ["#FFD700","#FFF44F","#FFED4E","#FFE135","#FFC700","#DAA520","#B8860B","#FFD700"],
  };
  return Array.from({ length: count }, (_, i) => ({
    id:    i,
    angle: (i / count) * 360 + (Math.random() - 0.5) * 30,
    dist:  80 + Math.random() * 120,
    size:  3 + Math.random() * 6,
    color: colors[rarity][Math.floor(Math.random() * colors[rarity].length)],
    dur:   0.6 + Math.random() * 0.5,
  }));
}

// ── Pack card visual ──────────────────────────────────────────────────────────

function PackCard({ pack, phase }: { pack: Pack; phase: Phase }) {
  const isOpening = phase === "opening";
  const hasImage = pack.imagePath;
  const isCorPack = pack.id === "cor_pack";
  const isRonPack = pack.id === "ron_pack";
  const isJannesPack = pack.id === "jannes_pack";
  const isVillainPack = pack.id === "villain_pack";
  const isUdoPack = pack.id === "udo_pack";
  const isRustaraghPack = pack.id === "rustaagh_pack";
  const isMascottePack = pack.id === "mascotte_pack";
  const isRoulettePack = pack.id === "roulette_pack";
  const isSpecialPack = isCorPack || isRonPack || isJannesPack || isVillainPack || isUdoPack || isRustaraghPack || isMascottePack || isRoulettePack;
  const openDuration = isSpecialPack ? "1.6s" : "1.2s";

  return (
    <div
      style={{
        width: 200, height: 280,
        borderRadius: 18,
        background: hasImage
          ? `url("${pack.imagePath}") center/cover no-repeat`
          : "linear-gradient(145deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
        border: "2px solid rgba(255,255,255,0.15)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        position: "relative",
        overflow: "hidden",
        transformOrigin: "center center",
        animation: isOpening ? `packOpen ${openDuration} cubic-bezier(0.36,0,0.66,-0.56) forwards` : "packIdle 3s ease-in-out infinite",
      }}
    >
      {/* Shine overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: hasImage
          ? "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%, rgba(255,255,255,0.06) 100%)"
          : "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(255,255,255,0.04) 100%)",
        borderRadius: "inherit",
        pointerEvents: "none",
      }} />

      {!hasImage && (
        <>
          {/* Top band (only if no image) */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 6,
            background: "linear-gradient(90deg, #F59E0B, #FBBF24, #F59E0B)",
            borderRadius: "18px 18px 0 0",
          }} />
          {/* Emoji (only if no image) */}
          <div style={{ fontSize: 72, lineHeight: 1, filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))" }}>
            {pack.emoji}
          </div>
          {/* Label (only if no image) */}
          <div style={{
            color: "#FBBF24", fontWeight: 900, fontSize: 15,
            letterSpacing: "0.06em", textTransform: "uppercase",
            textShadow: "0 2px 8px rgba(0,0,0,0.6)",
          }}>
            {pack.label}
          </div>
          {/* Bottom band (only if no image) */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 4,
            background: "linear-gradient(90deg, #F59E0B, #FBBF24, #F59E0B)",
            borderRadius: "0 0 18px 18px",
          }} />
        </>
      )}
    </div>
  );
}

// ── Confetti rain (legendary/mascots) ─────────────────────────────────────────

function ConfettiRain({ rarity }: { rarity: Rarity }) {
  const pieces = Array.from({ length: 40 }, (_, i) => {
    const colors = rarity === "mascots"
      ? ["#EF4444","#FCA5A5","#DC2626","#FEE2E2"]
      : ["#FBBF24","#FDE68A","#F59E0B","#FFFDE0","#FCD34D","#D97706"];
    return {
      id: i,
      left: `${3 + (i * 2.4) % 94}%`,
      delay: `${(i * 0.07) % 1.8}s`,
      dur: `${1.8 + (i % 4) * 0.3}s`,
      color: colors[i % colors.length],
      size: 4 + (i % 4),
      rounded: i % 3 === 0,
    };
  });
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 20 }}>
      {pieces.map(p => (
        <div key={p.id} suppressHydrationWarning style={{
          position: "absolute",
          left: p.left, top: "-8%",
          width: p.size, height: p.size,
          borderRadius: p.rounded ? "50%" : "2px",
          background: p.color,
          opacity: 0.85,
          animation: `confettiFall ${p.dur} ${p.delay} linear forwards`,
        }} />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PackOpener({ pack, onReset }: PackOpenerProps) {
  const [phase,    setPhase]    = useState<Phase>("idle");
  const [rarity,   setRarity]   = useState<Rarity | null>(null);
  const [item,     setItem]     = useState<Cosmetic | Mascot | null>(null);
  const [status,   setStatus]   = useState<"loading" | "ok" | "all_owned" | "cooldown" | "error">("loading");
  const [minutesLeft, setMinutesLeft] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [coinDropped, setCoinDropped] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [isCoinsPackage, setIsCoinsPackage] = useState(false);
  const fetchRef = useRef<Promise<void> | null>(null);

  const cfg = rarity ? RARITY_CFG[rarity] : null;

  // ── Dispatch pack-opened event when successful ──────────────────────────────
  useEffect(() => {
    if (status === "ok") {
      window.dispatchEvent(new Event("pack-opened"));
    }
  }, [status]);

  // ── Trigger opening sequence ───────────────────────────────────────────────
  function openPack() {
    if (phase !== "idle") return;
    setPhase("opening");

    // Fire API call immediately (runs in background during animation)
    const apiPromise = fetch("/api/pack/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packId: pack.id }),
    }).then(r => r.json()).then((data: Record<string, unknown>) => {
      if (data.onCooldown) {
        setStatus("cooldown");
        setMinutesLeft(data.minutesLeft as number);
        return;
      }
      if (data.alreadyOwnsAll) { setStatus("all_owned"); return; }
      if (data.error)          { setStatus("error");     return; }

      // Check if this is a roulette package
      if (data.isRoulettePack === true) {
        // Check if DJ Derksen jackpot!
        if (data.isDerksen === true) {
          setRarity("mascots");
          setItem(data.item as Cosmetic | Mascot);
          // SUPER RARE! Maximum particles for jackpot!
          setParticles(makeParticles("mascots", 120));
        } else {
          setIsCoinsPackage(true);
          const isWin = data.isWin as boolean;
          const r = isWin ? ("legendary" as Rarity) : ("common" as Rarity);
          setRarity(r);
          setCoinsEarned(data.coins as number ?? 0);
          // More particles for wins!
          const particleCount = isWin ? 80 : 20;
          setParticles(makeParticles(r, particleCount));
        }
      } else if (data.isCoinsPackage === true) {
        setIsCoinsPackage(true);
        const r = data.rarity as Rarity;
        setRarity(r);
        setCoinsEarned(data.coins as number ?? 0);
        setParticles(makeParticles(r, RARITY_CFG[r].particleCount));
      } else {
        const r = data.rarity as Rarity;
        setRarity(r);
        setItem(data.item as Cosmetic | Mascot);
        setParticles(makeParticles(r, RARITY_CFG[r].particleCount));
      }

      setStatus("ok");
      // Update client-side cooldown so AppHeader icon dims immediately
      if (pack.cooldownMinutes > 0) {
        localStorage.setItem("pack_last_open", Date.now().toString());
      }
    }).catch(() => setStatus("error"));

    fetchRef.current = apiPromise;

    // Animation timeline — extended for special packs (Cor, Ron, Jannes, Villain, Udo, Rustaagh, Mascotte & Roulette)
    const isSpecialPack = pack.id === "cor_pack" || pack.id === "ron_pack" || pack.id === "jannes_pack" || pack.id === "villain_pack" || pack.id === "udo_pack" || pack.id === "rustaagh_pack" || pack.id === "mascotte_pack" || pack.id === "roulette_pack";
    const openDuration = isSpecialPack ? 1600 : 1200;
    const flashTime = isSpecialPack ? 1600 : 1200;
    const revealTime = isSpecialPack ? 2400 : 1800;
    const resultTime = isSpecialPack ? 3800 : 2800;

    // Timeline:
    // 0ms → pack flies/spins
    // openDuration ms → flash
    // revealTime ms → reveal
    // resultTime ms → full result sheet
    setTimeout(() => setPhase("flash"),  flashTime);
    setTimeout(() => setPhase("reveal"), revealTime);
    setTimeout(() => setPhase("result"), resultTime);
  }

  const isHighRarity = rarity === "legendary" || rarity === "mascots" || rarity === "cor";
  const isEpicPlus   = rarity === "epic" || isHighRarity;

  // ── RESULT SHEET ──────────────────────────────────────────────────────────
  if (phase === "result") {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden">
        {/* Backdrop */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(24px)" }} />

        {/* Rarity bg pulse */}
        {cfg && (
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: `radial-gradient(ellipse at 50% 70%, rgba(${cfg.glowRgb},0.28) 0%, transparent 65%)`,
            animation: "rareBg 0.6s ease-out both",
          }} />
        )}

        {/* Confetti for legendary/mascots */}
        {isHighRarity && <ConfettiRain rarity={rarity!} />}

        {/* Expanding rings */}
        {cfg && isEpicPlus && [0, 0.15, 0.30].map((delay, i) => (
          <div key={i} style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            width: `${52 - i * 4}vw`, height: `${52 - i * 4}vw`,
            maxWidth: 400 - i * 30, maxHeight: 400 - i * 30,
            borderRadius: "50%",
            border: `${2.5 - i * 0.5}px solid rgba(${cfg.glowRgb},${0.65 - i * 0.22})`,
            animation: `ringExpand 1.3s ${delay}s ease-out forwards`,
            pointerEvents: "none",
          }} />
        ))}

        {/* Sheet */}
        <div
          className="relative z-10 w-full max-w-md px-6 pt-8 pb-10 flex flex-col items-center gap-5"
          style={{
            background:   cfg?.bg ?? "rgba(3,5,10,0.97)",
            borderTop:    `1px solid rgba(${cfg?.glowRgb ?? "74,96,128"},0.60)`,
            borderLeft:   `1px solid rgba(${cfg?.glowRgb ?? "74,96,128"},0.20)`,
            borderRight:  `1px solid rgba(${cfg?.glowRgb ?? "74,96,128"},0.20)`,
            borderRadius: "28px 28px 0 0",
            animation:    "sheetUp 0.44s cubic-bezier(0.34,1.52,0.64,1) both",
            boxShadow:    `0 -40px 100px rgba(${cfg?.glowRgb ?? "74,96,128"},${isHighRarity ? 0.40 : isEpicPlus ? 0.30 : 0.22})`,
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Handle */}
          <div style={{
            position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
            width: 40, height: 4, borderRadius: 9999,
            background: `rgba(${cfg?.glowRgb ?? "74,96,128"},0.35)`,
          }} />

          {/* Rarity badge */}
          <div style={{
            padding: "6px 20px", borderRadius: 9999,
            background: `rgba(${cfg?.glowRgb ?? "74,96,128"},0.12)`,
            color: cfg?.accent ?? "#7890A8",
            border: `1px solid rgba(${cfg?.glowRgb ?? "74,96,128"},0.60)`,
            boxShadow: `0 0 28px rgba(${cfg?.glowRgb ?? "74,96,128"},0.35)`,
            fontSize: 11, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase" as const,
            animation: isHighRarity ? "badgePulse 1.8s ease-in-out 0.6s infinite" : "none",
          }}>
            {rarity === "mascots" ? "Mascot" : rarity ?? "…"}
          </div>

          {/* Main emoji */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {isEpicPlus && status === "ok" && (
              <div style={{
                position: "absolute",
                width: isHighRarity ? 130 : 115, height: isHighRarity ? 130 : 115,
                borderRadius: "50%",
                border: `1.5px solid rgba(${cfg?.glowRgb},0.55)`,
                boxShadow: `0 0 22px rgba(${cfg?.glowRgb},0.35)`,
                animation: "spinRing 3.5s linear infinite",
              }} />
            )}
            <div style={{
              fontSize: isHighRarity ? 96 : isEpicPlus ? 88 : 80,
              lineHeight: 1, userSelect: "none" as const,
              filter: status === "ok" && cfg
                ? `drop-shadow(0 0 ${isHighRarity ? 32 : 20}px ${cfg.accent}) drop-shadow(0 0 ${isHighRarity ? 64 : 40}px rgba(${cfg.glowRgb},0.5))`
                : "none",
              animation: status === "ok"
                ? `cosmeticReveal 0.55s cubic-bezier(0.34,1.56,0.64,1) both${isHighRarity ? ", legendaryGlow 1.6s ease-in-out 0.6s infinite" : ""}`
                : "none",
            }}>
              {status === "ok" && (isCoinsPackage ? "🪙" : (item ? (item as Cosmetic).emoji : "·  ·  ·"))}
            </div>
          </div>

          {/* Name + flavor */}
          <div style={{ textAlign: "center", minHeight: 52 }}>
            {status === "ok" && (isCoinsPackage || item) ? (
              <div style={{ animation: "cosmeticReveal 0.35s 0.10s both" }}>
                <p style={{
                  fontWeight: 900, color: "#fff", fontSize: isHighRarity ? 28 : 22,
                  letterSpacing: "-0.02em", marginBottom: 4,
                }}>
                  {isCoinsPackage ? `${coinsEarned} Munten` : (item as Cosmetic).label}
                </p>
                <p style={{ fontWeight: 700, fontSize: isHighRarity ? 15 : 13, color: cfg?.accent }}>
                  {cfg?.flavor}
                </p>
              </div>
            ) : status === "all_owned" ? (
              <p style={{ color: "#6B7280", fontSize: 14, fontWeight: 700 }}>Je bezit alles in deze categorie!</p>
            ) : status === "cooldown" ? (
              <p style={{ color: "#6B7280", fontSize: 14, fontWeight: 700 }}>
                Volgende pack over {minutesLeft >= 60
                  ? `${Math.floor(minutesLeft / 60)}u ${minutesLeft % 60}m`
                  : `${minutesLeft} minuten`}
              </p>
            ) : status === "error" ? (
              <p style={{ color: "#EF4444", fontSize: 13, fontWeight: 700 }}>Er ging iets mis, probeer opnieuw</p>
            ) : (
              <p style={{ color: "#374151", fontSize: 13 }}>Laden…</p>
            )}
          </div>

          {/* Actions */}
          <div style={{ width: "100%", display: "flex", gap: 12, marginTop: 4 }}>
            <button
              onClick={onReset}
              style={{
                flex: 1, padding: "16px 0", borderRadius: 16,
                background: "rgba(255,255,255,0.05)", color: "#6B7280",
                border: "1px solid rgba(255,255,255,0.06)",
                fontWeight: 900, fontSize: 14, cursor: "pointer",
              }}
            >
              Terug
            </button>
            {status === "ok" && !isCoinsPackage && (
              <Link
                href="/locker"
                style={{
                  flex: 1, padding: "16px 0", borderRadius: 16,
                  background: cfg ? `linear-gradient(135deg, rgba(${cfg.glowRgb},0.25), rgba(${cfg.glowRgb},0.40))` : "rgba(255,255,255,0.08)",
                  color: cfg?.accent ?? "#fff",
                  border: `1px solid rgba(${cfg?.glowRgb ?? "74,96,128"},0.50)`,
                  fontWeight: 900, fontSize: 14, cursor: "pointer",
                  textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 0 20px rgba(${cfg?.glowRgb ?? "74,96,128"},0.25)`,
                }}
              >
                Naar Locker →
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── OPENING / FLASH / REVEAL phases ──────────────────────────────────────
  if (phase !== "idle") {
    return (
      <>
        {/* Click blocker — prevents accidental navigation during animation */}
        <div style={{
          position: "fixed", inset: 0, zIndex: 49,
          pointerEvents: "auto",
        }} />

        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.96)",
          backdropFilter: "blur(8px)",
          overflow: "hidden",
        }}>

        {/* MASCOTTE PACK SPECIAL BACKGROUND */}
        {pack.id === "mascotte_pack" && (phase === "opening" || phase === "flash") && (
          <>
            {/* Animated circular background pattern */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: `radial-gradient(circle at 50% 50%, rgba(239,68,68,0.15) 0%, rgba(168,85,247,0.10) 30%, transparent 70%)`,
              animation: "mascotteBgPulse 2.5s ease-in-out infinite",
            }} />

            {/* Orbital mascot icons floating around */}
            {[0, 90, 180, 270].map((angle, i) => (
              <div key={i} style={{
                position: "absolute", top: "50%", left: "50%",
                width: 200, height: 200,
                transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-120px) rotate(-${angle}deg)`,
                animation: `mascotteOrbit 8s linear infinite`,
                animationDelay: `${i * -2}s`,
                pointerEvents: "none",
              }}>
                <div style={{
                  fontSize: 32, opacity: 0.3, filter: "drop-shadow(0 0 8px rgba(239,68,68,0.6))",
                  textAlign: "center",
                }}>🎭</div>
              </div>
            ))}

            {/* Extra glow rings radiating outward */}
            {[0, 0.15, 0.30, 0.45].map((delay, i) => (
              <div key={`ring-${i}`} style={{
                position: "absolute", top: "50%", left: "50%",
                width: 150 - i * 20, height: 150 - i * 20,
                borderRadius: "50%",
                border: `2px solid rgba(${239 - i * 20},${68 + i * 30},${68},${0.7 - i * 0.15})`,
                transform: "translate(-50%,-50%)",
                animation: `mascotteGlowWave 1.2s ${delay}s ease-out forwards`,
                pointerEvents: "none",
              }} />
            ))}
          </>
        )}

        {/* Color flash */}
        {phase === "flash" && rarity && cfg && (
          <>
            <div style={{
              position: "absolute", inset: 0,
              background: `radial-gradient(circle at 50% 50%, rgba(${cfg.glowRgb},0.85) 0%, rgba(${cfg.glowRgb},0.30) 45%, transparent 70%)`,
              animation: "packFlash 0.5s ease-out both",
              pointerEvents: "none",
            }} />
            {/* Extra shimmer wave */}
            <div style={{
              position: "absolute", inset: 0,
              background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)`,
              animation: "premiumShimmer 0.8s ease-out 0.1s both",
              pointerEvents: "none",
            }} />
            {/* Secondary glow rings */}
            {[0, 0.1, 0.2].map((delay, i) => (
              <div key={i} style={{
                position: "absolute", top: "50%", left: "50%",
                width: 200 - i * 40, height: 200 - i * 40,
                borderRadius: "50%",
                border: `2px solid rgba(${cfg.glowRgb},0.6)`,
                transform: "translate(-50%,-50%)",
                animation: `glowWave 0.6s ${delay}s ease-out forwards`,
                pointerEvents: "none",
              }} />
            ))}
          </>
        )}

        {/* Burst particles */}
        {(phase === "flash" || phase === "reveal") && particles.length > 0 && (
          <div style={{ position: "absolute", top: "50%", left: "50%", pointerEvents: "none" }}>
            {particles.map(p => (
              <div
                key={p.id}
                style={{
                  position: "absolute",
                  width: p.size, height: p.size,
                  borderRadius: "50%",
                  background: p.color,
                  boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                  animation: `particleBurst ${p.dur}s ease-out forwards`,
                  // CSS custom property for direction
                  ["--px" as string]: `${Math.cos(p.angle * Math.PI / 180) * p.dist}px`,
                  ["--py" as string]: `${Math.sin(p.angle * Math.PI / 180) * p.dist}px`,
                }}
              />
            ))}
          </div>
        )}

        {/* Pack card or revealed emoji */}
        {phase === "opening" && (
          <div style={{ animation: "packOpen 1.2s cubic-bezier(0.36,0,0.66,-0.56) forwards" }}>
            <PackCard pack={pack} phase={phase} />
          </div>
        )}

        {(phase === "flash" || phase === "reveal") && item && rarity && cfg && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
            animation: phase === "reveal" ? "packRevealItem 0.6s cubic-bezier(0.34,1.56,0.64,1) both" : "none",
          }}>
            {/* Rarity glow ring */}
            <div style={{
              position: "relative",
              width: 160, height: 160,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                position: "absolute", inset: -20,
                borderRadius: "50%",
                background: `radial-gradient(circle, rgba(${cfg.glowRgb},0.5) 0%, transparent 70%)`,
                animation: "revealGlow 1s ease-out both",
              }} />
              <div style={{
                fontSize: 100, lineHeight: 1,
                filter: `drop-shadow(0 0 30px ${cfg.accent}) drop-shadow(0 0 60px rgba(${cfg.glowRgb},0.6))`,
                animation: "packRevealItem 0.6s cubic-bezier(0.34,1.56,0.64,1) both",
              }}>
                {(item as Cosmetic).emoji}
              </div>
            </div>
            <div style={{
              color: cfg.accent, fontWeight: 900, fontSize: 22,
              textShadow: `0 0 20px ${cfg.accent}`,
              animation: "cosmeticReveal 0.4s 0.2s both",
            }}>
              {(item as Cosmetic).label}
            </div>
          </div>
        )}
        </div>
      </>
    );
  }

  // ── IDLE state — pack + button ────────────────────────────────────────────
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: 32, padding: "40px 24px",
    }}>
      {/* Pack card */}
      <PackCard pack={pack} phase="idle" />

      {/* Info */}
      <div style={{ textAlign: "center", maxWidth: 280 }}>
        <p style={{ color: "#fff", fontWeight: 900, fontSize: 20, marginBottom: 6 }}>{pack.label}</p>
        <p style={{ color: "#6B7280", fontSize: 14 }}>{pack.description}</p>
      </div>

      {/* Rarity odds */}
      <div style={{
        display: "flex", gap: 8, flexWrap: "wrap" as const, justifyContent: "center",
      }}>
        {pack.id === "cor_pack" ? (
          <>
            <div style={{
              padding: "4px 12px", borderRadius: 9999,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,191,36,0.3)",
              fontSize: 12, fontWeight: 700,
              color: "#FFD700",
            }}>
              Golden Cor 👑 30%
            </div>
            <div style={{
              padding: "4px 12px", borderRadius: 9999,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(168,85,247,0.3)",
              fontSize: 12, fontWeight: 700,
              color: "#C084FC",
            }}>
              Gouden Items 30%
            </div>
            <div style={{
              padding: "4px 12px", borderRadius: 9999,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
              fontSize: 12, fontWeight: 700,
              color: "#9CA3AF",
            }}>
              Random Items 40%
            </div>
          </>
        ) : pack.id === "ron_pack" ? (
          <>
            <div style={{
              padding: "4px 12px", borderRadius: 9999,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(168,85,247,0.3)",
              fontSize: 12, fontWeight: 700,
              color: "#C084FC",
            }}>
              Ron Jans ⚽ 30%
            </div>
            <div style={{
              padding: "4px 12px", borderRadius: 9999,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
              fontSize: 12, fontWeight: 700,
              color: "#9CA3AF",
            }}>
              Random Cosmetica 60%
            </div>
            <div style={{
              padding: "4px 12px", borderRadius: 9999,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
              fontSize: 12, fontWeight: 700,
              color: "#6B7280",
            }}>
              Bonus 10%
            </div>
          </>
        ) : pack.id === "jannes_pack" ? (
          <>
            <div style={{
              padding: "4px 12px", borderRadius: 9999,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(59,182,246,0.3)",
              fontSize: 12, fontWeight: 700,
              color: "#60A5FA",
            }}>
              Jannes 🌟 30%
            </div>
            <div style={{
              padding: "4px 12px", borderRadius: 9999,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
              fontSize: 12, fontWeight: 700,
              color: "#9CA3AF",
            }}>
              Random Cosmetica 60%
            </div>
            <div style={{
              padding: "4px 12px", borderRadius: 9999,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
              fontSize: 12, fontWeight: 700,
              color: "#6B7280",
            }}>
              Bonus 10%
            </div>
          </>
        ) : pack.id === "villain_pack" ? (
          <>
            <div style={{
              padding: "4px 12px", borderRadius: 9999,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,107,53,0.3)",
              fontSize: 12, fontWeight: 700,
              color: "#FF6B35",
            }}>
              Abu Harb 🦅 30%
            </div>
            <div style={{
              padding: "4px 12px", borderRadius: 9999,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,87,34,0.3)",
              fontSize: 12, fontWeight: 700,
              color: "#FF5722",
            }}>
              Vuur Items 🔥 40%
            </div>
            <div style={{
              padding: "4px 12px", borderRadius: 9999,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
              fontSize: 12, fontWeight: 700,
              color: "#9CA3AF",
            }}>
              Random 30%
            </div>
          </>
        ) : pack.id === "udo_pack" ? (
          <>
            <div style={{
              padding: "4px 12px", borderRadius: 9999,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(148,113,148,0.3)",
              fontSize: 12, fontWeight: 700,
              color: "#BF86D6",
            }}>
              Udo 😎 30%
            </div>
            <div style={{
              padding: "4px 12px", borderRadius: 9999,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(156,39,176,0.3)",
              fontSize: 12, fontWeight: 700,
              color: "#CE93D8",
            }}>
              Muziek 🎵 40%
            </div>
            <div style={{
              padding: "4px 12px", borderRadius: 9999,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
              fontSize: 12, fontWeight: 700,
              color: "#9CA3AF",
            }}>
              Random Cosmetica 30%
            </div>
          </>
        ) : pack.id === "rustaagh_pack" ? (
          <>
            <div style={{
              padding: "4px 12px", borderRadius: 9999,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(159,168,218,0.3)",
              fontSize: 12, fontWeight: 700,
              color: "#9CA8DA",
            }}>
              Rustaagh 😌 30%
            </div>
            <div style={{
              padding: "4px 12px", borderRadius: 9999,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
              fontSize: 12, fontWeight: 700,
              color: "#9CA3AF",
            }}>
              Random Items 70%
            </div>
          </>
        ) : pack.id === "mascotte_pack" ? (
          <>
            <div style={{
              padding: "4px 12px", borderRadius: 9999,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(245,158,11,0.3)",
              fontSize: 12, fontWeight: 700,
              color: "#FBBF24",
            }}>
              Legendary 20%
            </div>
            <div style={{
              padding: "4px 12px", borderRadius: 9999,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(168,85,247,0.3)",
              fontSize: 12, fontWeight: 700,
              color: "#C084FC",
            }}>
              Epic 35%
            </div>
            <div style={{
              padding: "4px 12px", borderRadius: 9999,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(59,130,246,0.3)",
              fontSize: 12, fontWeight: 700,
              color: "#60A5FA",
            }}>
              Rare 45%
            </div>
          </>
        ) : pack.id === "roulette_pack" ? (
          <>
            <div style={{
              padding: "4px 12px", borderRadius: 9999,
              background: "rgba(34,197,94,0.15)",
              border: "1px solid rgba(34,197,94,0.5)",
              fontSize: 12, fontWeight: 700,
              color: "#4ADE80",
            }}>
              WIN 50% 🎉
            </div>
            <div style={{
              padding: "4px 12px", borderRadius: 9999,
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.5)",
              fontSize: 12, fontWeight: 700,
              color: "#FCA5A5",
            }}>
              LOSE 50% 💔
            </div>
          </>
        ) : (
          Object.entries(pack.rarityPool).map(([r, w]) => {
            const total = Object.values(pack.rarityPool).reduce((a, b) => a + b, 0);
            const pct = Math.round((w / total) * 100);
            const meta = RARITY_META[r as keyof typeof RARITY_META] ?? { color: "#9CA3AF", label: r };
            return (
              <div key={r} style={{
                padding: "4px 12px", borderRadius: 9999,
                background: "rgba(255,255,255,0.05)",
                border: `1px solid rgba(255,255,255,0.10)`,
                fontSize: 12, fontWeight: 700,
                color: meta.color,
              }}>
                {meta.label} {pct}%
              </div>
            );
          })
        )}
      </div>

      {/* Open button */}
      <button
        onClick={openPack}
        style={{
          padding: "18px 48px", borderRadius: 20,
          background: "linear-gradient(135deg, #78350F 0%, #B45309 25%, #D97706 50%, #FBBF24 70%, #D97706 100%)",
          color: "#fff", fontWeight: 900, fontSize: 18,
          letterSpacing: "0.04em", border: "none", cursor: "pointer",
          boxShadow: "0 4px 24px rgba(245,158,11,0.45), inset 0 1px 0 rgba(255,255,255,0.15)",
          animation: "pulseBtn 2.4s ease-in-out infinite",
        }}
      >
        Open Pack 🎁
      </button>

      <button
        onClick={onReset}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#6B7280", fontSize: 13, fontWeight: 600,
        }}
      >
        ← Terug
      </button>
    </div>
  );
}
