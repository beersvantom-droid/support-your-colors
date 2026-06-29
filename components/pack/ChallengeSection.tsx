"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import ChallengeRewardOpener from "./ChallengeRewardOpener";

interface ChallengeData {
  active: boolean;
  mascotLabel?: string;
  mascotEmoji?: string;
  mascotImage?: string;
  packImage?: string;
  percentage?: number;
  endDate?: string;
  claimed?: boolean;
  mode?: string;
}

function timeLeft(endDate: string): string {
  const end = new Date(endDate + "T23:59:59+02:00").getTime();
  const diff = end - Date.now();
  if (diff <= 0) return "Afgelopen";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}u`;
  return `${hours}u`;
}

export default function ChallengeSection() {
  const [data, setData] = useState<ChallengeData | null>(null);
  const [showOpener, setShowOpener] = useState(false);

  useEffect(() => {
    fetch("/api/challenge")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data?.active) return null;

  const pct = data.percentage ?? 0;
  const isComplete = pct >= 100;
  const isClaimed = data.claimed;

  // Show the pack opener
  if (showOpener) {
    return (
      <ChallengeRewardOpener
        packImage={data.packImage ?? "/packs/goatpack.png"}
        onDone={() => {
          setShowOpener(false);
          setData((prev) => prev ? { ...prev, claimed: true } : prev);
        }}
      />
    );
  }

  // Already claimed — show "wait for next challenge"
  if (isClaimed) {
    return (
      <div
        style={{
          width: "100%",
          maxWidth: 340,
          borderRadius: 20,
          background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          border: "1.5px solid rgba(255,255,255,0.10)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          padding: "24px 20px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 32, marginBottom: 8 }}>✅</p>
        <p style={{ color: "#10B981", fontWeight: 900, fontSize: 15 }}>
          Beloning opgehaald!
        </p>
        <p style={{ color: "#6B7280", fontSize: 12, marginTop: 6 }}>
          Wacht tot de volgende Community Challenge
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 340,
        borderRadius: 20,
        background: "linear-gradient(145deg, #1a0f2e 0%, #0f1a3e 50%, #0a2840 100%)",
        border: `1.5px solid ${isComplete ? "rgba(16,185,129,0.45)" : "rgba(255,215,0,0.35)"}`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${isComplete ? "rgba(16,185,129,0.12)" : "rgba(255,215,0,0.08)"}`,
        padding: "20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Gold shimmer overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: isComplete
            ? "linear-gradient(90deg, transparent, #10B981, transparent)"
            : "linear-gradient(90deg, transparent, #FFD700, transparent)",
          opacity: 0.6,
        }}
      />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div
          className="mascot-goat"
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "rgba(255,215,0,0.1)",
            border: "1.5px solid rgba(255,215,0,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          <Image
            src={data.mascotImage!}
            alt={data.mascotLabel!}
            width={44}
            height={44}
            style={{ objectFit: "contain" }}
            unoptimized
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: isComplete ? "#10B981" : "#FFD700", fontWeight: 900, fontSize: 15, letterSpacing: "-0.01em" }}>
            {isComplete ? "Challenge Gehaald! 🎉" : "Community Challenge"}
          </p>
          <p style={{ color: "#9CA3AF", fontSize: 11, lineHeight: 1.4, marginTop: 2 }}>
            {isComplete
              ? "Claim je beloning!"
              : data.mode === "mystery"
              ? "Help de groep het doel te halen! Willekeurige beloningen bij 100%"
              : <>Help de groep! De top 3 verdient de <span style={{ color: "#FFD700" }}>{data.mascotLabel}</span> mascot</>
            }
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            width: "100%",
            height: 10,
            borderRadius: 5,
            background: "rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              borderRadius: 5,
              background: isComplete
                ? "linear-gradient(90deg, #10B981, #34D399)"
                : "linear-gradient(90deg, #FFD700, #FFA500)",
              transition: "width 0.8s ease-out",
              boxShadow: isComplete
                ? "0 0 8px rgba(16,185,129,0.5)"
                : "0 0 8px rgba(255,215,0,0.4)",
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ color: isComplete ? "#10B981" : "#FFD700", fontSize: 12, fontWeight: 800 }}>
            {isComplete ? "✅ 100% behaald!" : `${pct}% behaald`}
          </span>
          {!isComplete && (
            <span style={{ color: "#6B7280", fontSize: 11, fontWeight: 600 }}>
              ⏳ {timeLeft(data.endDate!)}
            </span>
          )}
        </div>
      </div>

      {/* Claim button OR rewards info */}
      {isComplete ? (
        <button
          onClick={() => setShowOpener(true)}
          style={{
            width: "100%",
            padding: "14px 0",
            borderRadius: 14,
            background: "linear-gradient(135deg, #10B981, #059669)",
            color: "#fff",
            fontWeight: 900,
            fontSize: 15,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(16,185,129,0.35)",
            animation: "pulseBtn 2.4s ease-in-out infinite",
          }}
        >
          🎁 Beloning ophalen
        </button>
      ) : (
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            borderRadius: 12,
            padding: "10px 12px",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p style={{ color: "#6B7280", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
            Beloningen
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {data.mode === "mystery" ? (
              <>
                <p style={{ color: "#FFD700", fontSize: 11, fontWeight: 700 }}>
                  🎲 Willekeurige exclusieve beloningen
                </p>
                <p style={{ color: "#9CA3AF", fontSize: 11 }}>
                  Rest → 150 🪙
                </p>
              </>
            ) : (
              <>
                <p style={{ color: "#FFD700", fontSize: 11, fontWeight: 700 }}>
                  🏆 Top 3 → {data.mascotEmoji} {data.mascotLabel} mascot
                </p>
                <p style={{ color: "#9CA3AF", fontSize: 11 }}>
                  4-6 → 150 🪙 &nbsp;·&nbsp; Rest → 50 🪙
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
