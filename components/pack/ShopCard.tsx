"use client";

import { Pack } from "@/lib/packs";
import { useState } from "react";

interface ShopCardProps {
  pack: Pack;
  onPurchase: (packId: string) => Promise<void>;
  disabled?: boolean;
  insufficientCoins?: boolean;
}

export default function ShopCard({
  pack,
  onPurchase,
  disabled,
  insufficientCoins,
}: ShopCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    if (disabled || isLoading || insufficientCoins) return;
    setIsLoading(true);
    try {
      await onPurchase(pack.id);
    } finally {
      setIsLoading(false);
    }
  };

  const costText = pack.cost ? `${pack.cost.amount} 🪙` : "Free";
  const buttonDisabled = disabled || isLoading || insufficientCoins;

  return (
    <div
      className="rounded-xl overflow-hidden transition-all hover:shadow-2xl"
      style={{
        background: "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.9))",
        border: "1px solid rgba(251,191,36,0.2)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        maxWidth: "280px",
        margin: "0 auto",
        animation: "packPulse 4s ease-in-out infinite",
      }}
    >
      <style>{`
        @keyframes packPulse {
          0%, 100% {
            transform: translateY(0px) scale(1);
            box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(251,191,36,0);
          }
          50% {
            transform: translateY(-4px) scale(1.01);
            box-shadow: 0 15px 40px rgba(0,0,0,0.6), 0 0 30px rgba(251,191,36,0.15);
          }
        }
      `}</style>
      {/* Pack image - takes up most of the card */}
      <div
        className="w-full h-64 bg-cover bg-center relative"
        style={{
          background: pack.imagePath
            ? `url("${pack.imagePath}") center/cover no-repeat`
            : "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        }}
      >
        {/* Cor chance badge - top right */}
        {pack.id === "cor_pack" && (
          <div
            className="absolute top-3 right-3 text-xs font-black px-2.5 py-1 rounded-full"
            style={{
              background: "rgba(251,191,36,0.25)",
              color: "#FCD34D",
              border: "1px solid rgba(251,191,36,0.5)",
            }}
          >
            30% Cor 👑
          </div>
        )}
      </div>

      {/* Bottom info section - minimal */}
      <div className="p-3 flex items-end justify-between">
        <h3 className="font-black text-sm text-white">
          {pack.label}
        </h3>
        <button
          onClick={handlePurchase}
          disabled={buttonDisabled}
          className="px-4 py-2 rounded-lg font-bold text-sm transition-all active:scale-95"
          style={{
            background: insufficientCoins
              ? "#4B5563"
              : "linear-gradient(135deg, #F59E0B, #D97706)",
            color: "#FFFFFF",
            cursor: buttonDisabled ? "not-allowed" : "pointer",
            opacity: insufficientCoins ? 0.6 : 1,
            boxShadow: insufficientCoins
              ? "none"
              : "0 6px 16px rgba(245,158,11,0.35)",
          }}
        >
          {isLoading ? "..." : costText}
        </button>
      </div>
    </div>
  );
}
