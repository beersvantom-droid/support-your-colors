"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import { getCountryFlag } from "@/lib/countries";
import {
  COSMETICS,
  MASCOTS,
  getMascotById,
  nameColorProps,
  borderContainerProps,
  badgeInfo,
  cardBgLayerProps,
  RARITY_META,
  type CosmeticType,
  type Rarity,
  type Cosmetic,
  type Mascot,
} from "@/lib/cosmetics";
import MascotSprite from "@/components/mascot/MascotSprite";

// ─── Equipped state (mirrors profiles columns) ────────────────────────────────

interface Equipped {
  name_color: string | null;
  border:     string | null;
  badge:      string | null;
  card_bg:    string | null;
}

const MAX_MASCOTS = 3;

// ─── Live preview card ────────────────────────────────────────────────────────

function PreviewCard({ username, country, points, equipped }: {
  username: string;
  country: string | null;
  points: number;
  equipped: Equipped;
}) {
  const ncProps  = nameColorProps(equipped.name_color);
  const bdrProps = borderContainerProps(equipped.border);
  const badge    = badgeInfo(equipped.badge);
  const bgLayer  = cardBgLayerProps(equipped.card_bg);

  return (
    <div
      className={`rounded-2xl p-4 relative overflow-hidden ${bdrProps.className}`}
      style={{ background: "rgba(255,255,255,0.06)", ...bdrProps.style }}
    >
      {bgLayer && (
        <div
          className={`absolute inset-0 pointer-events-none ${bgLayer.className ?? ""}`}
          style={bgLayer.style}
        />
      )}
      <div className="relative flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          {getCountryFlag(country)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black flex items-center gap-1.5">
            {badge && (
              <span className={`text-sm leading-none ${badge.className}`}>{badge.emoji}</span>
            )}
            <span
              className={ncProps.className ?? ""}
              style={{ ...ncProps.style, color: ncProps.style?.color ?? "#FFFFFF" }}
            >
              {username}
            </span>
          </p>
          <p className="text-[10px] font-semibold mt-0.5" style={{ color: "#6B7280" }}>
            Card preview
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-sm font-black text-white">{points}</p>
          <p className="text-[9px] font-semibold" style={{ color: "#6B7280" }}>SP</p>
        </div>
      </div>
    </div>
  );
}

// ─── Single cosmetic pill ─────────────────────────────────────────────────────

function CosmeticPill({ cosmetic, isEquipped, onEquip }: {
  cosmetic: Cosmetic | null; // null → "Default" slot
  isEquipped: boolean;
  onEquip: () => void;
}) {
  const meta = cosmetic ? RARITY_META[cosmetic.rarity] : { color: "#6B7280", glow: "#4B5563", label: "" };

  return (
    <button
      onClick={onEquip}
      className="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-95"
      style={{
        background: isEquipped ? `${meta.glow}20` : "rgba(255,255,255,0.04)",
        border: isEquipped
          ? `1.5px solid ${meta.glow}60`
          : "1.5px solid rgba(255,255,255,0.07)",
        boxShadow: isEquipped ? `0 0 14px ${meta.glow}25` : "none",
        minWidth: 68,
      }}
    >
      <span className="text-2xl leading-none select-none">
        {cosmetic ? cosmetic.emoji : "↩️"}
      </span>
      <span
        className="text-[9px] font-black leading-tight text-center"
        style={{ color: isEquipped ? meta.glow : "#6B7280" }}
      >
        {cosmetic ? cosmetic.label : "Default"}
      </span>
      {cosmetic && (
        <span className="text-[8px] font-black uppercase tracking-wide" style={{ color: meta.color }}>
          {RARITY_META[cosmetic.rarity].label}
        </span>
      )}
      {isEquipped && (
        <span className="text-[8px] font-black" style={{ color: meta.glow }}>✓ Active</span>
      )}
    </button>
  );
}

// ─── Cosmetic type section ────────────────────────────────────────────────────

function Section({ title, ownedItems, equippedId, type, onEquip }: {
  title: string;
  ownedItems: Cosmetic[];
  equippedId: string | null;
  type: CosmeticType;
  onEquip: (type: CosmeticType, id: string | null) => void;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest mb-3 px-1" style={{ color: "#4B5563" }}>
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        <CosmeticPill
          cosmetic={null}
          isEquipped={!equippedId}
          onEquip={() => onEquip(type, null)}
        />
        {ownedItems.map(c => (
          <CosmeticPill
            key={c.id}
            cosmetic={c}
            isEquipped={equippedId === c.id}
            onEquip={() => onEquip(type, c.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const RARITY_ORDER: Rarity[] = ["common", "rare", "epic", "legendary"];

const TYPE_LABELS: Record<CosmeticType, string> = {
  name_color: "Name Color",
  border:     "Card Border",
  badge:      "Badge",
  card_bg:    "Card Background",
};

export default function LockerScreen() {
  const { profile, refreshProfile } = useAuth();

  const [inventory,      setInventory]      = useState<Set<string>>(new Set());
  const [equipped,       setEquipped]       = useState<Equipped>({ name_color: null, border: null, badge: null, card_bg: null });
  const [equippedMascots, setEquippedMascots] = useState<string[]>([]);
  const [equippedPostMascots, setEquippedPostMascots] = useState<string[]>([]);
  const [postMascotSlots, setPostMascotSlots] = useState(0);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [equipError,     setEquipError]     = useState<string | null>(null);
  const [activeTab,      setActiveTab]      = useState<"cosmetics" | "mascots">("cosmetics");
  // Track user id so we only re-load when the user actually changes
  const loadedForId = useRef<string | null>(null);

  useEffect(() => {
    if (!profile || loadedForId.current === profile.id) return;
    loadedForId.current = profile.id;

    async function load() {
      // Always fetch fresh equipped state directly from DB — not the cached AuthProvider profile
      const [{ data: inv }, { data: fresh }] = await Promise.all([
        supabase.from("user_cosmetics").select("cosmetic_id").eq("user_id", profile!.id),
        supabase
          .from("profiles")
          .select("equipped_name_color, equipped_border, equipped_badge, equipped_card_bg, equipped_mascots, equipped_post_mascots, post_mascot_slots")
          .eq("id", profile!.id)
          .single(),
      ]);

      setInventory(new Set((inv ?? []).map((r: { cosmetic_id: string }) => r.cosmetic_id)));
      setEquipped({
        name_color: fresh?.equipped_name_color ?? null,
        border:     fresh?.equipped_border     ?? null,
        badge:      fresh?.equipped_badge      ?? null,
        card_bg:    fresh?.equipped_card_bg    ?? null,
      });
      setEquippedMascots((fresh?.equipped_mascots as string[] | null) ?? []);
      setEquippedPostMascots((fresh?.equipped_post_mascots as string[] | null) ?? []);
      setPostMascotSlots((fresh?.post_mascot_slots as number) ?? 0);
      setLoading(false);
    }
    load();
  }, [profile]);

  const equipType = useCallback((type: CosmeticType, id: string | null) => {
    // Capture current value so we can revert to it (not to null) on failure
    setEquipError(null);
    setEquipped(prev => {
      const previous = prev[type];
      // Store previous in a closure-captured variable for revert
      void previous; // used below via closure
      return { ...prev, [type]: id };
    });

    // We need the previous value before the optimistic update for revert.
    // Read it synchronously from the current state ref via a local variable.
    // (setEquipped above already applied the optimistic update to React state,
    //  but `equipped` captured here is the value *before* that render.)
    const previousId = equipped[type];

    setSaving(true);
    fetch("/api/cosmetics/equip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cosmeticId: id, type }),
    })
      .then(async r => {
        let data: { success?: boolean; error?: string } = {};
        try { data = await r.json(); } catch { /* empty body */ }

        console.log("[locker] equip response — status:", r.status, "body:", data);

        if (data.success) {
          refreshProfile();
        } else {
          const msg = data.error ?? `HTTP ${r.status}`;
          console.error("[locker] equip failed:", msg);
          setEquipError(msg);
          setEquipped(prev => ({ ...prev, [type]: previousId }));
        }
      })
      .catch(err => {
        console.error("[locker] equip network error:", err);
        setEquipError("Network error — try again");
        setEquipped(prev => ({ ...prev, [type]: previousId }));
      })
      .finally(() => setSaving(false));
  }, [refreshProfile, equipped]);

  // ── Mascot equip toggle (max 3) ──────────────────────────────────────────────
  const toggleMascot = useCallback((id: string) => {
    setEquipError(null);
    const isEquipped = equippedMascots.includes(id);
    const prev = equippedMascots;

    let next: string[];
    if (isEquipped) {
      next = equippedMascots.filter(m => m !== id);
    } else {
      if (equippedMascots.length >= MAX_MASCOTS) {
        setEquipError(`Max ${MAX_MASCOTS} mascots at once`);
        return;
      }
      next = [...equippedMascots, id];

      // Play Jannes sound when equipping
      if (id === "mascot_jannes") {
        try {
          const audio = new Audio("/sounds/reveal/jannes.wav");
          audio.volume = 0.7;
          audio.play().catch(() => {});
        } catch (err) {
          // Silent fail
        }
      }
    }

    setEquippedMascots(next);
    setSaving(true);

    fetch("/api/cosmetics/equip-mascot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mascots: next }),
    })
      .then(async r => {
        let data: { success?: boolean; error?: string } = {};
        try { data = await r.json(); } catch { /* empty */ }
        if (data.success) {
          refreshProfile();
        } else {
          setEquipError(data.error ?? `HTTP ${r.status}`);
          setEquippedMascots(prev);
        }
      })
      .catch(() => {
        setEquipError("Network error — try again");
        setEquippedMascots(prev);
      })
      .finally(() => setSaving(false));
  }, [equippedMascots, refreshProfile]);

  const togglePostMascot = useCallback((id: string) => {
    setEquipError(null);
    const isEquipped = equippedPostMascots.includes(id);
    const prev = equippedPostMascots;

    // Can't equip if also on ranking card
    if (!isEquipped && equippedMascots.includes(id)) {
      setEquipError("Deze mascot staat al op je ranking card");
      return;
    }

    let next: string[];
    if (isEquipped) {
      next = equippedPostMascots.filter(m => m !== id);
    } else {
      if (equippedPostMascots.length >= postMascotSlots) {
        setEquipError(`Je hebt ${postMascotSlots} post-slots. Koop meer!`);
        return;
      }
      next = [...equippedPostMascots, id];
    }

    setEquippedPostMascots(next);
    setSaving(true);

    fetch("/api/cosmetics/equip-post-mascot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mascots: next }),
    })
      .then(async r => {
        let data: { success?: boolean; error?: string } = {};
        try { data = await r.json(); } catch { /* empty */ }
        if (data.success) {
          refreshProfile();
        } else {
          setEquipError(data.error ?? `HTTP ${r.status}`);
          setEquippedPostMascots(prev);
        }
      })
      .catch(() => {
        setEquipError("Network error — try again");
        setEquippedPostMascots(prev);
      })
      .finally(() => setSaving(false));
  }, [equippedPostMascots, equippedMascots, postMascotSlots, refreshProfile]);

  const buyPostSlot = useCallback(() => {
    setSaving(true);
    setEquipError(null);

    fetch("/api/cosmetics/buy-post-slot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
      .then(async r => {
        const data = await r.json();
        if (data.success) {
          setPostMascotSlots(data.newSlotCount);
          refreshProfile();
        } else {
          setEquipError(data.error ?? "Kon slot niet kopen");
        }
      })
      .catch(() => setEquipError("Network error"))
      .finally(() => setSaving(false));
  }, [refreshProfile]);

  if (!profile || loading) {
    return (
      <div className="space-y-2 px-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
        ))}
      </div>
    );
  }

  // Build owned cosmetics per type (wheel-eligible only, sorted by rarity)
  const ownedByType = (type: CosmeticType): Cosmetic[] =>
    COSMETICS
      .filter(c => c.type === type && c.wheelEligible && inventory.has(c.id))
      .sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity));

  const hasAnyUnlocked = COSMETICS.some(c => c.wheelEligible && inventory.has(c.id));

  const types: CosmeticType[] = ["name_color", "border", "badge", "card_bg"];

  const ownedMascots = MASCOTS.filter(m => inventory.has(m.id));

  return (
    <div className="space-y-5">
      {/* Preview */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest mb-2.5 px-1" style={{ color: "#4B5563" }}>
          Preview
        </p>
        <PreviewCard
          username={profile.username}
          country={profile.country}
          points={profile.supporter_points}
          equipped={equipped}
        />
        {saving && (
          <p className="text-[10px] text-center mt-2 font-semibold" style={{ color: "#6B7280" }}>
            Saving…
          </p>
        )}
        {equipError && !saving && (
          <p className="text-[10px] text-center mt-2 font-semibold" style={{ color: "#EF4444" }}>
            ⚠️ {equipError}
          </p>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 px-1">
        {(["cosmetics", "mascots"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all"
            style={{
              background:  activeTab === tab ? "rgba(245,158,11,0.18)" : "rgba(255,255,255,0.04)",
              border:      activeTab === tab ? "1.5px solid rgba(245,158,11,0.5)" : "1.5px solid rgba(255,255,255,0.07)",
              color:       activeTab === tab ? "#F59E0B" : "#6B7280",
            }}
          >
            {tab === "cosmetics" ? "🎨 Cosmetics" : "🎭 Mascots"}
          </button>
        ))}
      </div>

      {/* ── Cosmetics tab ─────────────────────────────────────────────────────── */}
      {activeTab === "cosmetics" && (
        <div className="space-y-7">
          {/* Empty state */}
          {!hasAnyUnlocked && (
            <div
              className="rounded-2xl p-6 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p className="text-4xl mb-3">🎡</p>
              <p className="text-sm font-black text-white">Locker is empty</p>
              <p className="text-xs mt-1.5 font-semibold" style={{ color: "#6B7280" }}>
                Spin the Wheel of Chaos to unlock cosmetics
              </p>
            </div>
          )}

          {/* One section per type — only shown if at least one cosmetic of that type is owned */}
          {types.map(type => {
            const items = ownedByType(type);
            if (items.length === 0) return null;
            return (
              <Section
                key={type}
                title={TYPE_LABELS[type]}
                ownedItems={items}
                equippedId={equipped[type]}
                type={type}
                onEquip={equipType}
              />
            );
          })}
        </div>
      )}

      {/* ── Mascots tab ───────────────────────────────────────────────────────── */}
      {activeTab === "mascots" && (
        <div className="space-y-4">
          {/* Header info */}
          <div className="px-1">
            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "#4B5563" }}>
              Mascots
            </p>
            <p className="text-[10px] font-semibold" style={{ color: "#6B7280" }}>
              Equip up to {MAX_MASCOTS} — they appear on your leaderboard card
            </p>
            <p className="text-[10px] font-semibold mt-0.5" style={{ color: equippedMascots.length >= MAX_MASCOTS ? "#F59E0B" : "#6B7280" }}>
              {equippedMascots.length}/{MAX_MASCOTS} equipped
            </p>
          </div>

          {/* All mascots — owned + locked */}
          {(() => {
            const regularMascots = MASCOTS.filter(m => m.rarity !== "special");
            const specialMascots = MASCOTS.filter(m => m.rarity === "special");

            const renderMascot = (mascot: Mascot, i: number) => {
              const isOwned    = inventory.has(mascot.id);
              const isEquipped = equippedMascots.includes(mascot.id);
              const isFull     = !isEquipped && equippedMascots.length >= MAX_MASCOTS;
              const rarityMeta = RARITY_META[mascot.rarity];

              return (
                <div key={mascot.id} className="relative">
                  <button
                    onClick={() => isOwned && toggleMascot(mascot.id)}
                    disabled={!isOwned || isFull}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all active:scale-95"
                    style={{
                      background: isOwned
                        ? isEquipped
                          ? "rgba(245,158,11,0.15)"
                          : "rgba(255,255,255,0.04)"
                        : "rgba(0,0,0,0.25)",
                      border: isOwned
                        ? isEquipped
                          ? "1.5px solid rgba(245,158,11,0.6)"
                          : "1.5px solid rgba(255,255,255,0.07)"
                        : "1.5px solid rgba(100,100,100,0.30)",
                      boxShadow: isOwned && isEquipped ? "0 0 14px rgba(245,158,11,0.2)" : "none",
                      opacity: isOwned ? (isFull ? 0.4 : 1) : 0.5,
                      minWidth: 80,
                      cursor: isOwned ? "pointer" : "not-allowed",
                    }}
                  >
                    <div style={{ opacity: isOwned ? 1 : 0.4 }}>
                      <MascotSprite id={mascot.id} size={52} animationDelay={i * 800} />
                    </div>
                    <span
                      className="text-[9px] font-black text-center"
                      style={{ color: isOwned ? (isEquipped ? "#F59E0B" : "#9CA3AF") : "#6B7280" }}
                    >
                      {mascot.label}
                    </span>
                    <span
                      className="text-[8px] font-black uppercase tracking-wide"
                      style={{ color: isOwned ? rarityMeta.color : "#4B5563" }}
                    >
                      {rarityMeta.label}
                    </span>
                    {isEquipped && (
                      <span className="text-[8px] font-black" style={{ color: "#F59E0B" }}>✓ Active</span>
                    )}
                  </button>
                  {!isOwned && (
                    <div
                      className="absolute inset-0 flex items-center justify-center rounded-2xl pointer-events-none"
                      style={{ background: "rgba(0,0,0,0.4)" }}
                    >
                      <span className="text-xl">🔒</span>
                    </div>
                  )}
                </div>
              );
            };

            return (
              <>
                {regularMascots.length === 0 ? (
                  <div
                    className="rounded-2xl p-6 text-center"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <p className="text-4xl mb-3">🎭</p>
                    <p className="text-sm font-black text-white">No mascots yet</p>
                    <p className="text-xs mt-1.5 font-semibold" style={{ color: "#6B7280" }}>
                      Spin the Wheel of Chaos or complete hidden achievements
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {regularMascots.map((m, i) => renderMascot(m, i))}
                  </div>
                )}

                {specialMascots.length > 0 && (
                  <>
                    <div className="flex items-center gap-3 mt-6 mb-2">
                      <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, #FFD70060, transparent)" }} />
                      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#FFD700" }}>
                        ⭐ Specials
                      </span>
                      <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, #FFD70060, transparent)" }} />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {specialMascots.map((m, i) => renderMascot(m, regularMascots.length + i))}
                    </div>
                  </>
                )}
              </>
            );
          })()}

          {/* ── Post Mascots Section ──────────────────────────────── */}
          {equippedMascots.length >= 3 && (
            <>
              <div className="flex items-center gap-3 mt-8 mb-3">
                <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, #10B98160, transparent)" }} />
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#10B981" }}>
                  📸 Post Mascots
                </span>
                <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, #10B98160, transparent)" }} />
              </div>

              <p className="text-[11px] font-semibold mb-3" style={{ color: "#6B7280" }}>
                Mascots die naast je naam verschijnen op nieuwe posts.
                {postMascotSlots === 0 && " Koop je eerste slot!"}
              </p>

              {/* Slot info + buy button */}
              {postMascotSlots < 5 && (
                <button
                  onClick={buyPostSlot}
                  disabled={saving}
                  className="w-full rounded-xl px-4 py-3 mb-3 transition-all active:scale-[0.98]"
                  style={{
                    background: "rgba(16,185,129,0.10)",
                    border: "1.5px solid rgba(16,185,129,0.30)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black" style={{ color: "#10B981" }}>
                        Koop Post Slot {postMascotSlots + 1}
                      </p>
                      <p className="text-[10px] font-semibold" style={{ color: "#6B7280" }}>
                        {equippedPostMascots.length}/{postMascotSlots} slots bezet
                      </p>
                    </div>
                    <span className="text-xs font-black" style={{ color: "#10B981" }}>
                      {[200, 400, 600, 800, 1000][postMascotSlots]} 🪙
                    </span>
                  </div>
                </button>
              )}

              {/* Equipped post mascots */}
              {postMascotSlots > 0 && (
                <div className="flex flex-wrap gap-3">
                  {MASCOTS.filter(m => inventory.has(m.id) && !equippedMascots.includes(m.id)).map((mascot, i) => {
                    const isPostEquipped = equippedPostMascots.includes(mascot.id);
                    const isFull = !isPostEquipped && equippedPostMascots.length >= postMascotSlots;

                    return (
                      <div key={mascot.id} className="relative">
                        <button
                          onClick={() => togglePostMascot(mascot.id)}
                          disabled={isFull && !isPostEquipped}
                          className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all active:scale-95"
                          style={{
                            background: isPostEquipped
                              ? "rgba(16,185,129,0.15)"
                              : "rgba(255,255,255,0.04)",
                            border: isPostEquipped
                              ? "1.5px solid rgba(16,185,129,0.6)"
                              : "1.5px solid rgba(255,255,255,0.07)",
                            boxShadow: isPostEquipped ? "0 0 14px rgba(16,185,129,0.2)" : "none",
                            opacity: isFull && !isPostEquipped ? 0.4 : 1,
                            minWidth: 80,
                            cursor: isFull && !isPostEquipped ? "not-allowed" : "pointer",
                          }}
                        >
                          <MascotSprite id={mascot.id} size={52} animationDelay={i * 800} />
                          <span
                            className="text-[9px] font-black text-center"
                            style={{ color: isPostEquipped ? "#10B981" : "#9CA3AF" }}
                          >
                            {mascot.label}
                          </span>
                          {isPostEquipped && (
                            <span className="text-[8px] font-black" style={{ color: "#10B981" }}>✓ Post</span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
