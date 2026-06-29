"use client";

import { useState, useEffect } from "react";

const AMOUNTS = [50, 100, 200, 500];

interface BetStatus {
  userBet: { team: string; amount: number } | null;
  matchStatus: "upcoming" | "live" | "finished";
  homeScore: number | null;
  awayScore: number | null;
  winner: string | null;
  paidOut: boolean;
  wonAmount: number;
}

export default function MatchBetCard() {
  const [status, setStatus] = useState<BetStatus | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/bet/status").then(r => r.json()).then(setStatus).catch(() => {});
    const interval = setInterval(() => {
      fetch("/api/bet/status").then(r => r.json()).then(setStatus).catch(() => {});
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (!status) return null;

  const hasBet = !!status.userBet;

  async function placeBet() {
    if (!selectedTeam || !selectedAmount) return;
    setPlacing(true);
    setError(null);
    try {
      const r = await fetch("/api/bet/place", {
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
      border: "2px solid #FF6600",
      background: "linear-gradient(145deg, #1a0a00, #2d1500, #1a0a00)",
    }}>
      {/* Header */}
      <div style={{
        padding: "10px 14px",
        background: "rgba(255,102,0,0.15)",
        borderBottom: "1px solid rgba(255,102,0,0.20)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF6600", display: "inline-block" }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: "#FF6600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Coin Bet
          </span>
        </div>
        <span style={{ fontSize: 10, color: "#8B5500" }}>03:00 CET</span>
      </div>

      {/* Teams */}
      <div style={{ padding: "16px 14px", display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28 }}>🇳🇱</div>
          <p style={{ fontSize: 12, fontWeight: 800, color: "#FF6600", margin: "4px 0 0" }}>Nederland</p>
        </div>
        <div style={{ textAlign: "center", padding: "0 6px" }}>
          {status.matchStatus === "upcoming" ? (
            <p style={{ fontSize: 14, fontWeight: 800, color: "#8B5500", margin: 0 }}>VS</p>
          ) : (
            <p style={{ fontSize: 20, fontWeight: 900, color: "#FF6600", margin: 0 }}>
              {status.homeScore ?? 0} - {status.awayScore ?? 0}
            </p>
          )}
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28 }}>🇲🇦</div>
          <p style={{ fontSize: 12, fontWeight: 800, color: "#FF6600", margin: "4px 0 0" }}>Marokko</p>
        </div>
      </div>

      {/* Bet area */}
      <div style={{ padding: "0 14px 14px" }}>
        {/* Already bet */}
        {hasBet && status.matchStatus !== "finished" && (
          <div style={{
            padding: "12px", borderRadius: 12,
            background: "rgba(255,102,0,0.10)", border: "1px solid rgba(255,102,0,0.25)",
            textAlign: "center",
          }}>
            <p style={{ fontSize: 12, color: "#8B5500", margin: 0 }}>Je hebt ingezet</p>
            <p style={{ fontSize: 16, fontWeight: 900, color: "#FF6600", margin: "4px 0" }}>
              {status.userBet!.amount} 🪙 op {status.userBet!.team === "Netherlands" ? "🇳🇱 Nederland" : "🇲🇦 Marokko"}
            </p>
            <p style={{ fontSize: 11, color: "#8B5500", margin: 0 }}>
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
            <p style={{ fontSize: 10, color: "#8B5500", margin: "0 0 6px" }}>Kies je inzet</p>

            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              {AMOUNTS.map(amt => (
                <button
                  key={amt}
                  onClick={() => setSelectedAmount(amt)}
                  style={{
                    flex: 1, padding: "6px 0", borderRadius: 8, fontSize: 12, fontWeight: 800,
                    border: "none", cursor: "pointer",
                    background: selectedAmount === amt ? "#FF6600" : "rgba(255,102,0,0.10)",
                    color: selectedAmount === amt ? "#fff" : "#8B5500",
                  }}
                >
                  {amt}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <button
                onClick={() => setSelectedTeam("Netherlands")}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 12, fontWeight: 800,
                  border: "none", cursor: "pointer",
                  background: selectedTeam === "Netherlands" ? "#FF6600" : "rgba(255,102,0,0.10)",
                  color: selectedTeam === "Netherlands" ? "#fff" : "#8B5500",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                }}
              >
                🇳🇱 Nederland
              </button>
              <button
                onClick={() => setSelectedTeam("Morocco")}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 12, fontWeight: 800,
                  border: "none", cursor: "pointer",
                  background: selectedTeam === "Morocco" ? "#C1272D" : "rgba(255,102,0,0.10)",
                  color: selectedTeam === "Morocco" ? "#fff" : "#8B5500",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                }}
              >
                🇲🇦 Marokko
              </button>
            </div>

            {selectedTeam && selectedAmount > 0 && (
              <p style={{ fontSize: 11, color: "#8B5500", textAlign: "center", margin: "0 0 8px" }}>
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
                background: selectedTeam && selectedAmount ? "#FF6600" : "rgba(255,102,0,0.10)",
                color: selectedTeam && selectedAmount ? "#fff" : "#4B5563",
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
