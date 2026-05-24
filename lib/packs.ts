// ── Pack system ───────────────────────────────────────────────────────────────
// A Pack is a loot container. The player clicks to open it and receives one
// random cosmetic or mascot based on the pack's rarity pool weights.
//
// To add a new pack type: just push a new entry into PACKS below.
// No other files need changing for the data layer.

export interface RarityPool {
  common?:    number; // relative weight (e.g. 52)
  rare?:      number; // relative weight (e.g. 25)
  epic?:      number; // relative weight (e.g. 15)
  legendary?: number; // relative weight (e.g. 8)
  mascots?:   number; // relative weight (e.g. 10); internally split 20/30/50 leg/epic/rare
}

export interface Pack {
  id:               string;         // unique slug, e.g. "daily"
  label:            string;         // "Daily Pack"
  description:      string;         // shown in UI
  emoji:            string;         // fallback visual identity
  imagePath?:       string;         // optional: path to custom pack image in /public
  cost:             null | { currency: string; amount: number };
  rarityPool:       RarityPool;     // weights for each rarity tier
  cooldownMinutes:  number;         // 1440 = once per 24 h; 0 = unlimited
}

export const PACKS: Pack[] = [
  {
    id:              "daily",
    label:           "Daily Pack",
    description:     "Eén gratis pack per dag. Bevat cosmetica en mascots!",
    emoji:           "🎁",
    imagePath:       "/packs/word-cup-pack.png",
    cost:            null,
    rarityPool:      { common: 47, rare: 23, epic: 14, legendary: 7, mascots: 9 },
    cooldownMinutes: 1440,
  },
  {
    id:              "daily_coins",
    label:           "Daily Coins Pack",
    description:     "Verdien munten elke dag! Steeds zeldzamer naarmate je meer krijgt.",
    emoji:           "💰",
    imagePath:       undefined,
    cost:            null,
    rarityPool:      { common: 40, rare: 30, epic: 20, legendary: 8, mascots: 2 }, // 20, 50, 100, 200, 300 coins
    cooldownMinutes: 1440,
  },
  // ← add future special packs here
];

export function getPack(id: string): Pack | undefined {
  return PACKS.find(p => p.id === id) || SHOP_PACKS.find(p => p.id === id);
}

// ── Shop Packs (purchasable with coins) ────────────────────────────────────

export const SHOP_PACKS: Pack[] = [
  {
    id:              "cor_pack",
    label:           "The Cor Pack",
    description:     "Legends Don't Follow, They Lead | 30% Golden Cor • 30% Gouden Items • 40% Random",
    emoji:           "🧣",
    imagePath:       "/packs/cor-pack.png",
    cost:            { currency: "coins", amount: 500 },
    rarityPool:      { common: 50, rare: 25, epic: 15, legendary: 10 }, // Dummy - not used, pickFromCorPack() handles it
    cooldownMinutes: 0,
  },
  {
    id:              "ron_pack",
    label:           "The Ron Pack",
    description:     "Voetbal Legend | 30% Ron Jans • 60% Random Cosmetica • 10% Bonus",
    emoji:           "⚽",
    imagePath:       "/packs/ron-pack.png",
    cost:            { currency: "coins", amount: 300 },
    rarityPool:      { common: 50, rare: 25, epic: 15, legendary: 10 }, // Dummy - not used, pickFromRonPack() handles it
    cooldownMinutes: 0,
  },
  {
    id:              "jannes_pack",
    label:           "The Jannes Pack",
    description:     "Talent Ontkent | 30% Jannes • 60% Random Cosmetica • 10% Bonus",
    emoji:           "🌟",
    imagePath:       "/packs/jannes-pack.png",
    cost:            { currency: "coins", amount: 300 },
    rarityPool:      { common: 50, rare: 25, epic: 15, legendary: 10 }, // Dummy - not used, pickFromJannesPack() handles it
    cooldownMinutes: 0,
  },
  {
    id:              "villain_pack",
    label:           "The Villain Pack",
    description:     "Chaos & Destruction | 30% Abu Harb • 40% Vuur Items • 30% Random",
    emoji:           "🦅",
    imagePath:       "/packs/villain-pack.png",
    cost:            { currency: "coins", amount: 300 },
    rarityPool:      { common: 50, rare: 25, epic: 15, legendary: 10 }, // Dummy - not used, pickFromVillainPack() handles it
    cooldownMinutes: 0,
  },
  {
    id:              "udo_pack",
    label:           "The Udo Pack",
    description:     "Stijl & Swag | 30% Udo • 60% Random Cosmetica • 10% Bonus",
    emoji:           "😎",
    imagePath:       "/packs/udo-pack.png",
    cost:            { currency: "coins", amount: 300 },
    rarityPool:      { common: 50, rare: 25, epic: 15, legendary: 10 }, // Dummy - not used, pickFromUdoPack() handles it
    cooldownMinutes: 0,
  },
  {
    id:              "rustaagh_pack",
    label:           "The Rustaagh Pack",
    description:     "Rust & Relaxation | 30% Rustaagh • 70% Random Items",
    emoji:           "😌",
    imagePath:       "/packs/rustaagh-pack.png",
    cost:            { currency: "coins", amount: 200 },
    rarityPool:      { common: 50, rare: 25, epic: 15, legendary: 10 }, // Dummy - not used, pickFromRustaraghPack() handles it
    cooldownMinutes: 0,
  },
  {
    id:              "mascotte_pack",
    label:           "Mascotte Pack",
    description:     "100% Mascotte | Hoe zeldzamer hoe moeilijker",
    emoji:           "🎭",
    imagePath:       "/packs/mascotte-pack.png",
    cost:            { currency: "coins", amount: 350 },
    rarityPool:      { mascots: 100 }, // 100% mascots
    cooldownMinutes: 0,
  },
  {
    id:              "roulette_pack",
    label:           "Roulette Pack",
    description:     "50/50 GOKKEN | Verdubbel je munten of verlies alles! (1% DJ Derksen!)",
    emoji:           "🎰",
    imagePath:       "/packs/roulette.png",
    cost:            { currency: "coins", amount: 100 },
    rarityPool:      { common: 50, rare: 50 }, // Dummy - will be overridden by roulette logic
    cooldownMinutes: 0,
  },
  // ← add future shop packs here
];

export function getShopPack(id: string): Pack | undefined {
  return SHOP_PACKS.find(p => p.id === id);
}

// Resolve a random rarity tier from a pack's pool weights
export function rollRarityFromPool(pool: RarityPool): keyof RarityPool {
  const entries = Object.entries(pool) as [keyof RarityPool, number][];
  const total   = entries.reduce((s, [, w]) => s + w, 0);
  let rand      = Math.random() * total;
  for (const [rarity, weight] of entries) {
    rand -= weight;
    if (rand <= 0) return rarity;
  }
  return entries[entries.length - 1][0];
}
