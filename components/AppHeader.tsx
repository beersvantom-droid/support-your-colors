"use client";

import { Camera } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

function useCooldown() {
  const [remaining, setRemaining] = useState<number>(0); // ms left, 0 = available

  useEffect(() => {
    function compute() {
      const raw = localStorage.getItem("pack_last_open");
      if (!raw) { setRemaining(0); return; }
      const elapsed = Date.now() - parseInt(raw, 10);
      setRemaining(Math.max(0, COOLDOWN_MS - elapsed));
    }
    compute();
    const id = setInterval(compute, 30_000);
    return () => clearInterval(id);
  }, []);

  return remaining;
}

function useCoinBalance() {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/coins/balance", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        console.error("Failed to fetch coin balance:", response.statusText);
        setBalance(0);
        return;
      }

      const data = await response.json();
      setBalance(data.balance ?? 0);
    } catch (error) {
      console.error("Error fetching coin balance:", error);
      setBalance(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
    // Refetch every 30 seconds to stay in sync
    const id = setInterval(fetchBalance, 30_000);
    return () => clearInterval(id);
  }, [fetchBalance]);

  // Listen for custom events from pack opener to refresh balance
  useEffect(() => {
    const handlePackOpened = () => {
      fetchBalance();
    };

    window.addEventListener("pack-opened", handlePackOpened);
    return () => window.removeEventListener("pack-opened", handlePackOpened);
  }, [fetchBalance]);

  return { balance, loading };
}

function formatCooldown(ms: number) {
  const totalMin = Math.ceil(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function AppHeader() {
  const remaining = useCooldown();
  const onCooldown = remaining > 0;
  const { balance, loading: balanceLoading } = useCoinBalance();

  return (
    <header className="sticky top-0 z-30 w-full max-w-md mx-auto">
      <style>{`
        @keyframes wheelPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(251,191,36,0.55), 0 2px 10px rgba(251,191,36,0.40); }
          50%       { box-shadow: 0 0 0 6px rgba(251,191,36,0.08), 0 2px 14px rgba(251,191,36,0.55); }
        }
        @keyframes wheelBounce {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.18); }
        }
      `}</style>

      <div className="bg-white/80 backdrop-blur-xl border-b border-black/5 px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#D52B1E] via-[#1A3A6E] to-[#006847] flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-black">⚽</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[13px] font-black tracking-tight text-text-primary">
              Support Your Colors
            </span>
            <span className="text-[10px] font-semibold text-text-muted tracking-widest uppercase">
              WK 2026
            </span>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Coin balance */}
          <div className="flex items-center gap-1.5 bg-amber-50 rounded-full px-2.5 py-1">
            <span style={{ fontSize: 14, fontWeight: 700, color: "#B45309" }}>
              {balanceLoading ? "..." : balance}
            </span>
            <span style={{ fontSize: 14 }}>🪙</span>
          </div>

          {/* Live badge */}
          <div className="flex items-center gap-1 bg-[#D52B1E]/10 rounded-full px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D52B1E] animate-pulse" />
            <span className="text-[10px] font-bold tracking-wide text-[#D52B1E]">
              LIVE
            </span>
          </div>

          {/* Quick post button */}
          <Link
            href="/create-post"
            className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90"
            style={{
              background: "linear-gradient(135deg, #D52B1E, #b01f15)",
              boxShadow: "0 2px 8px rgba(213,43,30,0.35)",
            }}
          >
            <Camera size={15} className="text-white" strokeWidth={2.5} />
          </Link>

          {/* Daily Pack button */}
          <Link
            href="/pack"
            className="relative w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90"
            style={
              onCooldown
                ? { background: "#1F2937" }
                : {
                    background: "linear-gradient(135deg, #F59E0B, #D97706)",
                    animation: "wheelPulse 2.2s ease-in-out infinite",
                  }
            }
            title={onCooldown ? `Volgende pack over ${formatCooldown(remaining)}` : "Open een pack"}
          >
            <span
              style={
                onCooldown
                  ? { fontSize: 15, opacity: 0.4 }
                  : {
                      fontSize: 15,
                      display: "inline-block",
                      animation: "wheelBounce 1.8s ease-in-out infinite",
                    }
              }
            >
              🎁
            </span>

            {onCooldown && (
              <span
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-bold"
                style={{ color: "#6B7280" }}
              >
                {formatCooldown(remaining)}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
