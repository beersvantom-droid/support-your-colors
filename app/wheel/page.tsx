"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Cosmetic } from "@/lib/cosmetics";

// ─── Types ────────────────────────────────────────────────────────────────────

type WheelRarity = "common" | "rare" | "epic" | "legendary" | "mascots";

type RewardState =
  | { status: "loading" }
  | { status: "granted"; cosmetic: Cosmetic }
  | { status: "all_owned" }
  | { status: "powerup" }
  | { status: "error" };

interface Segment { rarity: WheelRarity }

// ─── Segments — 16 balanced ───────────────────────────────────────────────────

const SEGMENTS: Segment[] = [
  { rarity: "common"    }, // 0
  { rarity: "rare"      }, // 1
  { rarity: "common"    }, // 2
  { rarity: "rare"      }, // 3
  { rarity: "common"    }, // 4
  { rarity: "epic"      }, // 5
  { rarity: "common"    }, // 6
  { rarity: "legendary" }, // 7
  { rarity: "common"    }, // 8
  { rarity: "rare"      }, // 9
  { rarity: "common"    }, // 10
  { rarity: "rare"      }, // 11
  { rarity: "common"    }, // 12
  { rarity: "epic"      }, // 13
  { rarity: "common"    }, // 14
  { rarity: "mascots"   }, // 15
];

// ─── Premium rarity config ────────────────────────────────────────────────────

const RARITY_CONFIG = {
  common: {
    fillInner: "#060810", fillMid: "#0D1520", fillOuter: "#182535",
    accent: "#7890A8", glow: "#4A6080", glowRgb: "74,96,128", spotRgb: "100,130,165",
    resultBg: "rgba(3,5,10,0.97)", flavorText: "A solid pull.",
  },
  rare: {
    fillInner: "#020410", fillMid: "#050F32", fillOuter: "#0C1A68",
    accent: "#60A5FA", glow: "#3B82F6", glowRgb: "59,130,246", spotRgb: "80,160,255",
    resultBg: "rgba(1,3,14,0.97)", flavorText: "Nice pull!",
  },
  epic: {
    fillInner: "#030008", fillMid: "#0E0030", fillOuter: "#28087A",
    accent: "#C084FC", glow: "#A855F7", glowRgb: "168,85,247", spotRgb: "180,100,255",
    resultBg: "rgba(3,1,10,0.97)", flavorText: "EPIC!",
  },
  legendary: {
    fillInner: "#0A0300", fillMid: "#220B00", fillOuter: "#4A1A00",
    accent: "#FBBF24", glow: "#F59E0B", glowRgb: "245,158,11", spotRgb: "255,185,40",
    resultBg: "rgba(8,3,0,0.97)", flavorText: "LEGENDARY PULL!",
  },
  mascots: {
    fillInner: "#0A0000", fillMid: "#200000", fillOuter: "#480000",
    accent: "#FCA5A5", glow: "#EF4444", glowRgb: "239,68,68", spotRgb: "255,80,80",
    resultBg: "rgba(8,1,1,0.97)", flavorText: "MASCOT UNLOCKED!",
  },
} as const;

// ─── Probabilities ────────────────────────────────────────────────────────────

function pickResultIndex(): number {
  const roll = Math.random();
  const byRarity: Record<WheelRarity, number[]> = {
    common: [], rare: [], epic: [], legendary: [], mascots: [],
  };
  SEGMENTS.forEach((s, i) => byRarity[s.rarity].push(i));
  let pool: number[];
  if      (roll < 0.10) pool = byRarity.mascots;
  else if (roll < 0.15) pool = byRarity.legendary;
  else if (roll < 0.25) pool = byRarity.epic;
  else if (roll < 0.52) pool = byRarity.rare;
  else                  pool = byRarity.common;
  if (!pool.length) pool = byRarity.common;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Easing ───────────────────────────────────────────────────────────────────

function spinEase(t: number, rarity: WheelRarity): number {
  if (rarity === "legendary" || rarity === "mascots") {
    if (t < 0.60) return (1 - Math.pow(1 - t / 0.60, 3)) * 0.78;
    const u = (t - 0.60) / 0.40;
    return 0.78 + Math.pow(u, 0.30) * 0.22;
  }
  if (rarity === "epic") {
    if (t < 0.66) return (1 - Math.pow(1 - t / 0.66, 3)) * 0.82;
    const u = (t - 0.66) / 0.34;
    return 0.82 + (1 - Math.pow(1 - u, 5)) * 0.18;
  }
  if (t < 0.72) return (1 - Math.pow(1 - t / 0.72, 3)) * 0.85;
  const u = (t - 0.72) / 0.28;
  return 0.85 + (1 - Math.pow(1 - u, 4)) * 0.15;
}

const SPIN_PARAMS: Record<WheelRarity, { spins: [number, number]; duration: [number, number] }> = {
  legendary: { spins: [10, 12], duration: [7500, 9000] },
  mascots:   { spins: [9,  11], duration: [7000, 8500] },
  epic:      { spins: [8,  10], duration: [6200, 7500] },
  rare:      { spins: [6,  8],  duration: [5300, 6300] },
  common:    { spins: [5,  7],  duration: [4500, 5500] },
};

function rand(min: number, max: number) { return min + Math.random() * (max - min); }

// ─── Canvas helpers ───────────────────────────────────────────────────────────

function starPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, outer: number, inner: number, pts: number) {
  const step = Math.PI / pts;
  ctx.beginPath();
  for (let i = 0; i < 2 * pts; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = i * step - Math.PI / 2;
    i === 0 ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
            : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  ctx.closePath();
}

function diamondPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number) {
  ctx.beginPath();
  ctx.moveTo(cx,     cy - h);
  ctx.lineTo(cx + w, cy);
  ctx.lineTo(cx,     cy + h);
  ctx.lineTo(cx - w, cy);
  ctx.closePath();
}

function lightningPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.25,  cy - s);
  ctx.lineTo(cx - s * 0.08,  cy - s * 0.05);
  ctx.lineTo(cx + s * 0.18,  cy - s * 0.05);
  ctx.lineTo(cx - s * 0.25,  cy + s);
  ctx.lineTo(cx + s * 0.04,  cy + s * 0.08);
  ctx.lineTo(cx - s * 0.16,  cy + s * 0.08);
  ctx.closePath();
}

// ─── drawWheel — premium AAA quality ─────────────────────────────────────────

function drawWheel(canvas: HTMLCanvasElement, size: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const n   = SEGMENTS.length;
  const cx  = size / 2;
  const cy  = size / 2;
  const r   = size / 2 - 8;
  const SEG = (Math.PI * 2) / n;

  ctx.clearRect(0, 0, size, size);

  // ── 1. Segment base fills — deep multi-stop radial gradients ──────────────

  for (let i = 0; i < n; i++) {
    const cfg = RARITY_CONFIG[SEGMENTS[i].rarity];
    const a0  = i * SEG - Math.PI / 2;
    const a1  = a0 + SEG;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, a0, a1);
    ctx.closePath();
    ctx.clip();

    const grd = ctx.createRadialGradient(cx, cy, r * 0.04, cx, cy, r);
    grd.addColorStop(0,    cfg.fillInner);
    grd.addColorStop(0.20, cfg.fillMid);
    grd.addColorStop(0.50, cfg.fillOuter);
    grd.addColorStop(0.75, cfg.fillMid);
    grd.addColorStop(1,    cfg.fillInner);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, size, size);

    ctx.restore();
  }

  // ── 2. Volumetric spotlight cones on rare+ segments ───────────────────────
  // Simulates a light source hitting the outer face of each premium segment

  for (let i = 0; i < n; i++) {
    const seg = SEGMENTS[i];
    if (seg.rarity === "common") continue;
    const cfg = RARITY_CONFIG[seg.rarity];
    const a0  = i * SEG - Math.PI / 2;
    const a1  = a0 + SEG;
    const mid = (a0 + a1) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, a0, a1);
    ctx.closePath();
    ctx.clip();

    const lx   = cx + Math.cos(mid) * r * 0.80;
    const ly   = cy + Math.sin(mid) * r * 0.80;
    const cone = ctx.createRadialGradient(lx, ly, 0, lx, ly, r * 0.58);
    const alpha = seg.rarity === "legendary" ? 0.32
                : seg.rarity === "epic"      ? 0.26
                : 0.20;
    cone.addColorStop(0,    `rgba(${cfg.spotRgb},${alpha})`);
    cone.addColorStop(0.45, `rgba(${cfg.spotRgb},${(alpha * 0.35).toFixed(2)})`);
    cone.addColorStop(1,    `rgba(${cfg.spotRgb},0)`);
    ctx.fillStyle = cone;
    ctx.fillRect(0, 0, size, size);

    ctx.restore();
  }

  // ── 3. Alternating depth tint ─────────────────────────────────────────────

  for (let i = 0; i < n; i++) {
    if (i % 2 !== 0) continue;
    const a0 = i * SEG - Math.PI / 2;
    const a1 = a0 + SEG;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, a0, a1);
    ctx.closePath();
    ctx.fillStyle = "rgba(0,0,0,0.14)";
    ctx.fill();
    ctx.restore();
  }

  // ── 4. Edge rim-light arcs on rare+ segments ──────────────────────────────

  for (let i = 0; i < n; i++) {
    const seg = SEGMENTS[i];
    if (seg.rarity === "common") continue;
    const cfg = RARITY_CONFIG[seg.rarity];
    const a0  = i * SEG - Math.PI / 2;
    const a1  = a0 + SEG;

    ctx.save();
    ctx.shadowColor = cfg.glow;
    ctx.shadowBlur  = size * 0.025;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 17, a0 + SEG * 0.07, a1 - SEG * 0.07);
    const edgeAlpha = seg.rarity === "legendary" ? 0.70
                    : seg.rarity === "epic"      ? 0.60
                    : 0.50;
    ctx.strokeStyle = `rgba(${cfg.spotRgb},${edgeAlpha})`;
    ctx.lineWidth   = seg.rarity === "legendary" ? 2.8 : seg.rarity === "epic" ? 2.2 : 1.8;
    ctx.stroke();
    ctx.restore();
  }

  // ── 5. Divider lines — gradient fade from center ──────────────────────────

  for (let i = 0; i < n; i++) {
    const angle  = i * SEG - Math.PI / 2;
    const innerR = r * 0.16;
    const dx0    = cx + Math.cos(angle) * innerR;
    const dy0    = cy + Math.sin(angle) * innerR;
    const dx1    = cx + Math.cos(angle) * r;
    const dy1    = cy + Math.sin(angle) * r;

    const divGrd = ctx.createLinearGradient(dx0, dy0, dx1, dy1);
    divGrd.addColorStop(0,    "rgba(255,255,255,0)");
    divGrd.addColorStop(0.12, "rgba(255,255,255,0.20)");
    divGrd.addColorStop(0.88, "rgba(255,255,255,0.20)");
    divGrd.addColorStop(1,    "rgba(255,255,255,0.05)");

    ctx.beginPath();
    ctx.moveTo(dx0, dy0);
    ctx.lineTo(dx1, dy1);
    ctx.strokeStyle = divGrd;
    ctx.lineWidth   = 1;
    ctx.stroke();
  }

  // ── 6. Geometric symbols — no text, shapes only ───────────────────────────

  for (let i = 0; i < n; i++) {
    const seg = SEGMENTS[i];
    const cfg = RARITY_CONFIG[seg.rarity];
    const mid = (i + 0.5) * SEG - Math.PI / 2;
    const symR = r * 0.70;
    const sx   = cx + Math.cos(mid) * symR;
    const sy   = cy + Math.sin(mid) * symR;
    const s    = size * 0.033;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(mid + Math.PI / 2);

    ctx.save();
    ctx.shadowColor = cfg.glow;
    ctx.shadowBlur  = size * (
      seg.rarity === "legendary" ? 0.055 :
      seg.rarity === "epic"      ? 0.045 :
      seg.rarity === "rare"      ? 0.032 :
      seg.rarity === "powerup"   ? 0.040 :
      0.015
    );

    if (seg.rarity === "common") {
      diamondPath(ctx, 0, 0, s * 0.48, s * 0.68);
      ctx.strokeStyle = `rgba(${cfg.spotRgb},0.40)`;
      ctx.lineWidth   = 1;
      ctx.stroke();

    } else if (seg.rarity === "rare") {
      diamondPath(ctx, 0, 0, s * 0.72, s * 1.02);
      const dg = ctx.createRadialGradient(-s * 0.22, -s * 0.32, 0, 0, 0, s * 1.1);
      dg.addColorStop(0,   "#B8D8FF");
      dg.addColorStop(0.4, "#4090F0");
      dg.addColorStop(1,   "#0A28A0");
      ctx.fillStyle = dg;
      ctx.fill();
      ctx.strokeStyle = "rgba(147,197,253,0.50)";
      ctx.lineWidth   = 0.8;
      ctx.stroke();

    } else if (seg.rarity === "epic") {
      starPath(ctx, 0, 0, s * 1.08, s * 0.30, 4);
      const sg = ctx.createRadialGradient(-s * 0.22, -s * 0.40, 0, 0, 0, s * 1.1);
      sg.addColorStop(0,   "#F5E8FF");
      sg.addColorStop(0.3, "#D080FF");
      sg.addColorStop(1,   "#4A0A90");
      ctx.fillStyle = sg;
      ctx.fill();
      ctx.strokeStyle = "rgba(200,140,255,0.45)";
      ctx.lineWidth   = 0.8;
      ctx.stroke();

    } else if (seg.rarity === "legendary") {
      const ls = s * 1.28;
      starPath(ctx, 0, 0, ls, ls * 0.44, 5);
      const lg = ctx.createRadialGradient(-ls * 0.26, -ls * 0.40, 0, 0, 0, ls * 1.1);
      lg.addColorStop(0,    "#FFFDE0");
      lg.addColorStop(0.25, "#FCD34D");
      lg.addColorStop(0.60, "#D97706");
      lg.addColorStop(1,    "#7C2D12");
      ctx.fillStyle = lg;
      ctx.fill();
      ctx.strokeStyle = "rgba(252,211,77,0.65)";
      ctx.lineWidth   = 1;
      ctx.stroke();

    } else if (seg.rarity === "mascots") {
      const ms = s * 1.18;
      const mg = ctx.createRadialGradient(-ms * 0.22, -ms * 0.40, 0, 0, 0, ms * 1.1);
      mg.addColorStop(0,   "#FFE8E8");
      mg.addColorStop(0.3, "#EF4444");
      mg.addColorStop(1,   "#7F1D1D");
      diamondPath(ctx, 0, 0, ms * 0.72, ms * 1.02);
      ctx.fillStyle = mg;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,160,160,0.60)";
      ctx.lineWidth   = 0.8;
      ctx.stroke();
    }

    ctx.restore();
    ctx.restore();
  }

  // ── 7. Globe glass overlay — 3D sphere look ───────────────────────────────

  const glass = ctx.createRadialGradient(cx * 0.38, cy * 0.34, 0, cx, cy, r);
  glass.addColorStop(0,    "rgba(255,255,255,0.20)");
  glass.addColorStop(0.18, "rgba(255,255,255,0.08)");
  glass.addColorStop(0.52, "rgba(0,0,0,0)");
  glass.addColorStop(0.82, "rgba(0,0,0,0.08)");
  glass.addColorStop(1,    "rgba(0,0,0,0.32)");
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = glass;
  ctx.fill();

  // ── 8. Outer rim — multi-layer chrome & gold ──────────────────────────────

  // Deep outer shadow
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(0,0,0,0.90)";
  ctx.lineWidth   = 14;
  ctx.stroke();

  // Dark chrome band
  ctx.beginPath();
  ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(15,15,15,0.95)";
  ctx.lineWidth   = 7;
  ctx.stroke();

  // Primary gold band
  const goldRim = ctx.createLinearGradient(0, 0, size, size);
  goldRim.addColorStop(0.00, "#A07010");
  goldRim.addColorStop(0.10, "#FFD700");
  goldRim.addColorStop(0.22, "#C8A020");
  goldRim.addColorStop(0.35, "#FFE44A");
  goldRim.addColorStop(0.50, "#A07010");
  goldRim.addColorStop(0.62, "#FFD700");
  goldRim.addColorStop(0.75, "#C8A020");
  goldRim.addColorStop(0.88, "#FFE44A");
  goldRim.addColorStop(1.00, "#A07010");
  ctx.beginPath();
  ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
  ctx.strokeStyle = goldRim;
  ctx.lineWidth   = 7;
  ctx.stroke();

  // Inner bevel highlight
  ctx.beginPath();
  ctx.arc(cx, cy, r - 10, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,240,180,0.32)";
  ctx.lineWidth   = 1.5;
  ctx.stroke();

  // Inner groove shadow
  ctx.beginPath();
  ctx.arc(cx, cy, r - 14, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(0,0,0,0.60)";
  ctx.lineWidth   = 3;
  ctx.stroke();

  // Top specular highlight on rim
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r - 4, Math.PI * 1.22, Math.PI * 1.78);
  const topSpec = ctx.createLinearGradient(cx - r * 0.5, cy - r, cx + r * 0.5, cy - r);
  topSpec.addColorStop(0,   "rgba(255,255,200,0)");
  topSpec.addColorStop(0.5, "rgba(255,255,200,0.70)");
  topSpec.addColorStop(1,   "rgba(255,255,200,0)");
  ctx.strokeStyle = topSpec;
  ctx.lineWidth   = 3.5;
  ctx.stroke();
  ctx.restore();

  // ── 9. Gold pip bulbs at every divider ────────────────────────────────────

  for (let i = 0; i < n; i++) {
    const angle = i * SEG - Math.PI / 2;
    const dx    = cx + Math.cos(angle) * (r - 2);
    const dy    = cy + Math.sin(angle) * (r - 2);
    const pr    = size * 0.019;

    ctx.save();
    ctx.shadowColor = "rgba(255,215,50,0.92)";
    ctx.shadowBlur  = size * 0.034;

    const pg = ctx.createRadialGradient(
      dx - pr * 0.40, dy - pr * 0.40, 0,
      dx,             dy,             pr
    );
    pg.addColorStop(0,    "#FFFFF0");
    pg.addColorStop(0.28, "#FFD700");
    pg.addColorStop(0.60, "#D97706");
    pg.addColorStop(0.82, "#92400E");
    pg.addColorStop(1,    "#3A1500");
    ctx.beginPath();
    ctx.arc(dx, dy, pr, 0, Math.PI * 2);
    ctx.fillStyle = pg;
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(dx - pr * 0.32, dy - pr * 0.32, pr * 0.34, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fill();

    ctx.restore();
  }

  // ── 10. Hub — championship trophy medallion ───────────────────────────────

  const hr = r * 0.148;

  // Aura glow
  ctx.save();
  ctx.shadowColor = "rgba(245,158,11,0.80)";
  ctx.shadowBlur  = size * 0.09;
  ctx.beginPath();
  ctx.arc(cx, cy, hr + 4, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(245,158,11,0.10)";
  ctx.fill();
  ctx.restore();

  // Outer decorative ring
  ctx.beginPath();
  ctx.arc(cx, cy, hr + 2, 0, Math.PI * 2);
  const outerRing = ctx.createLinearGradient(cx - hr, cy - hr, cx + hr, cy + hr);
  outerRing.addColorStop(0,   "#1E0E00");
  outerRing.addColorStop(0.4, "#6A4400");
  outerRing.addColorStop(1,   "#1E0E00");
  ctx.fillStyle = outerRing;
  ctx.fill();

  // Outer ring border
  const hubRimGrd = ctx.createLinearGradient(cx - hr, cy - hr, cx + hr, cy + hr);
  hubRimGrd.addColorStop(0,    "#B8860B");
  hubRimGrd.addColorStop(0.25, "#FFD700");
  hubRimGrd.addColorStop(0.5,  "#A07010");
  hubRimGrd.addColorStop(0.75, "#FFD700");
  hubRimGrd.addColorStop(1,    "#B8860B");
  ctx.beginPath();
  ctx.arc(cx, cy, hr + 2, 0, Math.PI * 2);
  ctx.strokeStyle = hubRimGrd;
  ctx.lineWidth   = 3;
  ctx.stroke();

  // Main body
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.95)";
  ctx.shadowBlur  = size * 0.065;
  const hubGrd = ctx.createRadialGradient(cx - hr * 0.32, cy - hr * 0.32, 0, cx, cy, hr);
  hubGrd.addColorStop(0,    "#FFF8DC");
  hubGrd.addColorStop(0.20, "#FCD34D");
  hubGrd.addColorStop(0.48, "#D97706");
  hubGrd.addColorStop(0.78, "#92400E");
  hubGrd.addColorStop(1,    "#1C0600");
  ctx.beginPath();
  ctx.arc(cx, cy, hr, 0, Math.PI * 2);
  ctx.fillStyle = hubGrd;
  ctx.fill();
  ctx.restore();

  // Engraving tick marks around hub
  const tickCount = 24;
  ctx.save();
  for (let j = 0; j < tickCount; j++) {
    const a   = (j / tickCount) * Math.PI * 2;
    const t0  = hr * 0.84;
    const t1  = hr * (j % 3 === 0 ? 0.96 : 0.91);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * t0, cy + Math.sin(a) * t0);
    ctx.lineTo(cx + Math.cos(a) * t1, cy + Math.sin(a) * t1);
    ctx.strokeStyle = j % 3 === 0 ? "rgba(255,220,80,0.55)" : "rgba(255,220,80,0.22)";
    ctx.lineWidth   = j % 3 === 0 ? 1.4 : 0.7;
    ctx.stroke();
  }
  ctx.restore();

  // Inner dark field
  const innerR = hr * 0.60;
  const innerGrd = ctx.createRadialGradient(cx - innerR * 0.28, cy - innerR * 0.28, 0, cx, cy, innerR);
  innerGrd.addColorStop(0, "#2A1408");
  innerGrd.addColorStop(1, "#060200");
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fillStyle = innerGrd;
  ctx.fill();

  // Center star emblem
  ctx.save();
  ctx.shadowColor = "rgba(245,158,11,0.85)";
  ctx.shadowBlur  = hr * 0.45;
  const embS = innerR * 0.70;
  starPath(ctx, cx, cy, embS, embS * 0.44, 5);
  const embGrd = ctx.createRadialGradient(cx - embS * 0.22, cy - embS * 0.32, 0, cx, cy, embS);
  embGrd.addColorStop(0,   "#FFFDE8");
  embGrd.addColorStop(0.4, "#FCD34D");
  embGrd.addColorStop(1,   "#B45309");
  ctx.fillStyle = embGrd;
  ctx.fill();
  ctx.restore();

  // Hub specular highlight
  const hubSpec = ctx.createRadialGradient(cx - hr * 0.34, cy - hr * 0.34, 0, cx, cy, hr * 0.75);
  hubSpec.addColorStop(0, "rgba(255,255,255,0.55)");
  hubSpec.addColorStop(0.4, "rgba(255,255,255,0.14)");
  hubSpec.addColorStop(1, "rgba(255,255,255,0)");
  ctx.beginPath();
  ctx.arc(cx, cy, hr, 0, Math.PI * 2);
  ctx.fillStyle = hubSpec;
  ctx.fill();
}

// ─── Stadium background ───────────────────────────────────────────────────────

const BEAM_CONFIGS = [
  { left: "7%",  rotate: -30, dur: 9,  delay: 0,   opacity: 0.075, width: 260 },
  { left: "22%", rotate: -10, dur: 11, delay: 2.3, opacity: 0.055, width: 200 },
  { left: "50%", rotate: 0,   dur: 13, delay: 1.0, opacity: 0.040, width: 180 },
  { left: "78%", rotate: 10,  dur: 10, delay: 3.2, opacity: 0.055, width: 200 },
  { left: "93%", rotate: 30,  dur: 8,  delay: 1.8, opacity: 0.075, width: 260 },
];

const FLOODLIGHT_POSITIONS = [
  { x: "7%",  y: "9%" },
  { x: "93%", y: "9%" },
  { x: "22%", y: "6%" },
  { x: "78%", y: "6%" },
];

const WC_FLAGS_ROW1 = ["🇧🇷","🇦🇷","🇫🇷","🇩🇪","🇪🇸","🇵🇹","🇬🇧","🇳🇱","🇧🇪","🇺🇸","🇲🇽","🇨🇦","🇯🇵","🇰🇷","🇲🇦","🇸🇳","🇳🇬","🇺🇾","🇨🇭","🇭🇷","🇵🇱","🇩🇰","🇸🇪","🇦🇺"];
const WC_FLAGS_ROW2 = ["🇨🇴","🇪🇨","🇬🇭","🇨🇲","🇮🇷","🇸🇦","🇦🇹","🇨🇿","🇭🇺","🇷🇴","🇷🇸","🇨🇳","🇯🇲","🇵🇦","🇵🇾","🇹🇳","🇩🇿","🇪🇬","🇿🇦","🇻🇪","🇳🇴","🇫🇮","🇸🇰","🇬🇷"];

function FlagRow({ flags, topPx, droop, phaseOffset }: { flags: string[]; topPx: number; droop: number; phaseOffset: number }) {
  const n = flags.length;
  const pts = flags.map((_, i) => {
    const t = i / (n - 1);
    return { x: 2 + t * 96, y: droop * 4 * t * (1 - t) };
  });
  const svgH = droop + 8;
  return (
    <div className="absolute left-0 right-0 pointer-events-none" style={{ top: topPx, height: svgH + 22, zIndex: 2 }}>
      <svg className="absolute top-0 left-0 w-full" style={{ height: svgH }} viewBox={`0 0 100 ${svgH}`} preserveAspectRatio="none">
        <polyline
          points={pts.map(p => `${p.x},${p.y + 4}`).join(" ")}
          fill="none"
          stroke="rgba(200,165,60,0.22)"
          strokeWidth="0.6"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {flags.map((flag, i) => {
        const t = i / (n - 1);
        return (
          <div key={i} style={{
            position: "absolute",
            left: `${2 + t * 96}%`,
            top: pts[i].y + 6,
            transform: "translateX(-50%)",
          }}>
            <span style={{
              display: "block",
              fontSize: 13,
              lineHeight: 1,
              userSelect: "none",
              opacity: 0.82,
              animation: `flagWave ${2.4 + (i % 4) * 0.55}s ${((i * 0.18 + phaseOffset) % 2.8).toFixed(2)}s ease-in-out infinite`,
            }}>
              {flag}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function FlagSlingers() {
  return (
    <>
      <FlagRow flags={WC_FLAGS_ROW1} topPx={10}  droop={20} phaseOffset={0}   />
      <FlagRow flags={WC_FLAGS_ROW2} topPx={40}  droop={16} phaseOffset={1.1} />
    </>
  );
}

function BackgroundConfetti() {
  const pieces = useMemo(() =>
    Array.from({ length: 42 }, (_, i) => ({
      id:      i,
      left:    `${2 + Math.random() * 96}%`,
      top:     `${-5 - Math.random() * 25}%`,
      color:   ["#DC2626","#EF4444","#B91C1C","#16A34A","#22C55E","#15803D","#2563EB","#3B82F6","#1D4ED8"][Math.floor(Math.random() * 9)],
      width:   4 + Math.random() * 6,
      height:  3 + Math.random() * 4,
      dur:     12 + Math.random() * 8,
      delay:   -(Math.random() * 18),
      rounded: Math.random() > 0.5,
    })), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {pieces.map(p => (
        <div key={p.id} suppressHydrationWarning style={{
          position:     "absolute",
          left:         p.left,
          top:          p.top,
          width:        p.width,
          height:       p.height,
          borderRadius: p.rounded ? "50%" : "1px",
          background:   p.color,
          opacity:      0.52,
          animation:    `bgConfettiDrift ${p.dur}s ${p.delay}s linear infinite`,
        }} />
      ))}
    </div>
  );
}

function StadiumFloor() {
  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden" style={{ height: "20%", zIndex: 1 }}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {[15, 28, 42, 58, 72, 85].map((x, i) => (
          <line key={i} x1={x} y1="0" x2="50" y2="100"
            stroke="rgba(200,160,40,0.055)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
        ))}
        {[30, 60].map((y, i) => (
          <line key={i} x1="0" y1={y} x2="100" y2={y}
            stroke="rgba(200,160,40,0.04)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="absolute inset-0" style={{
        background: "linear-gradient(to bottom, rgba(175,130,22,0.07) 0%, transparent 100%)",
      }} />
      {/* Trophy silhouettes */}
      <div className="absolute" style={{ left: "5%",  bottom: "22%", fontSize: 30, opacity: 0.045, filter: "grayscale(1) brightness(4)", userSelect: "none" }}>🏆</div>
      <div className="absolute" style={{ right: "5%", bottom: "22%", fontSize: 30, opacity: 0.045, filter: "grayscale(1) brightness(4)", userSelect: "none" }}>🏆</div>
    </div>
  );
}

function StadiumBackground({ spinning }: { spinning: boolean }) {
  const particles = useMemo(() =>
    Array.from({ length: 26 }, (_, i) => ({
      id:    i,
      left:  `${3 + Math.random() * 94}%`,
      top:   `${5 + Math.random() * 90}%`,
      size:  1 + Math.random() * 2.5,
      dur:   8 + Math.random() * 12,
      delay: Math.random() * 10,
    })), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Base deep navy */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse at 50% 30%, #08122A 0%, #040810 55%, #020508 100%)",
      }} />

      {/* Stadium arch rings */}
      {[0, 1, 2].map(i => (
        <div key={i} className="absolute" style={{
          left:         `${12 + i * 9}%`,
          right:        `${12 + i * 9}%`,
          top:          `${-12 - i * 18}%`,
          height:       `${70 + i * 14}%`,
          border:       `1px solid rgba(200,160,40,${(0.045 - i * 0.012).toFixed(3)})`,
          borderRadius: "0 0 50% 50%",
        }} />
      ))}

      {/* Floodlight point sources */}
      {FLOODLIGHT_POSITIONS.map((pos, i) => (
        <div key={i} style={{
          position:     "absolute",
          left:         pos.x, top: pos.y,
          width:        6, height: 6,
          borderRadius: "50%",
          background:   "rgba(255,245,200,0.95)",
          boxShadow:    "0 0 12px rgba(255,245,200,0.90), 0 0 44px rgba(220,190,80,0.55), 0 0 88px rgba(180,140,40,0.25)",
          transform:    "translate(-50%, -50%)",
          animation:    `floodPulse ${3.2 + i * 0.65}s ${i * 0.5}s ease-in-out infinite`,
        }} />
      ))}

      {/* Light beams from floodlights */}
      {BEAM_CONFIGS.map((b, i) => (
        <div key={i} className="absolute top-0" style={{
          left:            b.left,
          width:           b.width,
          height:          "100%",
          transformOrigin: "top center",
          transform:       `translateX(-50%) rotate(${b.rotate}deg)`,
          background:      `linear-gradient(to bottom, rgba(195,155,35,${b.opacity}) 0%, rgba(195,155,35,${(b.opacity * 0.32).toFixed(3)}) 42%, transparent 80%)`,
          animation:       `beamPulse ${b.dur}s ${b.delay}s ease-in-out infinite`,
          opacity:         spinning ? 0.72 : 1,
          transition:      "opacity 0.9s ease",
        }} />
      ))}

      {/* Crowd side glow */}
      <div className="absolute inset-y-0 left-0" style={{
        width: "16%",
        background: "linear-gradient(to right, rgba(140,100,20,0.09) 0%, transparent 100%)",
      }} />
      <div className="absolute inset-y-0 right-0" style={{
        width: "16%",
        background: "linear-gradient(to left, rgba(140,100,20,0.09) 0%, transparent 100%)",
      }} />

      {/* Warm golden center glow */}
      <div className="absolute" style={{
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "72vw", height: "72vw",
        maxWidth: "520px", maxHeight: "520px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(170,115,15,0.12) 0%, transparent 65%)",
        filter: "blur(30px)",
      }} />

      {/* World Cup flag slingers */}
      <FlagSlingers />

      {/* Background confetti — red / green / blue only */}
      <BackgroundConfetti />

      {/* Stadium floor with perspective grid + trophies */}
      <StadiumFloor />

      {/* Ambient floating particles */}
      {particles.map(p => (
        <div key={p.id} suppressHydrationWarning style={{
          position:     "absolute",
          left:         p.left,
          top:          p.top,
          width:        p.size,
          height:       p.size,
          borderRadius: "50%",
          background:   "rgba(200,170,65,0.28)",
          animation:    `particleFloat ${p.dur}s ${p.delay}s ease-in-out infinite`,
        }} />
      ))}

      {/* Vignette */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)",
      }} />
    </div>
  );
}

// ─── Reveal effects ───────────────────────────────────────────────────────────

function CommonReveal() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse at 50% 60%, rgba(80,110,150,0.22) 0%, transparent 55%)",
        animation: "rareBg 0.5s ease-out both",
      }} />
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} className="absolute" style={{
          top: "50%", left: "50%",
          width: 3, height: 3,
          borderRadius: "50%",
          background: "#AAC0D8",
          transform: `rotate(${i * 30}deg) translateY(-${40 + Math.random() * 30}px)`,
          animation: `sparkleOut 0.7s ${i * 0.04}s ease-out both`,
          boxShadow: "0 0 6px rgba(170,192,216,0.8)",
        }} />
      ))}
    </div>
  );
}

function RareReveal() {
  return (
    <>
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse at 50% 65%, rgba(20,60,200,0.38) 0%, rgba(8,24,90,0.20) 40%, transparent 68%)",
        animation: "rareBg 0.55s ease-out both",
      }} />
      {/* Blue spotlight beam from top */}
      <div style={{
        position: "absolute", top: 0, left: "50%",
        transform: "translateX(-50%)",
        width: "280px", height: "60%",
        background: "linear-gradient(to bottom, rgba(59,130,246,0.26) 0%, transparent 100%)",
        clipPath: "polygon(32% 0%, 68% 0%, 92% 100%, 8% 100%)",
        animation: "rayExpand 0.8s ease-out both",
      }} />
      {/* Scan line */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: "80vw", height: "1px",
        maxWidth: "500px",
        background: "linear-gradient(to right, transparent, rgba(59,130,246,0.50), transparent)",
        animation: "scanLine 0.5s 0.2s ease-out both",
      }} />
      {[0, 0.22].map((delay, i) => (
        <div key={i} className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div style={{
            width: "50vw", height: "50vw",
            maxWidth: "380px", maxHeight: "380px",
            borderRadius: "50%",
            border: `${2 - i * 0.5}px solid rgba(59,130,246,${0.55 - i * 0.22})`,
            animation: `ringExpand 1.2s ${delay}s ease-out forwards`,
          }} />
        </div>
      ))}
    </>
  );
}

function EpicReveal() {
  return (
    <>
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse at 50% 65%, rgba(90,10,180,0.48) 0%, rgba(40,4,90,0.28) 38%, transparent 68%)",
        animation: "epicBg 0.5s ease-out both",
      }} />
      {/* Smoke layers */}
      {[0, 0.15, 0.30].map((delay, i) => (
        <div key={i} style={{
          position: "absolute",
          bottom: `${15 + i * 8}%`,
          left: `${20 - i * 5}%`,
          right: `${20 - i * 5}%`,
          height: "40%",
          background: `radial-gradient(ellipse at 50% 100%, rgba(100,20,180,${0.12 - i * 0.03}) 0%, transparent 70%)`,
          filter: "blur(22px)",
          animation: `smokeRise ${1.8 + i * 0.4}s ${delay}s ease-out both`,
        }} />
      ))}
      {[0, 0.18, 0.36].map((delay, i) => (
        <div key={i} className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div style={{
            width: "52vw", height: "52vw",
            maxWidth: "400px", maxHeight: "400px",
            borderRadius: "50%",
            border: `${2.2 - i * 0.5}px solid rgba(168,85,247,${0.65 - i * 0.22})`,
            animation: `ringExpand 1.3s ${delay}s ease-out forwards`,
          }} />
        </div>
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{
          transform: `rotate(${i * 45 + 22}deg)`,
        }}>
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            width: "1.5px", height: "42vw", maxHeight: "320px",
            transformOrigin: "top center",
            transform: "translateX(-50%)",
            background: "linear-gradient(to bottom, rgba(200,150,255,0.65) 0%, transparent 100%)",
            animation: `rayExpand 0.65s ${i * 0.06}s ease-out both`,
          }} />
        </div>
      ))}
    </>
  );
}

function LegendaryReveal() {
  return (
    <>
      {/* Initial white flash */}
      <div className="absolute inset-0" style={{
        background: "rgba(255,240,180,0.18)",
        animation: "flashFade 0.5s ease-out both",
      }} />
      {/* Deep amber bg */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse at 50% 75%, rgba(180,80,0,0.58) 0%, rgba(90,35,0,0.35) 32%, transparent 62%)",
        animation: "legendaryBg 0.7s ease-out both",
      }} />
      {/* Fire haze at bottom */}
      <div className="absolute bottom-0 left-0 right-0" style={{
        height: "45%",
        background: "radial-gradient(ellipse at 50% 100%, rgba(200,80,0,0.28) 0%, transparent 65%)",
        filter: "blur(30px)",
        animation: "legendaryBg 1.0s 0.1s ease-out both",
      }} />
      {/* Expanding gold rings */}
      {[0, 0.16, 0.32, 0.48].map((delay, i) => (
        <div key={i} className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div style={{
            width: `${58 - i * 4}vw`, height: `${58 - i * 4}vw`,
            maxWidth: `${440 - i * 30}px`, maxHeight: `${440 - i * 30}px`,
            borderRadius: "50%",
            border: `${3 - i * 0.5}px solid rgba(251,191,36,${0.72 - i * 0.16})`,
            animation: `ringExpand 1.5s ${delay}s ease-out forwards`,
          }} />
        </div>
      ))}
      {/* Gold rays — 12 */}
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{
          transform: `rotate(${i * 30}deg)`,
        }}>
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            width: `${i % 3 === 0 ? "2.5px" : "1.5px"}`,
            height: `${i % 3 === 0 ? "50vw" : "40vw"}`,
            maxHeight: `${i % 3 === 0 ? "400px" : "320px"}`,
            transformOrigin: "top center",
            transform: "translateX(-50%)",
            background: `linear-gradient(to bottom, rgba(251,191,36,${i % 3 === 0 ? 0.65 : 0.38}) 0%, transparent 100%)`,
            animation: `rayExpand 0.9s ${i * 0.055}s ease-out both`,
          }} />
        </div>
      ))}
    </>
  );
}

function PowerupReveal() {
  return (
    <>
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse at 50% 68%, rgba(200,15,15,0.55) 0%, rgba(90,4,4,0.32) 38%, transparent 68%)",
        animation: "powerupBg 0.4s ease-out both",
      }} />
      {[0, 0.10, 0.20].map((delay, i) => (
        <div key={i} className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div style={{
            width: `${46 - i * 3}vw`, height: `${46 - i * 3}vw`,
            maxWidth: `${360 - i * 25}px`, maxHeight: `${360 - i * 25}px`,
            borderRadius: "50%",
            border: `${3.5 - i}px solid rgba(239,68,68,${0.80 - i * 0.25})`,
            animation: `ringExpand 1.0s ${delay}s ease-out forwards`,
          }} />
        </div>
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{
          transform: `rotate(${i * 60 + 10}deg)`,
        }}>
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            width: "2px", height: "38vw", maxHeight: "290px",
            transformOrigin: "top center",
            transform: "translateX(-50%)",
            background: "linear-gradient(to bottom, rgba(252,165,165,0.70) 0%, transparent 100%)",
            animation: `rayExpand 0.55s ${i * 0.065}s ease-out both`,
          }} />
        </div>
      ))}
    </>
  );
}

function ConfettiRain() {
  const pieces = useMemo(() =>
    Array.from({ length: 55 }, (_, i) => ({
      id:       i,
      left:     `${2 + Math.random() * 96}%`,
      color:    ["#FBBF24","#F59E0B","#FDE68A","#D97706","#FFFFFF","#FEF3C7","#FFD700","#FFEC8B"][
        Math.floor(Math.random() * 8)
      ],
      width:    5 + Math.random() * 9,
      height:   3 + Math.random() * 5,
      delay:    Math.random() * 1.1,
      duration: 1.8 + Math.random() * 1.4,
      skew:     Math.random() > 0.5,
    })), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 5 }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position:     "absolute",
          top:          "-16px",
          left:         p.left,
          width:        p.width,
          height:       p.height,
          borderRadius: p.skew ? "1px" : "50%",
          background:   p.color,
          animation:    `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
          boxShadow:    `0 0 4px ${p.color}80`,
        }} />
      ))}
    </div>
  );
}

function FireSparks() {
  const sparks = useMemo(() =>
    Array.from({ length: 22 }, (_, i) => ({
      id:    i,
      left:  `${28 + Math.random() * 44}%`,
      dur:   0.7 + Math.random() * 0.9,
      delay: Math.random() * 0.7,
      size:  2 + Math.random() * 3.5,
      dx:    (Math.random() - 0.5) * 120,
    })), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 4 }}>
      {sparks.map(p => (
        <div key={p.id} style={{
          position: "absolute",
          bottom:   "18%",
          left:     p.left,
          width:    p.size,
          height:   p.size * 2.5,
          borderRadius: "50% 50% 30% 30%",
          background: `linear-gradient(to bottom, #FEF3C7, #F59E0B 50%, transparent)`,
          animation: `sparkFly ${p.dur}s ${p.delay}s ease-out forwards`,
          ["--dx" as string]: `${p.dx}px`,
        }} />
      ))}
    </div>
  );
}

// ─── Result sheet ─────────────────────────────────────────────────────────────

function ResultSheet({
  rarity, reward, spinCount, onClose, onSpinAgain,
}: {
  rarity: WheelRarity;
  reward: RewardState | null;
  spinCount: number;
  onClose: () => void;
  onSpinAgain: () => void;
}) {
  const cfg         = RARITY_CONFIG[rarity];
  const isLegendary = rarity === "legendary";
  const isEpic      = rarity === "epic";
  const isMascots   = rarity === "mascots";
  const isRare      = rarity === "rare";
  const hasCosmetic = reward?.status === "granted";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" style={{
        background: "rgba(0,0,0,0.86)",
        backdropFilter: "blur(20px)",
      }} />

      {/* Rarity reveal effects */}
      <div className="absolute inset-0 pointer-events-none">
        {rarity === "common" && <CommonReveal />}
        {isRare      && <RareReveal />}
        {isEpic      && <EpicReveal />}
        {isLegendary && <LegendaryReveal />}
        {isMascots   && <PowerupReveal />}
      </div>

      {/* Legendary + Mascots extras */}
      {(isLegendary || isMascots) && <ConfettiRain />}
      {(isLegendary || isMascots) && hasCosmetic && <FireSparks />}

      {/* Sheet card */}
      <div
        className="relative z-10 w-full max-w-md px-6 pt-8 pb-10 flex flex-col items-center gap-5"
        style={{
          background:   cfg.resultBg,
          borderTop:    `1px solid rgba(${cfg.glowRgb},0.60)`,
          borderLeft:   `1px solid rgba(${cfg.glowRgb},0.20)`,
          borderRight:  `1px solid rgba(${cfg.glowRgb},0.20)`,
          borderRadius: "28px 28px 0 0",
          animation:    "sheetUp 0.44s cubic-bezier(0.34,1.52,0.64,1) both",
          boxShadow:    `0 -40px 100px rgba(${cfg.glowRgb},${isLegendary ? 0.40 : isEpic ? 0.30 : 0.22})`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top handle */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full" style={{
          background: `rgba(${cfg.glowRgb},0.35)`,
        }} />

        {/* Rarity badge */}
        <div
          className="px-5 py-1.5 rounded-full text-[11px] font-black tracking-widest uppercase"
          style={{
            background: `rgba(${cfg.glowRgb},0.12)`,
            color: cfg.accent,
            border: `1px solid rgba(${cfg.glowRgb},0.60)`,
            boxShadow: `0 0 28px rgba(${cfg.glowRgb},0.35), inset 0 1px 0 rgba(255,255,255,0.08)`,
            animation: isLegendary ? "badgePulse 1.8s ease-in-out 0.6s infinite" : "none",
          }}
        >
          {rarity === "mascots" ? "Mascots" : rarity}
        </div>

        {/* Main emoji */}
        <div className="relative flex items-center justify-center">
          {/* Orbiting ring for legendary/epic/mascots */}
          {(isLegendary || isEpic || isMascots) && hasCosmetic && (
            <div className="absolute" style={{
              width: isLegendary || isMascots ? 130 : 115,
              height: isLegendary || isMascots ? 130 : 115,
              borderRadius: "50%",
              border: `1.5px solid rgba(${cfg.glowRgb},0.55)`,
              boxShadow: `0 0 22px rgba(${cfg.glowRgb},0.35)`,
              animation: "spinRing 3.5s linear infinite",
            }} />
          )}
          {(isLegendary || isEpic || isMascots) && hasCosmetic && (
            <div className="absolute" style={{
              width: isLegendary || isMascots ? 108 : 96,
              height: isLegendary || isMascots ? 108 : 96,
              borderRadius: "50%",
              border: `1px solid rgba(${cfg.glowRgb},0.28)`,
              animation: "spinRing 5s linear infinite reverse",
            }} />
          )}
          <div
            key={hasCosmetic ? "cosmetic" : rarity}
            style={{
              fontSize: isLegendary || isMascots ? 96 : isEpic ? 88 : 80,
              lineHeight: 1,
              userSelect: "none",
              filter: (isLegendary && hasCosmetic)
                ? `drop-shadow(0 0 32px ${cfg.accent}) drop-shadow(0 0 64px rgba(${cfg.glowRgb},0.55))`
                : (isEpic && hasCosmetic)
                ? `drop-shadow(0 0 20px ${cfg.accent}) drop-shadow(0 0 40px rgba(${cfg.glowRgb},0.40))`
                : (isMascots && hasCosmetic)
                ? `drop-shadow(0 0 26px ${cfg.accent}) drop-shadow(0 0 52px rgba(${cfg.glowRgb},0.48))`
                : "none",
              animation: hasCosmetic
                ? (isLegendary
                  ? "cosmeticReveal 0.60s cubic-bezier(0.34,1.56,0.64,1) both, legendaryGlow 1.6s ease-in-out 0.6s infinite"
                  : isEpic
                  ? "cosmeticReveal 0.50s cubic-bezier(0.34,1.54,0.64,1) both, epicGlow 2.0s ease-in-out 0.5s infinite"
                  : isMascots
                  ? "cosmeticReveal 0.48s cubic-bezier(0.34,1.52,0.64,1) both, legendaryGlow 1.6s ease-in-out 0.6s infinite"
                  : "cosmeticReveal 0.42s cubic-bezier(0.34,1.52,0.64,1) both")
                : "none",
              opacity: hasCosmetic ? 1 : 0.22,
            }}
          >
            {hasCosmetic ? reward.cosmetic.emoji : "·  ·  ·"}
          </div>
        </div>

        {/* Name & flavor */}
        <div className="text-center" style={{ minHeight: 52 }}>
          {hasCosmetic ? (
            <div style={{ animation: "cosmeticReveal 0.35s 0.10s both" }}>
              <p className={`font-black text-white tracking-tight ${isLegendary || isMascots ? "text-3xl" : "text-2xl"}`}>
                {reward.cosmetic.label}
              </p>
              <p className={`mt-1 font-bold ${isLegendary || isMascots ? "text-base" : "text-sm"}`} style={{ color: cfg.accent }}>
                {cfg.flavorText}
              </p>
            </div>
          ) : reward?.status !== "loading" ? (
            <p className="text-base font-black" style={{ color: `rgba(${cfg.glowRgb},0.45)` }}>
              {rarity === "mascots" ? "Mascot" : rarity.charAt(0).toUpperCase() + rarity.slice(1)} Reward
            </p>
          ) : null}
        </div>

        {/* Status area */}
        <div className="w-full text-center min-h-[38px] flex items-center justify-center">
          {reward?.status === "loading" && (
            <div className="flex items-center gap-2">
              <div style={{
                width: 14, height: 14, borderRadius: "50%",
                border: `2px solid rgba(${cfg.glowRgb},0.25)`,
                borderTopColor: cfg.accent,
                animation: "spin360 0.7s linear infinite",
              }} />
              <p className="text-[11px] font-semibold" style={{ color: `rgba(${cfg.glowRgb},0.55)` }}>
                Unlocking reward…
              </p>
            </div>
          )}
          {hasCosmetic && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span style={{ color: cfg.accent, fontSize: 12, fontWeight: 900 }}>✓</span>
                <p className="text-xs font-black" style={{ color: cfg.accent }}>Added to your Locker</p>
              </div>
              <Link
                href="/locker"
                className="text-[10px] font-bold px-3 py-1 rounded-lg"
                style={{
                  color: cfg.accent,
                  background: `rgba(${cfg.glowRgb},0.10)`,
                  border: `1px solid rgba(${cfg.glowRgb},0.28)`,
                }}
                onClick={onClose}
              >
                Open Locker →
              </Link>
            </div>
          )}
          {reward?.status === "all_owned" && (
            <p className="text-[11px] font-semibold px-4 text-center" style={{ color: "#6B7280" }}>
              You own all cosmetics at this rarity.
            </p>
          )}
          {reward?.status === "error" && (
            <p className="text-[11px] font-semibold" style={{ color: "#EF4444" }}>
              Could not save reward — try again
            </p>
          )}
          {!reward && (
            <p className="text-[11px] font-semibold" style={{ color: "#1F2937" }}>
              Spin #{spinCount}
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="w-full flex gap-3 mt-1">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl text-sm font-black transition-all active:scale-95"
            style={{
              background: "rgba(255,255,255,0.05)",
              color: "#6B7280",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            Close
          </button>
          <button
            onClick={onSpinAgain}
            className="flex-2 py-4 rounded-2xl text-sm font-black text-white active:scale-95 transition-transform"
            style={{
              flex: 2,
              background: `linear-gradient(135deg, ${cfg.fillOuter}, ${cfg.glow} 50%, ${cfg.accent})`,
              boxShadow: `0 4px 28px rgba(${cfg.glowRgb},0.52), inset 0 1px 0 rgba(255,255,255,0.12)`,
              border: `1px solid rgba(${cfg.glowRgb},0.40)`,
            }}
          >
            Spin Again ↻
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function WheelPage() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const wrapperRef  = useRef<HTMLDivElement>(null);
  const wheelAreaRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const animRef     = useRef<number>(0);
  const sizeRef     = useRef(300);

  const [spinning,    setSpinning]    = useState(false);
  const [rarity,      setRarity]      = useState<WheelRarity | null>(null);
  const [reward,      setReward]      = useState<RewardState | null>(null);
  const [spinCount,   setSpinCount]   = useState(0);
  const [canvasSize,  setCanvasSize]  = useState(300);
  const [impactFlash, setImpactFlash] = useState<WheelRarity | null>(null);
  const [isShaking,   setIsShaking]   = useState(false);
  const [spinPhase,   setSpinPhase]   = useState<"idle" | "fast" | "slowing">("idle");

  const SEG_ANGLE = 360 / SEGMENTS.length;

  // Responsive canvas sizing
  useEffect(() => {
    function measure() {
      if (!wrapperRef.current) return;
      const s = Math.min(wrapperRef.current.offsetWidth, 390);
      setCanvasSize(s);
      sizeRef.current = s;
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  // DPR-correct redraw on size change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize === 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    canvas.style.width  = `${canvasSize}px`;
    canvas.style.height = `${canvasSize}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
    drawWheel(canvas, canvasSize);
  }, [canvasSize]);

  function spin() {
    if (spinning) return;

    const resultIdx  = pickResultIndex();
    const segRarity  = SEGMENTS[resultIdx].rarity;
    const params     = SPIN_PARAMS[segRarity];
    const fullSpins  = Math.floor(rand(params.spins[0], params.spins[1]));
    // Jitter: keep it < 0.5 * SEG_ANGLE so landing stays within the same segment
    const jitter     = (Math.random() - 0.5) * SEG_ANGLE * 0.2;
    const landAngle  = (360 - (resultIdx + 0.5) * SEG_ANGLE + jitter + 36000) % 360;
    const totalSpin  = fullSpins * 360 + landAngle;
    const duration   = rand(params.duration[0], params.duration[1]);
    const startRot   = rotationRef.current;
    const startTime  = performance.now();

    setSpinning(true);
    setRarity(null);
    setReward(null);
    setImpactFlash(null);
    setSpinPhase("fast");

    localStorage.setItem("wheel_last_spin", Date.now().toString());

    const isMascots    = segRarity === "mascots";
    const claimPromise = isMascots
      ? fetch("/api/wheel/claim", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ rarity: segRarity }),
        }).then(r => r.json())
      : fetch("/api/wheel/claim", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ rarity: segRarity }),
        }).then(r => r.json());

    function mainFrame(now: number) {
      const t    = Math.min((now - startTime) / duration, 1);
      const ease = spinEase(t, segRarity);
      const cur  = startRot + totalSpin * ease;

      rotationRef.current = cur;

      if (canvasRef.current) {
        canvasRef.current.style.transform = `rotate(${cur}deg)`;
        // Motion blur
        let blurPx = 0;
        if      (t < 0.45) blurPx = 3.2;
        else if (t < 0.80) blurPx = 3.2 * (1 - (t - 0.45) / 0.35);
        canvasRef.current.style.filter = blurPx > 0.18 ? `blur(${blurPx.toFixed(1)}px)` : "";
      }

      // Transition to slowing phase
      if (t > 0.60 && spinPhase === "fast") setSpinPhase("slowing");

      if (t < 1) {
        animRef.current = requestAnimationFrame(mainFrame);
        return;
      }

      if (canvasRef.current) canvasRef.current.style.filter = "";
      setSpinPhase("idle");

      // Bounce
      const bounceDur = segRarity === "legendary" || segRarity === "mascots" ? 640 : segRarity === "epic" ? 500 : 390;
      const bounceAmp = SEG_ANGLE * (segRarity === "legendary" || segRarity === "mascots" ? 0.13 : segRarity === "epic" ? 0.09 : 0.065);
      const bounceStart = performance.now();

      // Impact flash
      setImpactFlash(segRarity);
      setTimeout(() => setImpactFlash(null), 240);

      // Camera shake
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);

      function bounceFrame(ts: number) {
        const u   = Math.min((ts - bounceStart) / bounceDur, 1);
        const env = Math.exp(-u * 4.8);
        const osc = Math.sin(u * Math.PI * 3.5) * bounceAmp * env;
        if (canvasRef.current) {
          canvasRef.current.style.transform = `rotate(${rotationRef.current + osc}deg)`;
        }
        if (u < 1) {
          animRef.current = requestAnimationFrame(bounceFrame);
          return;
        }

        if (canvasRef.current) canvasRef.current.style.transform = `rotate(${rotationRef.current}deg)`;

        setSpinning(false);
        setSpinCount(c => c + 1);
        setRarity(segRarity);
        setReward({ status: "loading" });

        claimPromise
          .then((data: Record<string, unknown>) => {
            if (data.cosmetic)            setReward({ status: "granted", cosmetic: data.cosmetic as Cosmetic });
            else if (data.alreadyOwnsAll) setReward({ status: "all_owned" });
            else                          setReward({ status: "error" });
          })
          .catch(() => setReward({ status: "error" }));
      }

      animRef.current = requestAnimationFrame(bounceFrame);
    }

    animRef.current = requestAnimationFrame(mainFrame);
  }

  useEffect(() => () => { cancelAnimationFrame(animRef.current); }, []);

  const impactCfg = impactFlash ? RARITY_CONFIG[impactFlash] : null;

  // Dynamic ambient glow color
  const ambientGlow = spinPhase === "fast"
    ? "rgba(140,100,255,0.18)"
    : spinPhase === "slowing"
    ? "rgba(200,150,30,0.16)"
    : "rgba(170,115,15,0.14)";

  // Hub overlay size (matches canvas hub radius)
  const hubOverlaySize = canvasSize * 0.148 * 2;

  return (
    <>
      <style>{`
        @keyframes beamPulse {
          0%,100% { opacity: 0.45; }
          50%     { opacity: 1;    }
        }
        @keyframes particleFloat {
          0%,100% { transform: translateY(0px) scale(1);    opacity: 0.22; }
          50%     { transform: translateY(-20px) scale(1.5); opacity: 0.58; }
        }
        @keyframes ringExpand {
          0%   { transform: scale(0.25); opacity: 0.95; }
          100% { transform: scale(2.4);  opacity: 0;    }
        }
        @keyframes rayExpand {
          0%   { opacity: 0; transform: translateX(-50%) scaleY(0); }
          25%  { opacity: 1; }
          100% { opacity: 0; transform: translateX(-50%) scaleY(1); }
        }
        @keyframes sparkleOut {
          0%   { opacity: 1; transform-origin: center; transform: rotate(var(--r,0deg)) translateY(-50px) scale(1); }
          100% { opacity: 0; transform: rotate(var(--r,0deg)) translateY(-90px) scale(0.2); }
        }
        @keyframes legendaryBg {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes epicBg {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes rareBg {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes powerupBg {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes flashFade {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes smokeRise {
          0%   { opacity: 0; transform: translateY(20px); }
          40%  { opacity: 1; }
          100% { opacity: 0.6; transform: translateY(0); }
        }
        @keyframes scanLine {
          0%   { opacity: 0; transform: translate(-50%,-50%) scaleX(0); }
          40%  { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%,-50%) scaleX(1); }
        }
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotateZ(0deg) rotateX(0deg);   opacity: 1;   }
          80%  { opacity: 1; }
          100% { transform: translateY(105vh) rotateZ(720deg) rotateX(180deg); opacity: 0.3; }
        }
        @keyframes sparkFly {
          0%   { transform: translateY(0) translateX(0) scale(1); opacity: 1; }
          100% { transform: translateY(-120px) translateX(var(--dx,0)) scale(0.1); opacity: 0; }
        }
        @keyframes sheetUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes cosmeticReveal {
          from { transform: scale(0.45) translateY(14px); opacity: 0; }
          to   { transform: scale(1)    translateY(0);    opacity: 1; }
        }
        @keyframes legendaryGlow {
          0%,100% { filter: drop-shadow(0 0 26px #F59E0B) drop-shadow(0 0 52px rgba(245,158,11,0.50)); }
          50%     { filter: drop-shadow(0 0 50px #FBBF24) drop-shadow(0 0 100px rgba(251,191,36,0.70)); }
        }
        @keyframes epicGlow {
          0%,100% { filter: drop-shadow(0 0 18px #A855F7) drop-shadow(0 0 38px rgba(168,85,247,0.45)); }
          50%     { filter: drop-shadow(0 0 34px #C084FC) drop-shadow(0 0 70px rgba(192,132,252,0.65)); }
        }
        @keyframes badgePulse {
          0%,100% { box-shadow: 0 0 28px rgba(245,158,11,0.35); }
          50%     { box-shadow: 0 0 50px rgba(245,158,11,0.70), 0 0 90px rgba(245,158,11,0.28); }
        }
        @keyframes spinRing {
          to { transform: rotate(360deg); }
        }
        @keyframes spin360 {
          to { transform: rotate(360deg); }
        }
        @keyframes wheelGlowIdle {
          0%,100% { box-shadow: 0 0 45px rgba(170,115,15,0.30), 0 0 90px rgba(170,115,15,0.12); }
          50%     { box-shadow: 0 0 75px rgba(170,115,15,0.50), 0 0 130px rgba(170,115,15,0.20); }
        }
        @keyframes wheelGlowSpin {
          0%,100% { box-shadow: 0 0 60px rgba(140,80,240,0.50), 0 0 110px rgba(100,50,200,0.22); }
          50%     { box-shadow: 0 0 100px rgba(160,100,255,0.75), 0 0 180px rgba(120,60,220,0.35); }
        }
        @keyframes pointerFloat {
          0%,100% { transform: translateX(-50%) translateY(0px);   }
          50%     { transform: translateX(-50%) translateY(-7px);   }
        }
        @keyframes spinBtn {
          0%,100% { box-shadow: 0 8px 32px rgba(160,90,10,0.50), 0 2px 8px rgba(0,0,0,0.40); }
          50%     { box-shadow: 0 8px 56px rgba(245,158,11,0.75), 0 2px 8px rgba(0,0,0,0.40); }
        }
        @keyframes impactFlashAnim {
          0%   { opacity: 0.88; }
          100% { opacity: 0;    }
        }
        @keyframes cameraShake {
          0%   { transform: translate(0,0)       rotate(0deg);     }
          12%  { transform: translate(-4px,2px)  rotate(-0.4deg);  }
          24%  { transform: translate(4px,-2px)  rotate(0.4deg);   }
          36%  { transform: translate(-3px,3px)  rotate(-0.3deg);  }
          48%  { transform: translate(3px,-3px)  rotate(0.3deg);   }
          60%  { transform: translate(-2px,1px)  rotate(-0.2deg);  }
          72%  { transform: translate(2px,-1px)  rotate(0.2deg);   }
          84%  { transform: translate(-1px,1px)  rotate(-0.1deg);  }
          100% { transform: translate(0,0)       rotate(0deg);     }
        }
        @keyframes hubShine {
          0%   { transform: translate(-50%,-50%) rotate(0deg);   }
          100% { transform: translate(-50%,-50%) rotate(360deg); }
        }
        @keyframes rimPulse {
          0%,100% { opacity: 0.6; }
          50%     { opacity: 1;   }
        }
        @keyframes flagWave {
          0%,100% { transform: rotate(-3deg);             }
          50%     { transform: rotate( 3deg) skewX(2deg); }
        }
        @keyframes bgConfettiDrift {
          0%   { transform: translateY(0)     translateX(0)    rotate(0deg);   opacity: 0.52; }
          33%  { transform: translateY(33vh)  translateX(8px)  rotate(120deg); opacity: 0.48; }
          66%  { transform: translateY(66vh)  translateX(-6px) rotate(240deg); opacity: 0.44; }
          100% { transform: translateY(108vh) translateX(2px)  rotate(360deg); opacity: 0;    }
        }
        @keyframes floodPulse {
          0%,100% { opacity: 0.80; }
          50%     { opacity: 1.00; }
        }
      `}</style>

      <div className="min-h-full flex flex-col relative overflow-hidden" style={{ background: "#020610" }}>

        <StadiumBackground spinning={spinning} />

        {/* Header */}
        <header
          className="relative z-10 sticky top-0 flex items-center gap-3 px-4 py-3"
          style={{
            background:     "rgba(2,6,16,0.92)",
            borderBottom:   "1px solid rgba(175,135,25,0.14)",
            backdropFilter: "blur(28px)",
          }}
        >
          <Link
            href="/"
            className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <ArrowLeft size={16} color="white" />
          </Link>
          <div>
            <p className="text-sm font-black text-white tracking-wide">Wheel of Fortune</p>
            <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "#4B5563" }}>
              Spin for cosmetics
            </p>
          </div>
          <span
            className="ml-auto text-[9px] font-black px-2.5 py-1 rounded-full tracking-widest"
            style={{
              background: "rgba(175,135,25,0.08)",
              color: "#D97706",
              border: "1px solid rgba(175,135,25,0.24)",
            }}
          >
            ∞ TEST
          </span>
        </header>

        {/* Wheel area */}
        <div
          ref={wheelAreaRef}
          className="relative z-10 flex-1 flex flex-col items-center justify-center gap-8 px-4 py-4"
          style={{
            animation: isShaking ? "cameraShake 0.08s ease-in-out 6" : "none",
          }}
        >
          <div ref={wrapperRef} className="w-full flex justify-center">
            <div className="relative" style={{ width: canvasSize, height: canvasSize }}>

              {/* Ambient outer glow — reacts to spin phase */}
              <div className="absolute rounded-full pointer-events-none" style={{
                inset: "-18%",
                background: `radial-gradient(circle, ${ambientGlow} 0%, transparent 68%)`,
                filter: "blur(24px)",
                transition: "background 1.2s ease",
              }} />

              {/* Pointer */}
              <div className="absolute z-20" style={{
                left: "50%",
                top: -32,
                transform: "translateX(-50%)",
                animation: spinning ? "none" : "pointerFloat 2.8s ease-in-out infinite",
                filter: spinning
                  ? "drop-shadow(0 0 14px rgba(255,255,255,0.8)) drop-shadow(0 0 28px rgba(251,191,36,0.65))"
                  : "drop-shadow(0 0 12px rgba(251,191,36,0.95)) drop-shadow(0 0 26px rgba(245,158,11,0.60))",
                transition: "filter 0.4s ease",
              }}>
                <div style={{
                  width: 22, height: 22,
                  borderRadius: "50% 50% 0 50%",
                  transform: "rotate(45deg)",
                  background: "linear-gradient(135deg, #FFFAE0, #FBBF24 35%, #D97706 70%, #7C2D12)",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.12)",
                }} />
              </div>

              {/* Impact flash overlay */}
              {impactCfg && (
                <div className="absolute inset-0 rounded-full pointer-events-none" style={{
                  background: `radial-gradient(circle, rgba(${impactCfg.glowRgb},0.68) 0%, rgba(${impactCfg.glowRgb},0.20) 40%, transparent 70%)`,
                  animation: "impactFlashAnim 0.24s ease-out forwards",
                  zIndex: 5,
                }} />
              )}

              {/* Canvas */}
              <canvas
                ref={canvasRef}
                style={{
                  display: "block",
                  borderRadius: "50%",
                  transformOrigin: "center center",
                  willChange: "transform",
                  animation: spinning
                    ? "wheelGlowSpin 0.65s ease-in-out infinite"
                    : "wheelGlowIdle 3.0s ease-in-out infinite",
                }}
              />

              {/* Hub shine overlay — rotating specular on center */}
              <div className="absolute pointer-events-none" style={{
                top: "50%", left: "50%",
                width: hubOverlaySize,
                height: hubOverlaySize,
                borderRadius: "50%",
                background: "conic-gradient(transparent 0deg, rgba(255,250,200,0.16) 80deg, transparent 160deg, rgba(255,250,200,0.08) 260deg, transparent 360deg)",
                animation: "hubShine 4s linear infinite",
                zIndex: 2,
              }} />
            </div>
          </div>

          {/* Spin button */}
          <div className="relative w-full max-w-[300px]">
            <button
              onClick={spin}
              disabled={spinning}
              className="relative w-full py-5 rounded-2xl text-base font-black text-white transition-all active:scale-95 tracking-widest overflow-hidden"
              style={spinning ? {
                background: "rgba(255,255,255,0.04)",
                color: "#374151",
                cursor: "not-allowed",
                border: "1px solid rgba(255,255,255,0.06)",
              } : {
                background: "linear-gradient(135deg, #78350F 0%, #B45309 25%, #D97706 50%, #FBBF24 70%, #D97706 100%)",
                animation: "spinBtn 2.4s ease-in-out infinite",
                border: "1px solid rgba(251,191,36,0.35)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.25)",
              }}
            >
              {/* Shine sweep overlay */}
              {!spinning && (
                <div className="absolute inset-0 pointer-events-none" style={{
                  background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)",
                  borderRadius: "inherit",
                }} />
              )}
              {spinning ? "SPINNING…" : "SPIN"}
            </button>
          </div>

          {spinCount > 0 && !spinning && (
            <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#1F2937" }}>
              {spinCount} spin{spinCount !== 1 ? "s" : ""} this session
            </p>
          )}
        </div>
      </div>

      {rarity && (
        <ResultSheet
          rarity={rarity}
          reward={reward}
          spinCount={spinCount}
          onClose={() => { setRarity(null); setReward(null); }}
          onSpinAgain={() => { setRarity(null); setReward(null); setTimeout(spin, 120); }}
        />
      )}
    </>
  );
}
