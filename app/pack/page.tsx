"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PACKS, SHOP_PACKS, type Pack } from "@/lib/packs";
import PackOpener from "@/components/pack/PackOpener";

// ── Pack selector card ────────────────────────────────────────────────────────

function PackCard({ pack, onSelect }: { pack: Pack; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      style={{
        width: "100%", maxWidth: 340,
        padding: "24px 20px",
        borderRadius: 20,
        background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        border: "1.5px solid rgba(251,191,36,0.30)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", gap: 20,
        cursor: "pointer", textAlign: "left" as const,
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.6), 0 0 20px rgba(251,191,36,0.15), inset 0 1px 0 rgba(255,255,255,0.08)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = "";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)";
      }}
    >
      {/* Big emoji */}
      <div style={{ fontSize: 56, lineHeight: 1, flexShrink: 0, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))" }}>
        {pack.emoji}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: "#FBBF24", fontWeight: 900, fontSize: 17, marginBottom: 4, letterSpacing: "-0.01em" }}>
          {pack.label}
        </p>
        <p style={{ color: "#6B7280", fontSize: 13, lineHeight: 1.4 }}>
          {pack.description}
        </p>
        <p style={{ color: "#10B981", fontSize: 12, fontWeight: 700, marginTop: 8 }}>
          {pack.cost === null ? "✓ Gratis" : `${pack.cost.amount} ${pack.cost.currency}`}
          {pack.cooldownMinutes > 0 && <span style={{ color: "#6B7280", fontWeight: 500 }}> · 1× per dag</span>}
        </p>
      </div>

      {/* Arrow */}
      <div style={{ color: "#4B5563", fontSize: 20, flexShrink: 0 }}>›</div>
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PackPage() {
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);

  // Opening a pack
  if (selectedPack) {
    return (
      <div style={{
        minHeight: "100dvh",
        background: "radial-gradient(ellipse at 50% 30%, #08122A 0%, #040810 55%, #020508 100%)",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        <PackOpener
          pack={selectedPack}
          onReset={() => setSelectedPack(null)}
        />
      </div>
    );
  }

  // Pack selector
  return (
    <div style={{
      minHeight: "100dvh",
      background: "radial-gradient(ellipse at 50% 30%, #08122A 0%, #040810 55%, #020508 100%)",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "16px 20px 0",
        maxWidth: 500, margin: "0 auto",
      }}>
        <Link
          href="/"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            color: "#9CA3AF", textDecoration: "none",
          }}
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 style={{ color: "#fff", fontWeight: 900, fontSize: 20, letterSpacing: "-0.02em" }}>
            Packs
          </h1>
          <p style={{ color: "#6B7280", fontSize: 12 }}>Open een pack voor cosmetica &amp; mascots</p>
        </div>
      </div>

      {/* Pack list */}
      <div style={{
        maxWidth: 500, margin: "0 auto",
        padding: "28px 20px",
        display: "flex", flexDirection: "column", gap: 16, alignItems: "center",
      }}>
        {/* Daily packs only */}
        {PACKS.map(pack => (
          <PackCard
            key={pack.id}
            pack={pack}
            onSelect={() => setSelectedPack(pack)}
          />
        ))}

        {/* Shop link — go buy more packs */}
        <Link
          href="/pack/shop"
          style={{
            width: "100%", maxWidth: 340,
            padding: "24px 20px",
            borderRadius: 20,
            background: "linear-gradient(145deg, #2d1f0c 0%, #3d2a0f 50%, #4a3410 100%)",
            border: "1.5px solid rgba(251,191,36,0.40)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", gap: 20,
            cursor: "pointer", textAlign: "left" as const,
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
            textDecoration: "none",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.6), 0 0 20px rgba(251,191,36,0.20), inset 0 1px 0 rgba(255,255,255,0.08)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLAnchorElement).style.transform = "";
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)";
          }}
        >
          {/* Shop emoji */}
          <div style={{ fontSize: 56, lineHeight: 1, flexShrink: 0, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))" }}>
            🏪
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: "#FCD34D", fontWeight: 900, fontSize: 17, marginBottom: 4, letterSpacing: "-0.01em" }}>
              Shop
            </p>
            <p style={{ color: "#A3A3A3", fontSize: 13, lineHeight: 1.4 }}>
              Koop packs met munten
            </p>
            <p style={{ color: "#A3A3A3", fontSize: 12, fontWeight: 700, marginTop: 8 }}>
              💰 Betaal met munten · Speciaal aanbod
            </p>
          </div>

          {/* Arrow */}
          <div style={{ color: "#4B5563", fontSize: 20, flexShrink: 0 }}>›</div>
        </Link>
      </div>
    </div>
  );
}
