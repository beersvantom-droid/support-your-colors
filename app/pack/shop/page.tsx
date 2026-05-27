"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SHOP_PACKS, type Pack } from "@/lib/packs";
import ShopCard from "@/components/pack/ShopCard";
import PackOpener from "@/components/pack/PackOpener";

export default function ShopPage() {
  const router = useRouter();
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [purchasingPackId, setPurchasingPackId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openingPack, setOpeningPack] = useState<Pack | null>(null);

  useEffect(() => {
    fetchCoinBalance();
  }, []);

  const fetchCoinBalance = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/coins/balance", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch coin balance");
      }

      const data = await response.json();
      setCoinBalance(data.balance ?? 0);
    } catch (err) {
      console.error("Error fetching coin balance:", err);
      setCoinBalance(0);
    } finally {
      setLoading(false);
    }
  };

  const playCoinPaymentSound = () => {
    try {
      const audio = new Audio("/sounds/pack/coin-payment.wav");
      audio.volume = 0.6;
      audio.play().catch(() => {
        // Silent fail if audio doesn't play
      });
    } catch (err) {
      // Silent fail — don't interrupt purchase flow
    }
  };

  const handlePurchase = async (packId: string) => {
    try {
      setError(null);
      setPurchasingPackId(packId);

      const response = await fetch("/api/pack/purchase", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Purchase failed");
      }

      const data = await response.json();

      if (data.success) {
        // Play coin payment sound
        playCoinPaymentSound();

        // Update local coin balance
        setCoinBalance(data.balance);

        // Dispatch custom event for AppHeader to refresh
        window.dispatchEvent(new Event("pack-opened"));

        // Find the pack and open it directly (don't navigate away)
        const purchasedPack = SHOP_PACKS.find(p => p.id === packId);
        if (purchasedPack) {
          setOpeningPack(purchasedPack);
        }
      } else {
        throw new Error(data.error || "Purchase failed");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      console.error("Purchase error:", err);
    } finally {
      setPurchasingPackId(null);
    }
  };

  // Show PackOpener if a pack was purchased
  if (openingPack) {
    return (
      <div style={{
        minHeight: "100dvh",
        background: "radial-gradient(ellipse at 50% 30%, #08122A 0%, #040810 55%, #020508 100%)",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        <PackOpener
          pack={openingPack}
          onReset={() => {
            setOpeningPack(null);
            // Refresh coin balance after pack opens
            fetchCoinBalance();
          }}
        />
      </div>
    );
  }

  return (
    <main
      className="min-h-screen w-full max-w-md mx-auto pb-24"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      }}
    >
      {/* Header */}
      <div className="px-4 py-6 text-center">
        <h1 className="text-3xl font-black text-white mb-2">Shop</h1>
        <p className="text-sm text-white/60">
          Koop speciale packs met je munten
        </p>
      </div>

      {/* Coin Balance Display */}
      <div className="px-4 mb-6">
        <div
          className="rounded-xl p-4 text-center border"
          style={{
            background: "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(249,165,11,0.1))",
            borderColor: "rgba(251,191,36,0.3)",
          }}
        >
          <p className="text-white/60 text-xs mb-1">Jouw saldo</p>
          <p className="text-2xl font-black text-amber-300">
            {loading ? "..." : `${coinBalance} 🪙`}
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-4 mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50">
          <p className="text-xs text-red-100 font-bold">{error}</p>
        </div>
      )}

      {/* Shop packs grid */}
      <div className="px-4 grid grid-cols-2 gap-3">
        {SHOP_PACKS.map((pack) => {
          const cost = pack.cost?.amount ?? 0;
          const insufficientCoins = coinBalance < cost;

          return (
            <ShopCard
              key={pack.id}
              pack={pack}
              onPurchase={handlePurchase}
              disabled={purchasingPackId !== null}
              insufficientCoins={insufficientCoins}
            />
          );
        })}
      </div>

      {/* Coming soon note */}
      {SHOP_PACKS.length === 0 && (
        <div className="px-4 py-12 text-center">
          <p className="text-white/40 text-sm">
            Geen packs beschikbaar op dit moment
          </p>
        </div>
      )}

      {/* Footer note */}
      <div className="px-4 py-8 text-center text-white/40 text-[11px] leading-relaxed">
        <p>
          Verdien munten door dagelijks in te loggen (100 🪙) en door packs te openen (5% kans op 10 🪙)
        </p>
      </div>
    </main>
  );
}
