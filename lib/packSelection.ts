// ── Pack selection logic ──────────────────────────────────────────────────────
// Extracted and generalised from the old wheel/claim API.
// Given a rarity tier and the set of cosmetic IDs the user already owns,
// returns one unowned Cosmetic or Mascot (or null if all are owned).

import {
  WHEEL_COSMETICS,
  WHEEL_MASCOTS,
  MASCOTS,
  RARITY_FALLBACK,
  type Rarity,
  type Cosmetic,
  type Mascot,
} from "@/lib/cosmetics";
import { rollRarityFromPool, type Pack, type RarityPool } from "@/lib/packs";

// ── Internal: mascot pool with weighted rarity split ─────────────────────────
// Within the "mascots" tier: legendary 20%, epic 30%, rare 50%
function pickMascot(owned: Set<string>): Mascot | null {
  const legendary = WHEEL_MASCOTS.filter(m => m.rarity === "legendary" && !owned.has(m.id));
  const epic      = WHEEL_MASCOTS.filter(m => m.rarity === "epic"      && !owned.has(m.id));
  const rare      = WHEEL_MASCOTS.filter(m => m.rarity === "rare"      && !owned.has(m.id));

  const roll = Math.random();
  let pool: Mascot[];

  if      (roll < 0.20) pool = legendary;
  else if (roll < 0.50) pool = epic;
  else                  pool = rare;

  // Fallback when chosen tier is empty
  if (!pool.length) {
    if (legendary.length) pool = legendary;
    else if (epic.length) pool = epic;
    else if (rare.length) pool = rare;
    else return null;
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Internal: cosmetic pick with tier fallback ────────────────────────────────
// Tries the rolled rarity first. If that tier is exhausted, falls back down
// the rarity ladder (epic → rare → common) so we never return null unless
// literally every cosmetic is already owned.
function pickCosmeticWithFallback(
  rarity: Rarity,
  owned: Set<string>,
): { item: Cosmetic; rarity: Rarity } | null {
  for (const r of RARITY_FALLBACK[rarity]) {
    const pool = WHEEL_COSMETICS.filter(c => c.rarity === r && !owned.has(c.id));
    if (pool.length > 0) {
      return { item: pool[Math.floor(Math.random() * pool.length)], rarity: r };
    }
  }
  return null; // truly every cosmetic is owned
}

// ── Internal: Cor Pack special selection ──────────────────────────────────────
// The Cor Pack has custom odds:
// - 30% Golden Cor (mascot_golden_cor)
// - 30% Legendary cosmetics (epic + legendary)
// - 40% Common cosmetics (common + rare)
function pickFromCorPack(
  owned: Set<string>,
): { item: Cosmetic | Mascot; rarity: string } | null {
  const roll = Math.random();

  // 30% chance: Golden Cor
  if (roll < 0.30) {
    if (!owned.has("mascot_golden_cor")) {
      const corMascot = WHEEL_MASCOTS.find(m => m.id === "mascot_golden_cor");
      if (corMascot) return { item: corMascot, rarity: "mascots" };
    }
    // If Cor owned, fall through to legendary
  }

  // 30% chance: Legendary/Epic cosmetics (gouden items) - OR fallback when Cor is owned
  if (roll < 0.60) {
    const goldenItems = WHEEL_COSMETICS.filter(
      c => (c.rarity === "legendary" || c.rarity === "epic") && !owned.has(c.id)
    );
    if (goldenItems.length > 0) {
      const item = goldenItems[Math.floor(Math.random() * goldenItems.length)];
      return { item, rarity: item.rarity };
    }
  }

  // 40% chance: Common/Rare cosmetics (random)
  const randomItems = WHEEL_COSMETICS.filter(
    c => (c.rarity === "common" || c.rarity === "rare") && !owned.has(c.id)
  );
  if (randomItems.length > 0) {
    const item = randomItems[Math.floor(Math.random() * randomItems.length)];
    return { item, rarity: item.rarity };
  }

  // Fallback: any cosmetic
  const fallback = WHEEL_COSMETICS.filter(c => !owned.has(c.id));
  if (fallback.length > 0) {
    const item = fallback[Math.floor(Math.random() * fallback.length)];
    return { item, rarity: item.rarity };
  }

  // Last resort: any mascot
  const otherMascots = WHEEL_MASCOTS.filter(m => !owned.has(m.id));
  if (otherMascots.length > 0) {
    return { item: otherMascots[Math.floor(Math.random() * otherMascots.length)], rarity: "mascots" };
  }

  return null;
}

// ── Internal: Ron Pack special selection ────────────────────────────────────────
// The Ron Pack has custom odds:
// - 30% Ron Jans (mascot_ron_jans)
// - 60% Weighted cosmetics (using daily pack rarity distribution)
// - 10% Fallback
function pickFromRonPack(
  owned: Set<string>,
): { item: Cosmetic | Mascot; rarity: string } | null {
  const roll = Math.random();

  // 30% chance: Ron Jans mascot
  if (roll < 0.30) {
    if (!owned.has("mascot_ron_jans")) {
      const ronMascot = WHEEL_MASCOTS.find(m => m.id === "mascot_ron_jans");
      if (ronMascot) return { item: ronMascot, rarity: "mascots" };
    }
    // If Ron owned, fall through to weighted cosmetics
  }

  // 60% chance: Weighted cosmetics (same distribution as daily pack)
  if (roll < 0.90) {
    // Use weighted rarity pool like daily pack (47% common, 23% rare, 14% epic, 7% legendary)
    const rarityPool: RarityPool = { common: 47, rare: 23, epic: 14, legendary: 7 };
    const rarity = rollRarityFromPool(rarityPool) as Rarity;

    const result = pickCosmeticWithFallback(rarity, owned);
    if (result) return result;
  }

  // 10% chance / Fallback: any cosmetic or mascot
  const fallback = WHEEL_COSMETICS.filter(c => !owned.has(c.id));
  if (fallback.length > 0) {
    const item = fallback[Math.floor(Math.random() * fallback.length)];
    return { item, rarity: item.rarity };
  }

  const otherMascots = WHEEL_MASCOTS.filter(m => !owned.has(m.id));
  if (otherMascots.length > 0) {
    return { item: otherMascots[Math.floor(Math.random() * otherMascots.length)], rarity: "mascots" };
  }

  return null;
}

// ── Internal: Jannes Pack special selection ────────────────────────────────────
// The Jannes Pack has custom odds:
// - 30% Jannes (mascot_jannes)
// - 60% Weighted cosmetics (using daily pack rarity distribution)
// - 10% Fallback
function pickFromJannesPack(
  owned: Set<string>,
): { item: Cosmetic | Mascot; rarity: string } | null {
  const roll = Math.random();

  // 30% chance: Jannes mascot
  if (roll < 0.30) {
    if (!owned.has("mascot_jannes")) {
      const jannesMascot = WHEEL_MASCOTS.find(m => m.id === "mascot_jannes");
      if (jannesMascot) return { item: jannesMascot, rarity: "mascots" };
    }
    // If Jannes owned, fall through to weighted cosmetics
  }

  // 60% chance: Weighted cosmetics (same distribution as daily pack)
  if (roll < 0.90) {
    // Use weighted rarity pool like daily pack (47% common, 23% rare, 14% epic, 7% legendary)
    const rarityPool: RarityPool = { common: 47, rare: 23, epic: 14, legendary: 7 };
    const rarity = rollRarityFromPool(rarityPool) as Rarity;

    const result = pickCosmeticWithFallback(rarity, owned);
    if (result) return result;
  }

  // 10% chance / Fallback: any cosmetic or mascot
  const fallback = WHEEL_COSMETICS.filter(c => !owned.has(c.id));
  if (fallback.length > 0) {
    const item = fallback[Math.floor(Math.random() * fallback.length)];
    return { item, rarity: item.rarity };
  }

  const otherMascots = WHEEL_MASCOTS.filter(m => !owned.has(m.id));
  if (otherMascots.length > 0) {
    return { item: otherMascots[Math.floor(Math.random() * otherMascots.length)], rarity: "mascots" };
  }

  return null;
}

// ── Internal: Villain Pack special selection ───────────────────────────────────
// The Villain Pack has custom odds:
// - 30% Abu Harb (mascot_abu_harb)
// - 40% Fire cosmetics (color_inferno, border_flame, badge_blaze, bg_lava)
// - 30% Weighted cosmetics (using daily pack rarity distribution)
function pickFromVillainPack(
  owned: Set<string>,
): { item: Cosmetic | Mascot; rarity: string } | null {
  const roll = Math.random();
  const FIRE_COSMETICS = ["color_inferno", "border_flame", "badge_blaze", "bg_lava"];

  // 0-30%: Abu Harb mascot (or fire if owned)
  if (roll < 0.30) {
    // First, try Abu Harb (it's in MASCOTS, not WHEEL_MASCOTS because wheelEligible: false)
    if (!owned.has("mascot_abu_harb")) {
      // Find Abu Harb in the full MASCOTS array
      const abu = MASCOTS.find(m => m.id === "mascot_abu_harb");
      if (abu) return { item: abu, rarity: "mascots" };
    }
    // Abu Harb owned, so get a fire cosmetic instead
    const fireCosmetics = WHEEL_COSMETICS.filter(
      c => FIRE_COSMETICS.includes(c.id) && !owned.has(c.id)
    );
    if (fireCosmetics.length > 0) {
      const item = fireCosmetics[Math.floor(Math.random() * fireCosmetics.length)];
      return { item, rarity: item.rarity };
    }
  }

  // 30-70%: Fire cosmetics
  if (roll < 0.70) {
    const fireCosmetics = WHEEL_COSMETICS.filter(
      c => FIRE_COSMETICS.includes(c.id) && !owned.has(c.id)
    );
    if (fireCosmetics.length > 0) {
      const item = fireCosmetics[Math.floor(Math.random() * fireCosmetics.length)];
      return { item, rarity: item.rarity };
    }
  }

  // 70-100%: Weighted random cosmetics
  const rarityPool: RarityPool = { common: 47, rare: 23, epic: 14, legendary: 7 };
  const rarity = rollRarityFromPool(rarityPool) as Rarity;
  const result = pickCosmeticWithFallback(rarity, owned);
  if (result) return result;

  // Fallback to any unowned cosmetic
  const allCosmetics = WHEEL_COSMETICS.filter(c => !owned.has(c.id));
  if (allCosmetics.length > 0) {
    return { item: allCosmetics[Math.floor(Math.random() * allCosmetics.length)], rarity: allCosmetics[0].rarity };
  }

  // Last resort: any mascot
  const allMascots = MASCOTS.filter(m => !owned.has(m.id));
  if (allMascots.length > 0) {
    return { item: allMascots[Math.floor(Math.random() * allMascots.length)], rarity: "mascots" };
  }

  return null;
}

// ── Internal: Udo Pack special selection ──────────────────────────────────────
// The Udo Pack has custom odds:
// - 30% Udo (mascot_udo)
// - 40% Music cosmetics (color_melody, border_rhythm, bg_soundwaves, badge_music_note, badge_vinyl)
// - 30% Weighted cosmetics (using daily pack rarity distribution)
function pickFromUdoPack(
  owned: Set<string>,
): { item: Cosmetic | Mascot; rarity: string } | null {
  const roll = Math.random();
  const MUSIC_COSMETICS = ["color_melody", "border_rhythm", "bg_soundwaves", "badge_music_note", "badge_vinyl"];

  // 0-30%: Udo mascot (or music if owned)
  if (roll < 0.30) {
    // First, try Udo (it's in MASCOTS, not WHEEL_MASCOTS because wheelEligible: false)
    if (!owned.has("mascot_udo")) {
      // Find Udo in the full MASCOTS array
      const udo = MASCOTS.find(m => m.id === "mascot_udo");
      if (udo) return { item: udo, rarity: "mascots" };
    }
    // Udo owned, so get a music cosmetic instead
    const musicCosmetics = WHEEL_COSMETICS.filter(
      c => MUSIC_COSMETICS.includes(c.id) && !owned.has(c.id)
    );
    if (musicCosmetics.length > 0) {
      const item = musicCosmetics[Math.floor(Math.random() * musicCosmetics.length)];
      return { item, rarity: item.rarity };
    }
  }

  // 30-70%: Music cosmetics
  if (roll < 0.70) {
    const musicCosmetics = WHEEL_COSMETICS.filter(
      c => MUSIC_COSMETICS.includes(c.id) && !owned.has(c.id)
    );
    if (musicCosmetics.length > 0) {
      const item = musicCosmetics[Math.floor(Math.random() * musicCosmetics.length)];
      return { item, rarity: item.rarity };
    }
  }

  // 70-100%: Weighted random cosmetics
  const rarityPool: RarityPool = { common: 47, rare: 23, epic: 14, legendary: 7 };
  const rarity = rollRarityFromPool(rarityPool) as Rarity;
  const result = pickCosmeticWithFallback(rarity, owned);
  if (result) return result;

  // Fallback to any unowned cosmetic
  const allCosmetics = WHEEL_COSMETICS.filter(c => !owned.has(c.id));
  if (allCosmetics.length > 0) {
    return { item: allCosmetics[Math.floor(Math.random() * allCosmetics.length)], rarity: allCosmetics[0].rarity };
  }

  // Last resort: any mascot
  const allMascots = MASCOTS.filter(m => !owned.has(m.id));
  if (allMascots.length > 0) {
    return { item: allMascots[Math.floor(Math.random() * allMascots.length)], rarity: "mascots" };
  }

  return null;
}

// ── Internal: Rustaagh Pack special selection ────────────────────────────────
// The Rustaagh Pack has custom odds:
// - 30% Rustaagh (mascot_rustaagh)
// - 70% Weighted cosmetics (using daily pack rarity distribution)
function pickFromRustaraghPack(
  owned: Set<string>,
): { item: Cosmetic | Mascot; rarity: string } | null {
  const roll = Math.random();

  // 30% chance: Rustaagh mascot
  if (roll < 0.30) {
    if (!owned.has("mascot_rustaagh")) {
      // Find Rustaagh in the full MASCOTS array
      const rustaagh = MASCOTS.find(m => m.id === "mascot_rustaagh");
      if (rustaagh) return { item: rustaagh, rarity: "mascots" };
    }
    // Rustaagh owned, fall through to weighted cosmetics
  }

  // 70% chance: Weighted cosmetics (same distribution as daily pack)
  const rarityPool: RarityPool = { common: 47, rare: 23, epic: 14, legendary: 7 };
  const rarity = rollRarityFromPool(rarityPool) as Rarity;

  const result = pickCosmeticWithFallback(rarity, owned);
  if (result) return result;

  // Fallback to any unowned cosmetic
  const allCosmetics = WHEEL_COSMETICS.filter(c => !owned.has(c.id));
  if (allCosmetics.length > 0) {
    return { item: allCosmetics[Math.floor(Math.random() * allCosmetics.length)], rarity: allCosmetics[0].rarity };
  }

  // Last resort: any mascot
  const allMascots = MASCOTS.filter(m => !owned.has(m.id));
  if (allMascots.length > 0) {
    return { item: allMascots[Math.floor(Math.random() * allMascots.length)], rarity: "mascots" };
  }

  return null;
}

// ── Internal: Mascotte Pack special selection ──────────────────────────────
// The Mascotte Pack always drops a mascot. Rarity distribution:
// - 20% Legendary (hardest to get)
// - 35% Epic
// - 45% Rare (easiest to get)
function pickFromMascottePack(
  owned: Set<string>,
): { item: Mascot; rarity: string } | null {
  const legendary = MASCOTS.filter(m => m.rarity === "legendary" && !owned.has(m.id));
  const epic = MASCOTS.filter(m => m.rarity === "epic" && !owned.has(m.id));
  const rare = MASCOTS.filter(m => m.rarity === "rare" && !owned.has(m.id));

  const roll = Math.random();
  let pool: Mascot[];

  // Weighted rarity pool: legendary 20%, epic 35%, rare 45%
  if (roll < 0.20) pool = legendary;
  else if (roll < 0.55) pool = epic;
  else pool = rare;

  // Fallback when chosen tier is empty
  if (!pool.length) {
    if (legendary.length) pool = legendary;
    else if (epic.length) pool = epic;
    else if (rare.length) pool = rare;
    else return null; // All mascots owned
  }

  const mascot = pool[Math.floor(Math.random() * pool.length)];
  return { item: mascot, rarity: "mascots" };
}

// ── Coin pack selection ───────────────────────────────────────────────────────
export function pickCoinsFromPack(pool: RarityPool): { coins: number; rarity: keyof RarityPool } {
  const rarity = rollRarityFromPool(pool);

  const coinAmounts: Record<keyof RarityPool, number> = {
    common: 20,
    rare: 50,
    epic: 100,
    legendary: 200,
    mascots: 300,
  };

  return {
    coins: coinAmounts[rarity] ?? 20,
    rarity,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────
export function pickFromPack(
  pack: Pack,
  owned: Set<string>,
): { item: Cosmetic | Mascot; rarity: Rarity | "mascots" } | null {
  // Special handling for Cor Pack
  if (pack.id === "cor_pack") {
    return pickFromCorPack(owned) as any;
  }

  // Special handling for Ron Pack
  if (pack.id === "ron_pack") {
    return pickFromRonPack(owned) as any;
  }

  // Special handling for Jannes Pack
  if (pack.id === "jannes_pack") {
    return pickFromJannesPack(owned) as any;
  }

  // Special handling for Villain Pack
  if (pack.id === "villain_pack") {
    return pickFromVillainPack(owned) as any;
  }

  // Special handling for Udo Pack
  if (pack.id === "udo_pack") {
    return pickFromUdoPack(owned) as any;
  }

  // Special handling for Rustaagh Pack
  if (pack.id === "rustaagh_pack") {
    return pickFromRustaraghPack(owned) as any;
  }

  // Special handling for Mascotte Pack
  if (pack.id === "mascotte_pack") {
    return pickFromMascottePack(owned) as any;
  }

  const rarity = rollRarityFromPool(pack.rarityPool);

  if (rarity === "mascots") {
    const item = pickMascot(owned);
    return item ? { item, rarity } : null;
  }

  // Try exact rarity, fall back down the ladder if that tier is exhausted
  const result = pickCosmeticWithFallback(rarity as Rarity, owned);
  if (result) return result;

  // All cosmetics owned – try mascots as last resort
  const mascot = pickMascot(owned);
  return mascot ? { item: mascot, rarity: "mascots" } : null;
}
