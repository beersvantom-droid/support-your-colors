"use client";

import { useState, useEffect } from "react";

const AMOUNTS = [50, 100, 200, 500];
// Card disappears 12 hours after going live (June 30 evening)
const CARD_EXPIRES_AT = new Date("2026-07-01T12:00:00Z");

interface BetStatus {
  userBet: { team: string; amount: number } | null;
  matchStatus: "upcoming" | "live" | "finished";
  homeScore: number | null;
  awayScore: number | null;
  winner: string | null;
  paidOut: boolean;
  wonAmount: number;
}

export default function MexicoEcuadorBetCard() {
  const [status, setStatus] = useState<BetStatus | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (Date.now() > CARD_EXPIRES_AT.getTime()) {
      setExpired(true);
      return;
    }
    fetch("/api/bet/mxecu/status").then(r => r.json()).then(setStatus).catch(() => {});
    const poll = setInterval(() => {
      fetch("/api/bet/mxecu/status").then(r => r.json()).then(setStatus).catch(() => {});
    }, 60_000);
    // Schedule expiry removal
    const timeout = setTimeout(() => setExpired(true), CARD_EXPIRES_AT.getTime() - Date.now());
    return () => { clearInterval(poll); clearTimeout(timeout); };
  }, []);

  if (expired) return null;

  if (!status) {
    return (
      <div style={{
        borderRadius: 16, overflow: "hidden",
        border: "2px solid #16a34a",
        background: "linear-gradient(145deg, #001a0a, #0a1f00, #001a0a)",
        padding: "14px",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        minHeight: 56,
      }}>
        <span style={{ fontSize: 20 }}>🇲🇽</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: "#4d7a3a" }}>Coin Bet laden…</span>
        <span style={{ fontSize: 20 }}>🇪🇨</span>
      </div>
    );
  }

  const hasBet = !!status.userBet;
  const GREEN = "#16a34a";
  const YELLOW = "#eab308";
  const GREEN_DIM = "rgba(22,163,74,0.12)";
  const YELLOW_DIM = "rgba(234,179,8,0.12)";

  async function placeBet() {
    if (!selectedTeam || !selectedAmount) return;
    setPlacing(true);
    setError(null);
    try {
      const r = await fetch("/api/bet/mxecu/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team: selectedTeam, amount: selectedAmount }),
      });
      const data = await r.json();
      if (data.success) {
        setStatus(prev => prev ? { ...prev, userBet: { team: selectedTeam!, amount: selectedAmount } } : prev);
      } else {
        setError(data.error);
      }
    } catch { setError("Netwerk fout"); }
    finally { setPlacing(false); }
  }

  return (
    <div style={{
      borderRadius: 16, overflow: "hidden",
      border: `2px solid ${GREEN}`,
      background: "linear-gradient(145deg, #001a0a, #0a1f00, #001a0a)",
    }}>
      {/* Header */}
      <div style={{
        padding: "10px 14px",
        background: "rgba(22,163,74,0.12)",
        borderBottom: "1px solid rgba(22,163,74,0.20)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: YELLOW, display: "inline-block" }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: YELLOW, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Coin Bet
          </span>
        </div>
        <span style={{ fontSize: 10, color: "#4d7a3a" }}>x2 odds · 30 jun</span>
      </div>

      {/* Teams */}
      <div style={{ padding: "16px 14px", display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28 }}>🇲🇽</div>
          <p style={{ fontSize: 12, fontWeight: 800, color: GREEN, margin: "4px 0 0" }}>Mexico</p>
        </div>
        <div style={{ textAlign: "center", padding: "0 6px" }}>
          {status.matchStatus === "upcoming" ? (
            <p style={{ fontSize: 14, fontWeight: 800, color: "#4d7a3a", margin: 0 }}>VS</p>
          ) : (
            <p style={{ fontSize: 20, fontWeight: 900, color: YELLOW, margin: 0 }}>
              {status.homeScore ?? 0} - {status.awayScore ?? 0}
            </p>
          )}
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28 }}>🇪🇨</div>
          <p style={{ fontSize: 12, fontWeight: 800, color: YELLOW, margin: "4px 0 0" }}>Ecuador</p>
        </div>
      </div>

      {/* Bet area */}
      <div style={{ padding: "0 14px 14px" }}>
        {/* Already bet — match not finished */}
        {hasBet && status.matchStatus !== "finished" && (
          <div style={{
            padding: "12px", borderRadius: 12,
            background: status.userBet!.team === "Mexico" ? GREEN_DIM : YELLOW_DIM,
            border: `1px solid ${status.userBet!.team === "Mexico" ? "rgba(22,163,74,0.30)" : "rgba(234,179,8,0.30)"}`,
            textAlign: "center",
          }}>
            <p style={{ fontSize: 12, color: "#4d7a3a", margin: 0 }}>Je hebt ingezet</p>
            <p style={{ fontSize: 16, fontWeight: 900, color: status.userBet!.team === "Mexico" ? GREEN : YELLOW, margin: "4px 0" }}>
              {status.userBet!.amount} 🪙 op {status.userBet!.team === "Mexico" ? "🇲🇽 Mexico" : "🇪🇨 Ecuador"}
            </p>
            <p style={{ fontSize: 11, color: "#4d7a3a", margin: 0 }}>
              Bij winst: {status.userBet!.amount * 2} 🪙
            </p>
          </div>
        )}

        {/* Match finished with bet */}
        {hasBet && status.matchStatus === "finished" && (
          <div style={{
            padding: "12px", borderRadius: 12,
            background: status.wonAmount > 0 ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.10)",
            border: `1px solid ${status.wonAmount > 0 ? "rgba(16,185,129,0.30)" : "rgba(239,68,68,0.25)"}`,
            textAlign: "center",
          }}>
            {status.wonAmount > 0 ? (
              <>
                <p style={{ fontSize: 20, margin: "0 0 4px" }}>🎉</p>
                <p style={{ fontSize: 14, fontWeight: 900, color: "#10B981", margin: 0 }}>
                  Gewonnen! +{status.wonAmount} 🪙
                </p>
              </>
            ) : (
              <>
                <p style={{ fontSize: 20, margin: "0 0 4px" }}>😢</p>
                <p style={{ fontSize: 14, fontWeight: 900, color: "#EF4444", margin: 0 }}>
                  Verloren! -{status.userBet!.amount} 🪙
                </p>
              </>
            )}
          </div>
        )}

        {/* No bet yet */}
        {!hasBet && status.matchStatus !== "finished" && (
          <>
            <p style={{ fontSize: 10, color: "#4d7a3a", margin: "0 0 6px" }}>Kies je inzet</p>

            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              {AMOUNTS.map(amt => (
                <button
                  key={amt}
                  onClick={() => setSelectedAmount(amt)}
                  style={{
                    flex: 1, padding: "6px 0", borderRadius: 8, fontSize: 12, fontWeight: 800,
                    border: "none", cursor: "pointer",
                    background: selectedAmount === amt ? YELLOW : "rgba(234,179,8,0.10)",
                    color: selectedAmount === amt ? "#000" : "#4d7a3a",
                  }}
                >
                  {amt}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <button
                onClick={() => setSelectedTeam("Mexico")}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 12, fontWeight: 800,
                  border: "none", cursor: "pointer",
                  background: selectedTeam === "Mexico" ? GREEN : GREEN_DIM,
                  color: selectedTeam === "Mexico" ? "#fff" : "#4d7a3a",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                }}
              >
                🇲🇽 Mexico
              </button>
              <button
                onClick={() => setSelectedTeam("Ecuador")}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 12, fontWeight: 800,
                  border: "none", cursor: "pointer",
                  background: selectedTeam === "Ecuador" ? YELLOW : YELLOW_DIM,
                  color: selectedTeam === "Ecuador" ? "#000" : "#4d7a3a",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                }}
              >
                🇪🇨 Ecuador
              </button>
            </div>

            {selectedTeam && selectedAmount > 0 && (
              <p style={{ fontSize: 11, color: "#4d7a3a", textAlign: "center", margin: "0 0 8px" }}>
                Bij winst krijg je <span style={{ color: "#10B981", fontWeight: 800 }}>{selectedAmount * 2} 🪙</span>
              </p>
            )}

            {error && (
              <p style={{ fontSize: 11, color: "#EF4444", textAlign: "center", margin: "0 0 8px" }}>{error}</p>
            )}

            <button
              onClick={placeBet}
              disabled={!selectedTeam || !selectedAmount || placing}
              style={{
                width: "100%", padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 900,
                border: "none", cursor: selectedTeam && selectedAmount ? "pointer" : "not-allowed",
                background: selectedTeam && selectedAmount
                  ? (selectedTeam === "Mexico" ? GREEN : YELLOW)
                  : "rgba(22,163,74,0.10)",
                color: selectedTeam && selectedAmount
                  ? (selectedTeam === "Ecuador" ? "#000" : "#fff")
                  : "#4B5563",
              }}
            >
              {placing ? "Bezig..." : selectedTeam && selectedAmount ? `Inzetten! ${selectedAmount} 🪙` : "Kies team en inzet"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
