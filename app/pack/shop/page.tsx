"use client";

import { useState, useEffect } from "react";
import { SHOP_PACKS, type Pack } from "@/lib/packs";
import ShopCard from "@/components/pack/ShopCard";
import PackOpener from "@/components/pack/PackOpener";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface ShopItem {
  id: string;
  type: string;
  label: string;
  emoji: string;
  rarity: string;
  rarityLabel: string;
  rarityColor: string;
  price: number;
  owned: boolean;
}

export default function ShopPage() {
  const [tab, setTab] = useState<"packs" | "items">("packs");
  const [coinBalance, setCoinBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasingPackId, setPurchasingPackId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openingPack, setOpeningPack] = useState<Pack | null>(null);

  // Item shop state
  const [mascots, setMascots] = useState<ShopItem[]>([]);
  const [cosmetics, setCosmetics] = useState<ShopItem[]>([]);
  const [resetIn, setResetIn] = useState("");
  const [buyingItemId, setBuyingItemId] = useState<string | null>(null);
  const [buySuccess, setBuySuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchCoinBalance();
    fetchDailyItems();
  }, []);

  const fetchCoinBalance = async () => {
    try {
      setLoading(true);
      const r = await fetch("/api/coins/balance", { credentials: "include" });
      if (r.ok) {
        const data = await r.json();
        setCoinBalance(data.balance ?? 0);
      }
    } catch { /* empty */ }
    finally { setLoading(false); }
  };

  const fetchDailyItems = async () => {
    try {
      const r = await fetch("/api/shop/daily-items", { credentials: "include" });
      if (r.ok) {
        const data = await r.json();
        setMascots(data.mascots ?? []);
        setCosmetics(data.cosmetics ?? []);
        setResetIn(data.resetIn ?? "");
        setCoinBalance(data.balance ?? 0);
      }
    } catch { /* empty */ }
  };

  const playCoinPaymentSound = () => {
    try {
      const audio = new Audio("/sounds/pack/coin-payment.wav");
      audio.volume = 0.6;
      audio.play().catch(() => {});
    } catch { /* empty */ }
  };

  const handlePackPurchase = async (packId: string) => {
    try {
      setError(null);
      setPurchasingPackId(packId);
      const r = await fetch("/api/pack/purchase", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const data = await r.json();
      if (data.success) {
        playCoinPaymentSound();
        setCoinBalance(data.balance);
        window.dispatchEvent(new Event("pack-opened"));
        const pack = SHOP_PACKS.find(p => p.id === packId);
        if (pack) setOpeningPack(pack);
      } else {
        setError(data.error || "Aankoop mislukt");
      }
    } catch { setError("Netwerk fout"); }
    finally { setPurchasingPackId(null); }
  };

  const handleItemBuy = async (itemId: string) => {
    try {
      setError(null);
      setBuyingItemId(itemId);
      setBuySuccess(null);
      const r = await fetch("/api/shop/buy-item", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await r.json();
      if (data.success) {
        playCoinPaymentSound();
        setCoinBalance(data.balance);
        setBuySuccess(data.label);
        // Mark as owned
        setMascots(prev => prev.map(m => m.id === itemId ? { ...m, owned: true } : m));
        setCosmetics(prev => prev.map(c => c.id === itemId ? { ...c, owned: true } : c));
      } else {
        setError(data.error || "Aankoop mislukt");
      }
    } catch { setError("Netwerk fout"); }
    finally { setBuyingItemId(null); }
  };

  if (openingPack) {
    return (
      <div style={{
        minHeight: "100dvh",
        background: "radial-gradient(ellipse at 50% 30%, #08122A 0%, #040810 55%, #020508 100%)",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        <PackOpener pack={openingPack} onReset={() => { setOpeningPack(null); fetchCoinBalance(); }} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: "radial-gradient(ellipse at 50% 30%, #08122A 0%, #040810 55%, #020508 100%)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px 0", maxWidth: 500, margin: "0 auto" }}>
        <Link href="/pack" style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 36, height: 36, borderRadius: 10,
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)",
          color: "#9CA3AF", textDecoration: "none",
        }}>
          <ArrowLeft size={18} />
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ color: "#fff", fontWeight: 900, fontSize: 20, margin: 0 }}>Shop</h1>
          <p style={{ color: "#6B7280", fontSize: 12, margin: 0 }}>Koop packs, cosmetics &amp; mascots</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#FBBF24" }}>{loading ? "..." : coinBalance}</span>
          <span style={{ fontSize: 16 }}>🪙</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, padding: "16px 20px 0", maxWidth: 500, margin: "0 auto" }}>
        <button
          onClick={() => setTab("packs")}
          style={{
            flex: 1, padding: "10px 0", borderRadius: 12, fontSize: 13, fontWeight: 800,
            border: tab === "packs" ? "none" : "1px solid rgba(255,255,255,0.10)",
            cursor: "pointer",
            background: tab === "packs" ? "linear-gradient(135deg, #F59E0B, #D97706)" : "rgba(255,255,255,0.06)",
            color: tab === "packs" ? "#fff" : "#6B7280",
          }}
        >
          Pack Shop
        </button>
        <button
          onClick={() => setTab("items")}
          style={{
            flex: 1, padding: "10px 0", borderRadius: 12, fontSize: 13, fontWeight: 800,
            border: tab === "items" ? "none" : "1px solid rgba(255,255,255,0.10)",
            cursor: "pointer",
            background: tab === "items" ? "linear-gradient(135deg, #F59E0B, #D97706)" : "rgba(255,255,255,0.06)",
            color: tab === "items" ? "#fff" : "#6B7280",
          }}
        >
          Item Shop
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ maxWidth: 500, margin: "12px auto 0", padding: "0 20px" }}>
          <div style={{ padding: 12, borderRadius: 12, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.30)" }}>
            <p style={{ color: "#FCA5A5", fontSize: 12, fontWeight: 700, margin: 0 }}>{error}</p>
          </div>
        </div>
      )}

      {/* Buy success */}
      {buySuccess && (
        <div style={{ maxWidth: 500, margin: "12px auto 0", padding: "0 20px" }}>
          <div style={{ padding: 12, borderRadius: 12, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.30)" }}>
            <p style={{ color: "#6EE7B7", fontSize: 12, fontWeight: 700, margin: 0 }}>✅ {buySuccess} gekocht! Check je locker.</p>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 500, margin: "0 auto", padding: "16px 20px 100px" }}>

        {/* PACK SHOP */}
        {tab === "packs" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {SHOP_PACKS.map((pack) => (
              <ShopCard
                key={pack.id}
                pack={pack}
                onPurchase={handlePackPurchase}
                disabled={purchasingPackId !== null}
                insufficientCoins={coinBalance < (pack.cost?.amount ?? 0)}
              />
            ))}
          </div>
        )}

        {/* ITEM SHOP */}
        {tab === "items" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Reset timer */}
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "#6B7280", fontSize: 11, margin: 0 }}>
                Shop reset over <span style={{ color: "#FBBF24", fontWeight: 700 }}>{resetIn}</span>
              </p>
            </div>

            {/* Mascots */}
            <div>
              <p style={{ color: "#6B7280", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
                Mascots
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {mascots.map((item) => (
                  <div key={item.id} style={{
                    padding: "14px 8px", borderRadius: 14,
                    background: "rgba(255,255,255,0.04)",
                    border: `1.5px solid ${item.owned ? "rgba(16,185,129,0.30)" : "rgba(245,158,11,0.25)"}`,
                    textAlign: "center",
                    opacity: buyingItemId === item.id ? 0.5 : 1,
                  }}>
                    <div style={{ fontSize: 36, marginBottom: 6 }}>{item.emoji}</div>
                    <p style={{ color: "#fff", fontSize: 11, fontWeight: 800, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.label}
                    </p>
                    <p style={{ color: item.rarityColor, fontSize: 10, fontWeight: 700, margin: "2px 0 0" }}>
                      {item.rarityLabel}
                    </p>
                    {item.owned ? (
                      <div style={{ marginTop: 8, padding: "6px 0", borderRadius: 8, background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.20)" }}>
                        <p style={{ color: "#10B981", fontSize: 10, fontWeight: 800, margin: 0 }}>✓ In bezit</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleItemBuy(item.id)}
                        disabled={buyingItemId !== null || coinBalance < item.price}
                        style={{
                          marginTop: 8, padding: "6px 0", borderRadius: 8, width: "100%",
                          background: coinBalance >= item.price ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${coinBalance >= item.price ? "rgba(16,185,129,0.30)" : "rgba(255,255,255,0.08)"}`,
                          cursor: coinBalance >= item.price ? "pointer" : "not-allowed",
                        }}
                      >
                        <p style={{ color: coinBalance >= item.price ? "#10B981" : "#4B5563", fontSize: 11, fontWeight: 800, margin: 0 }}>
                          {item.price} 🪙
                        </p>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Cosmetics */}
            <div>
              <p style={{ color: "#6B7280", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
                Cosmetics
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {cosmetics.map((item) => (
                  <div key={item.id} style={{
                    padding: "14px 8px", borderRadius: 14,
                    background: "rgba(255,255,255,0.04)",
                    border: `1.5px solid ${item.owned ? "rgba(16,185,129,0.30)" : "rgba(255,255,255,0.08)"}`,
                    textAlign: "center",
                    opacity: buyingItemId === item.id ? 0.5 : 1,
                  }}>
                    <div style={{ fontSize: 36, marginBottom: 6 }}>{item.emoji}</div>
                    <p style={{ color: "#fff", fontSize: 11, fontWeight: 800, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.label}
                    </p>
                    <p style={{ color: item.rarityColor, fontSize: 10, fontWeight: 700, margin: "2px 0 0" }}>
                      {item.rarityLabel}
                    </p>
                    {item.owned ? (
                      <div style={{ marginTop: 8, padding: "6px 0", borderRadius: 8, background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.20)" }}>
                        <p style={{ color: "#10B981", fontSize: 10, fontWeight: 800, margin: 0 }}>✓ In bezit</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleItemBuy(item.id)}
                        disabled={buyingItemId !== null || coinBalance < item.price}
                        style={{
                          marginTop: 8, padding: "6px 0", borderRadius: 8, width: "100%",
                          background: coinBalance >= item.price ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${coinBalance >= item.price ? "rgba(16,185,129,0.30)" : "rgba(255,255,255,0.08)"}`,
                          cursor: coinBalance >= item.price ? "pointer" : "not-allowed",
                        }}
                      >
                        <p style={{ color: coinBalance >= item.price ? "#10B981" : "#4B5563", fontSize: 11, fontWeight: 800, margin: 0 }}>
                          {item.price} 🪙
                        </p>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <p style={{ color: "#4B5563", fontSize: 11, textAlign: "center", margin: "4px 0 0" }}>
              Elke dag 6 nieuwe items om 05:00
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
