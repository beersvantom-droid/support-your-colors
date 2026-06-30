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
    id:              "roulette_pack",
    label:           "Roulette Pack",
    description:     "50/50 GOKKEN | Verdubbel je munten of verlies alles! (1% DJ Derksen!)",
    emoji:           "🎰",
    imagePath:       "/packs/roulette.png",
    cost:            { currency: "coins", amount: 100 },
    rarityPool:      { common: 50, rare: 50 },
    cooldownMinutes: 0,
  },
  {
    id:              "bruno_pack",
    label:           "Bruno Pack",
    description:     "30% Bruno mascot • 40% Epic items • 30% Random",
    emoji:           "🐕",
    imagePath:       "/packs/Brunopack.png",
    cost:            { currency: "coins", amount: 300 },
    rarityPool:      { common: 30, rare: 20, epic: 20, legendary: 10, mascots: 20 },
    cooldownMinutes: 0,
  },
  {
    id:              "infantino_pack",
    label:           "Infantino Pack",
    description:     "De baas van het voetbal | 25% Infantino • 35% Legendary items • 40% Random",
    emoji:           "🤵",
    imagePath:       "/packs/infantinopack.png",
    cost:            { currency: "coins", amount: 500 },
    rarityPool:      { common: 20, rare: 15, epic: 20, legendary: 25, mascots: 20 },
    cooldownMinutes: 0,
  },
  {
    id:              "biermannetje_pack",
    label:           "Biermannetje Pack",
    description:     "Proost! | 30% Mr. Bier • 30% Guiness • 40% Random Cosmetica",
    emoji:           "🍺",
    imagePath:       "/packs/biermannetjepack.png",
    cost:            { currency: "coins", amount: 400 },
    rarityPool:      { common: 40, rare: 20, epic: 20, legendary: 20 },
    cooldownMinutes: 0,
  },
  {
    id:              "pirot_pack",
    label:           "Pirot Pack",
    description:     "Angry bird! | 30% Pirot • 60% Random Cosmetica • 10% Bonus",
    emoji:           "🐦",
    imagePath:       "/packs/pirotpack.png",
    cost:            { currency: "coins", amount: 300 },
    rarityPool:      { common: 40, rare: 25, epic: 20, legendary: 15 },
    cooldownMinutes: 0,
  },
  {
    id:              "schwoz_pack",
    label:           "Schwoz Pack",
    description:     "30% Schwoz • 60% Random Cosmetica • 10% Bonus",
    emoji:           "🧑‍🔬",
    imagePath:       "/packs/schwozpack.png",
    cost:            { currency: "coins", amount: 300 },
    rarityPool:      { common: 40, rare: 25, epic: 20, legendary: 15 },
    cooldownMinutes: 0,
  },
  {
    id:              "airball_pack",
    label:           "Airball Pack",
    description:     "30% Airball mascot • 60% Random Cosmetica • 10% 1000 coins",
    emoji:           "⚽",
    imagePath:       "/packs/airballpack.png",
    cost:            { currency: "coins", amount: 300 },
    rarityPool:      { common: 40, rare: 25, epic: 20, legendary: 15 },
    cooldownMinutes: 0,
  },
  {
    id:              "tung_pack",
    label:           "Tung Pack",
    description:     "30% Tung mascot • 60% Random Cosmetica",
    emoji:           "🦈",
    imagePath:       "/packs/tungpack.png",
    cost:            { currency: "coins", amount: 300 },
    rarityPool:      { common: 40, rare: 25, epic: 20, legendary: 15 },
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
