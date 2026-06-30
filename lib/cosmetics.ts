import type { CSSProperties } from "react";

export type CosmeticType = "name_color" | "border" | "badge" | "card_bg";
export type Rarity = "common" | "rare" | "epic" | "legendary" | "special";

export interface Cosmetic {
  id: string;
  type: CosmeticType;
  rarity: Rarity;
  label: string;
  emoji: string;
  wheelEligible: boolean; // false = default starter item, never from wheel
}

// ── Mascots ───────────────────────────────────────────────────────────────────
// Mascots are LEGENDARY cosmetics displayed on leaderboard cards.
// Max 3 can be equipped at the same time. Always permanent once unlocked.

export interface Mascot {
  id: string;
  type: "mascot";
  rarity: "legendary" | "epic" | "rare" | "special";
  label: string;
  emoji: string;
  imagePath: string;       // path to PNG inside /public
  unlockHint: string;      // shown on locked slot
  wheelEligible: boolean;
}

export const MASCOTS: Mascot[] = [
  {
    id:            "mascot_dj_derksen",
    type:          "mascot",
    rarity:        "legendary",
    label:         "DJ Derksen",
    emoji:         "🎧",
    imagePath:     "/mascots/dj-derksen.png",
    unlockHint:    "Spin the Wheel of Chaos (Mascots) or receive 10 DJ Derksen comments",
    wheelEligible: false,
  },
  {
    id:            "mascot_abu_harb",
    type:          "mascot",
    rarity:        "legendary",
    label:         "أبو حرب",
    emoji:         "🦅",
    imagePath:     "/mascots/abu-harb.png",
    unlockHint:    "Spin the Wheel of Chaos (Mascots) or receive 10 Abu Harb comments",
    wheelEligible: false,
  },
  {
    id:            "mascot_jannes",
    type:          "mascot",
    rarity:        "legendary",
    label:         "Jannes",
    emoji:         "🤪",
    imagePath:     "/mascots/jannes.png",
    unlockHint:    "Spin the Wheel of Chaos (Mascots) or comment with 'scheidsrechter'",
    wheelEligible: false,
  },
  {
    id:            "mascot_ron_jans",
    type:          "mascot",
    rarity:        "legendary",
    label:         "Ron Jans",
    emoji:         "🧻",
    imagePath:     "/mascots/ronjanss.png",
    unlockHint:    "Spin the Wheel of Chaos (Mascots) or comment with 'keukenrol', 'ronjansdans', or 'pec zwolle'",
    wheelEligible: false,
  },
  {
    id:            "mascot_golden_cor",
    type:          "mascot",
    rarity:        "legendary",
    label:         "Golden Cor",
    emoji:         "🧣",
    imagePath:     "/mascots/golden-cor.png",
    unlockHint:    "Spin the Wheel of Chaos (Mascots) or get 20 comments on a single post",
    wheelEligible: false,
  },
  {
    id:            "mascot_udo",
    type:          "mascot",
    rarity:        "legendary",
    label:         "Udo",
    emoji:         "😎",
    imagePath:     "/mascots/udo.png",
    unlockHint:    "Spin the Wheel of Chaos (Mascots) or comment with 'huts' or 'niffo'",
    wheelEligible: false,
  },
  {
    id:            "mascot_ballie_kat",
    type:          "mascot",
    rarity:        "epic",
    label:         "Ballie Kat",
    emoji:         "🐱",
    imagePath:     "/mascots/kat.png",
    unlockHint:    "Spin the Wheel of Chaos (Mascots)",
    wheelEligible: false,
  },
  {
    id:            "mascot_vuist",
    type:          "mascot",
    rarity:        "rare",
    label:         "Vuist",
    emoji:         "✊",
    imagePath:     "/mascots/vuist.png",
    unlockHint:    "Spin the Wheel of Chaos (Mascots)",
    wheelEligible: false,
  },
  {
    id:            "mascot_winner",
    type:          "mascot",
    rarity:        "rare",
    label:         "Winner",
    emoji:         "🏆",
    imagePath:     "/mascots/winner.png",
    unlockHint:    "Spin the Wheel of Chaos (Mascots)",
    wheelEligible: false,
  },
  {
    id:            "mascot_guiness",
    type:          "mascot",
    rarity:        "epic",
    label:         "Guiness",
    emoji:         "🍺",
    imagePath:     "/mascots/drinken.png",
    unlockHint:    "Spin the Wheel of Chaos (Mascots)",
    wheelEligible: false,
  },
  {
    id:            "mascot_gyokeres",
    type:          "mascot",
    rarity:        "epic",
    label:         "Gyökeres",
    emoji:         "🔥",
    imagePath:     "/mascots/Gyökeres.png",
    unlockHint:    "Spin the Wheel of Chaos (Mascots)",
    wheelEligible: false,
  },
  {
    id:            "mascot_pizza",
    type:          "mascot",
    rarity:        "rare",
    label:         "Pizza",
    emoji:         "🍕",
    imagePath:     "/mascots/pizza.png",
    unlockHint:    "Spin the Wheel of Chaos (Mascots)",
    wheelEligible: false,
  },
  {
    id:            "mascot_ster",
    type:          "mascot",
    rarity:        "rare",
    label:         "Ster",
    emoji:         "⭐",
    imagePath:     "/mascots/ster.png",
    unlockHint:    "Spin the Wheel of Chaos (Mascots)",
    wheelEligible: false,
  },
  {
    id:            "mascot_ballie_patta",
    type:          "mascot",
    rarity:        "rare",
    label:         "Ballie Patta",
    emoji:         "🎪",
    imagePath:     "/mascots/ballie-patta.png",
    unlockHint:    "Spin the Wheel of Chaos (Mascots)",
    wheelEligible: false,
  },
  {
    id:            "mascot_wereldbeker",
    type:          "mascot",
    rarity:        "rare",
    label:         "wereldbeker",
    emoji:         "🥇",
    imagePath:     "/mascots/wereldbeker.png",
    unlockHint:    "Spin the Wheel of Chaos (Mascots)",
    wheelEligible: false,
  },
  {
    id:            "mascot_speed",
    type:          "mascot",
    rarity:        "epic",
    label:         "Speed",
    emoji:         "⚡",
    imagePath:     "/mascots/speed.png",
    unlockHint:    "Spin the Wheel of Chaos (Mascots)",
    wheelEligible: false,
  },
  {
    id:            "mascot_rustaagh",
    type:          "mascot",
    rarity:        "epic",
    label:         "Rustaagh",
    emoji:         "😌",
    imagePath:     "/mascots/rustaagh.png",
    unlockHint:    "Spin the Wheel of Chaos (Mascots)",
    wheelEligible: false,
  },
  {
    id:            "mascot_poephond",
    type:          "mascot",
    rarity:        "rare",
    label:         "Poephond",
    emoji:         "🐕",
    imagePath:     "/mascots/poephond.png",
    unlockHint:    "Spin the Wheel of Chaos (Mascots)",
    wheelEligible: false,
  },
  {
    id:            "mascot_aardbei",
    type:          "mascot",
    rarity:        "epic",
    label:         "Aardbei",
    emoji:         "🍓",
    imagePath:     "/mascots/aardbei.png",
    unlockHint:    "Spin the Wheel of Chaos (Mascots)",
    wheelEligible: false,
  },
  {
    id:            "mascot_leren_bal",
    type:          "mascot",
    rarity:        "rare",
    label:         "Leren Bal",
    emoji:         "⚽",
    imagePath:     "/mascots/leren-bal.png",
    unlockHint:    "Spin the Wheel of Chaos (Mascots)",
    wheelEligible: false,
  },
  {
    id:            "mascot_goat",
    type:          "mascot",
    rarity:        "special",
    label:         "GOAT",
    emoji:         "🐐",
    imagePath:     "/mascots/goat.png",
    unlockHint:    "Earn as a Community Challenge reward",
    wheelEligible: false,
  },
  {
    id:            "mascot_hand_van_god",
    type:          "mascot",
    rarity:        "special",
    label:         "Hand van God",
    emoji:         "✋",
    imagePath:     "/mascots/hand-van-god.png",
    unlockHint:    "Earn as a Community Challenge reward",
    wheelEligible: false,
  },
  {
    id:            "mascot_confused",
    type:          "mascot",
    rarity:        "special",
    label:         "Confused",
    emoji:         "❓",
    imagePath:     "/mascots/confused.png",
    unlockHint:    "Earn as a Community Challenge reward",
    wheelEligible: false,
  },
  {
    id:            "mascot_orgeljoke",
    type:          "mascot",
    rarity:        "special",
    label:         "Orgel Joke",
    emoji:         "🎹",
    imagePath:     "/mascots/orgeljoke.png",
    unlockHint:    "Earn as a Community Challenge reward",
    wheelEligible: false,
  },
  {
    id:            "mascot_leeuw",
    type:          "mascot",
    rarity:        "epic",
    label:         "Leeuw",
    emoji:         "🦁",
    imagePath:     "/mascots/leeuw.png",
    unlockHint:    "Spin the Wheel of Chaos (Mascots)",
    wheelEligible: false,
  },
  {
    id:            "mascot_bruno",
    type:          "mascot",
    rarity:        "epic",
    label:         "Bruno",
    emoji:         "🐕",
    imagePath:     "/mascots/bruno.png",
    unlockHint:    "Open the Bruno Pack",
    wheelEligible: false,
  },
  {
    id:            "mascot_infantino",
    type:          "mascot",
    rarity:        "legendary",
    label:         "Infantino",
    emoji:         "🤵",
    imagePath:     "/mascots/infantino.png",
    unlockHint:    "Open the Infantino Pack",
    wheelEligible: false,
  },
  {
    id:            "mascot_schwoz",
    type:          "mascot",
    rarity:        "legendary",
    label:         "Schwoz",
    emoji:         "🧑‍🔬",
    imagePath:     "/mascots/schwoz.png",
    unlockHint:    "Open the Schwoz Pack",
    wheelEligible: false,
  },
  {
    id:            "mascot_pirot",
    type:          "mascot",
    rarity:        "legendary",
    label:         "Pirot",
    emoji:         "🐦",
    imagePath:     "/mascots/pirot.png",
    unlockHint:    "Open the Pirot Pack",
    wheelEligible: false,
  },
  {
    id:            "mascot_ref",
    type:          "mascot",
    rarity:        "rare",
    label:         "Ref",
    emoji:         "🟨",
    imagePath:     "/mascots/ref.png",
    unlockHint:    "Spin the Wheel of Chaos (Mascots)",
    wheelEligible: false,
  },
  {
    id:            "mascot_mrbier",
    type:          "mascot",
    rarity:        "legendary",
    label:         "Mr. Bier",
    emoji:         "🍺",
    imagePath:     "/mascots/mrbier.png",
    unlockHint:    "Open the Biermannetje Pack",
    wheelEligible: false,
  },
  {
    id:            "mascot_airball",
    type:          "mascot",
    rarity:        "legendary",
    label:         "Airball",
    emoji:         "⚽",
    imagePath:     "/mascots/airball.png",
    unlockHint:    "Open the Airball Pack",
    wheelEligible: false,
  },
  {
    id:            "mascot_tung",
    type:          "mascot",
    rarity:        "legendary",
    label:         "Tung",
    emoji:         "🦈",
    imagePath:     "/mascots/tung.png",
    unlockHint:    "Open the Tung Pack",
    wheelEligible: false,
  },
];

// All mascots are available from the dedicated "mascots" wheel segment.
// The `wheelEligible` flag is only for regular cosmetics in the common/rare/
// epic/legendary pools — mascots are handled by their own segment.
export const WHEEL_MASCOTS = MASCOTS;

export function getMascotById(id: string): Mascot | undefined {
  return MASCOTS.find(m => m.id === id);
}

export const COSMETICS: Cosmetic[] = [
  // ── Name Colors ──────────────────────────────────────────────────────────────
  { id: "color_blue",   type: "name_color", rarity: "common",    label: "Blue",    emoji: "🔵", wheelEligible: true },
  { id: "color_green",  type: "name_color", rarity: "common",    label: "Green",   emoji: "🟢", wheelEligible: true },
  { id: "color_red",    type: "name_color", rarity: "common",    label: "Red",     emoji: "🔴", wheelEligible: true },
  { id: "color_purple", type: "name_color", rarity: "common",    label: "Purple",  emoji: "🟣", wheelEligible: true },
  { id: "color_orange", type: "name_color", rarity: "common",    label: "Orange",  emoji: "🟠", wheelEligible: true },
  { id: "color_cyan",   type: "name_color", rarity: "common",    label: "Cyan",    emoji: "🩵", wheelEligible: true },
  { id: "color_pink",   type: "name_color", rarity: "common",    label: "Pink",    emoji: "🩷", wheelEligible: true },
  { id: "color_lime",   type: "name_color", rarity: "common",    label: "Lime",    emoji: "💚", wheelEligible: true },
  { id: "color_bronze", type: "name_color", rarity: "rare",      label: "Bronze",  emoji: "🥉", wheelEligible: true },
  { id: "color_yellow", type: "name_color", rarity: "rare",      label: "Yellow",  emoji: "🟡", wheelEligible: true },
  { id: "color_brown",  type: "name_color", rarity: "rare",      label: "Brown",   emoji: "🟤", wheelEligible: true },
  { id: "color_silver", type: "name_color", rarity: "epic",      label: "Silver",  emoji: "🥈", wheelEligible: true },
  { id: "color_neon_green", type: "name_color", rarity: "epic",  label: "Neon Green", emoji: "💚", wheelEligible: true },
  { id: "color_hot_pink",   type: "name_color", rarity: "epic",  label: "Hot Pink",   emoji: "💖", wheelEligible: true },
  { id: "color_inferno",    type: "name_color", rarity: "epic",  label: "Inferno",    emoji: "🔥", wheelEligible: true },
  { id: "color_melody",     type: "name_color", rarity: "epic",  label: "Melody", emoji: "🎵", wheelEligible: true },
  { id: "color_gold",   type: "name_color", rarity: "legendary", label: "Gold",    emoji: "🥇", wheelEligible: true },
  { id: "color_rainbow",type: "name_color", rarity: "legendary", label: "Rainbow", emoji: "🌈", wheelEligible: true },

  // ── Borders ───────────────────────────────────────────────────────────────────
  { id: "border_blue",   type: "border", rarity: "common",    label: "Blue",    emoji: "🔷", wheelEligible: true },
  { id: "border_green",  type: "border", rarity: "common",    label: "Green",   emoji: "🟩", wheelEligible: true },
  { id: "border_red",    type: "border", rarity: "common",    label: "Red",     emoji: "🟥", wheelEligible: true },
  { id: "border_purple", type: "border", rarity: "common",    label: "Purple",  emoji: "🟪", wheelEligible: true },
  { id: "border_bronze", type: "border", rarity: "rare",      label: "Bronze",  emoji: "🎖️", wheelEligible: true },
  { id: "border_yellow", type: "border", rarity: "rare",      label: "Yellow",  emoji: "🟨", wheelEligible: true },
  { id: "border_pink",   type: "border", rarity: "rare",      label: "Pink",    emoji: "💗", wheelEligible: true },
  { id: "border_flame",    type: "border", rarity: "rare",      label: "Flame",      emoji: "🔥", wheelEligible: true },
  { id: "border_rhythm",   type: "border", rarity: "epic",      label: "Rhythm", emoji: "🎵", wheelEligible: true },
  { id: "border_silver", type: "border", rarity: "epic",      label: "Silver",  emoji: "⚜️", wheelEligible: true },
  { id: "border_neon",   type: "border", rarity: "epic",      label: "Neon",    emoji: "💜", wheelEligible: true },
  { id: "border_hologram", type: "border", rarity: "epic",    label: "Hologram", emoji: "🌈", wheelEligible: true },
  { id: "border_gold",   type: "border", rarity: "legendary", label: "Gold",    emoji: "✨", wheelEligible: true },
  { id: "border_diamond",type: "border", rarity: "legendary", label: "Diamond", emoji: "💎", wheelEligible: true },

  // ── Badges ────────────────────────────────────────────────────────────────────
  { id: "badge_default",   type: "badge", rarity: "common",    label: "Football",  emoji: "⚽", wheelEligible: false },
  { id: "badge_lightning", type: "badge", rarity: "rare",      label: "Lightning", emoji: "⚡", wheelEligible: true },
  { id: "badge_fire",      type: "badge", rarity: "rare",      label: "Fire",      emoji: "🔥", wheelEligible: true },
  { id: "badge_blaze",     type: "badge", rarity: "rare",      label: "Blaze",     emoji: "🔥", wheelEligible: true },
  { id: "badge_music_note",type: "badge", rarity: "rare",      label: "Music Note", emoji: "🎵", wheelEligible: true },
  { id: "badge_star",      type: "badge", rarity: "epic",      label: "Superstar", emoji: "🌟", wheelEligible: true },
  { id: "badge_thunder",   type: "badge", rarity: "epic",      label: "Thunder",   emoji: "⚡", wheelEligible: true },
  { id: "badge_diamond",   type: "badge", rarity: "epic",      label: "Diamond",   emoji: "💎", wheelEligible: true },
  { id: "badge_vinyl",     type: "badge", rarity: "epic",      label: "Vinyl", emoji: "🎵", wheelEligible: true },
  { id: "badge_crown",     type: "badge", rarity: "legendary", label: "Crown",     emoji: "👑", wheelEligible: true },
  { id: "badge_phoenix",   type: "badge", rarity: "legendary", label: "Phoenix",   emoji: "🔥", wheelEligible: true },

  // ── Card Backgrounds ──────────────────────────────────────────────────────────
  { id: "bg_default",   type: "card_bg", rarity: "common",    label: "Classic",  emoji: "⬜", wheelEligible: false },
  { id: "bg_stripes",   type: "card_bg", rarity: "rare",      label: "Stripes",  emoji: "🟦", wheelEligible: true },
  { id: "bg_hexagons",  type: "card_bg", rarity: "epic",      label: "Hexagons", emoji: "🔷", wheelEligible: true },
  { id: "bg_diagonal",  type: "card_bg", rarity: "epic",      label: "Diagonal", emoji: "📐", wheelEligible: true },
  { id: "bg_stadium",   type: "card_bg", rarity: "epic",      label: "Stadium",  emoji: "🏟️", wheelEligible: true },
  { id: "bg_gradient",  type: "card_bg", rarity: "epic",      label: "Gradient", emoji: "🌈", wheelEligible: true },
  { id: "bg_lava",       type: "card_bg", rarity: "epic",      label: "Lava",     emoji: "🌋", wheelEligible: true },
  { id: "bg_stars",      type: "card_bg", rarity: "epic",      label: "Stars",    emoji: "⭐", wheelEligible: true },
  { id: "bg_soundwaves", type: "card_bg", rarity: "legendary", label: "Soundwaves", emoji: "🎵", wheelEligible: true },
  { id: "bg_particles", type: "card_bg", rarity: "legendary", label: "Particles",emoji: "✨", wheelEligible: true },
  { id: "bg_waves",     type: "card_bg", rarity: "legendary", label: "Waves",    emoji: "🌊", wheelEligible: true },
  { id: "bg_gold_foil", type: "card_bg", rarity: "legendary", label: "Gold Foil", emoji: "🥇", wheelEligible: true },
  { id: "bg_neon_grid", type: "card_bg", rarity: "legendary", label: "Neon Grid", emoji: "💜", wheelEligible: true },
  { id: "bg_midnight", type: "card_bg", rarity: "legendary", label: "Midnight", emoji: "🌙", wheelEligible: true },
  { id: "bg_embers",   type: "card_bg", rarity: "legendary", label: "Embers",   emoji: "🔥", wheelEligible: true },
  { id: "bg_matrix",   type: "card_bg", rarity: "legendary", label: "Matrix",   emoji: "💚", wheelEligible: true },

  // ── Special Challenge Rewards ──────────────────────────────────────────────
  { id: "bg_hand_van_god", type: "card_bg", rarity: "special", label: "Hand van God", emoji: "✋", wheelEligible: false },
  { id: "badge_kami",      type: "badge",   rarity: "special", label: "神 Kami",       emoji: "神", wheelEligible: false },
  { id: "bg_confused",      type: "card_bg", rarity: "special", label: "Confused",     emoji: "❓", wheelEligible: false },
  { id: "badge_confused",   type: "badge",   rarity: "special", label: "?! Confused",  emoji: "?!", wheelEligible: false },
  { id: "bg_orgeljoke",    type: "card_bg", rarity: "special", label: "Orgel Joke",  emoji: "🎹", wheelEligible: false },
  { id: "badge_orgeljoke", type: "badge",   rarity: "special", label: "♫ Orgel",     emoji: "♫", wheelEligible: false },
];

export const WHEEL_COSMETICS = COSMETICS.filter(c => c.wheelEligible);

export function getCosmeticById(id: string): Cosmetic | undefined {
  return COSMETICS.find(c => c.id === id);
}

export function cosmeticsByType(type: CosmeticType): Cosmetic[] {
  return COSMETICS.filter(c => c.type === type);
}

// ── Rendering helpers ─────────────────────────────────────────────────────────
// Each function returns { style?, className? } props to spread onto the target element.

const SOLID_NAME_COLORS: Record<string, string> = {
  color_blue:   "#60A5FA",
  color_green:  "#34D399",
  color_red:    "#F87171",
  color_purple: "#C084FC",
  color_orange: "#FB923C",
  color_cyan:   "#22D3EE",
  color_pink:   "#F472B6",
  color_lime:   "#A3E635",
  color_yellow: "#FBBF24",
  color_brown:  "#92400E",
  color_neon_green: "#4ADE80",
  color_hot_pink:   "#EC4899",
  color_inferno:    "#FF5722",
  color_melody:     "#9C27B0",
};

export function nameColorProps(id: string | null | undefined): {
  style?: CSSProperties;
  className?: string;
} {
  if (!id) return {};
  const solid = SOLID_NAME_COLORS[id];
  if (solid) return { style: { color: solid } };
  if (id === "color_bronze") return { className: "cosmetic-name-bronze" };
  if (id === "color_silver") return { className: "cosmetic-name-silver" };
  if (id === "color_gold")   return { className: "cosmetic-name-gold" };
  if (id === "color_rainbow") return { className: "cosmetic-name-rainbow" };
  return {};
}

const SOLID_BORDER_COLORS: Record<string, string> = {
  border_blue:   "#60A5FA",
  border_green:  "#34D399",
  border_red:    "#F87171",
  border_purple: "#C084FC",
  border_yellow: "#FBBF24",
  border_pink:   "#EC4899",
  border_flame:  "#FF6B35",
  border_rhythm: "#FFD700",
};

// Returns border + box-shadow style and optional animation class.
// Always returns a base style so callers don't need a fallback.
export function borderContainerProps(id: string | null | undefined): {
  style: CSSProperties;
  className: string;
} {
  const defaultStyle: CSSProperties = { border: "1px solid rgba(0,0,0,0.06)" };
  if (!id) return { style: defaultStyle, className: "" };

  const color = SOLID_BORDER_COLORS[id];
  if (color) return {
    style: { border: `1.5px solid ${color}`, boxShadow: `0 0 8px ${color}30` },
    className: "",
  };
  if (id === "border_bronze") return {
    style: { border: "1.5px solid rgba(205,127,50,0.7)" },
    className: "cosmetic-border-bronze",
  };
  if (id === "border_silver") return {
    style: { border: "1.5px solid rgba(148,163,184,0.5)" },
    className: "cosmetic-border-silver",
  };
  if (id === "border_neon") return {
    style: { border: "1.5px solid #A78BFA", boxShadow: "0 0 12px #A78BFA60, inset 0 0 8px #A78BFA20" },
    className: "cosmetic-border-neon",
  };
  if (id === "border_hologram") return {
    style: { border: "1.5px solid rgba(168,85,247,0.7)", boxShadow: "0 0 16px #A78BFA80" },
    className: "cosmetic-border-hologram",
  };
  if (id === "border_gold") return {
    style: { border: "1.5px solid rgba(245,158,11,0.6)" },
    className: "cosmetic-border-gold",
  };
  if (id === "border_diamond") return {
    style: { border: "1.5px solid rgba(100,220,255,0.8)", boxShadow: "0 0 14px rgba(100,220,255,0.6)" },
    className: "cosmetic-border-diamond",
  };
  return { style: defaultStyle, className: "" };
}

// Returns null for the default badge (show nothing), or { emoji, className } for unlocked ones.
export function badgeInfo(id: string | null | undefined): { emoji: string; className: string } | null {
  if (!id || id === "badge_default") return null;
  if (id === "badge_lightning") return { emoji: "⚡", className: "" };
  if (id === "badge_fire")      return { emoji: "🔥", className: "cosmetic-badge-fire" };
  if (id === "badge_blaze")     return { emoji: "🔥", className: "cosmetic-badge-blaze" };
  if (id === "badge_music_note")return { emoji: "🎵", className: "cosmetic-badge-music-note" };
  if (id === "badge_star")      return { emoji: "🌟", className: "cosmetic-badge-star" };
  if (id === "badge_thunder")   return { emoji: "⚡", className: "cosmetic-badge-thunder" };
  if (id === "badge_diamond")   return { emoji: "💎", className: "cosmetic-badge-diamond" };
  if (id === "badge_vinyl")     return { emoji: "🎵", className: "cosmetic-badge-vinyl" };
  if (id === "badge_crown")     return { emoji: "👑", className: "cosmetic-badge-crown" };
  if (id === "badge_phoenix")   return { emoji: "🔥", className: "cosmetic-badge-phoenix" };
  if (id === "badge_kami")      return { emoji: "神", className: "cosmetic-badge-kami" };
  if (id === "badge_confused") return { emoji: "?!", className: "cosmetic-badge-confused" };
  if (id === "badge_orgeljoke") return { emoji: "♫", className: "cosmetic-badge-orgeljoke" };
  return null;
}

// Style for the absolutely-positioned background overlay inside a card.
// Returns null if no background cosmetic is active.
const BG_LAYER_STYLES: Partial<Record<string, CSSProperties>> = {
  bg_stripes: {
    backgroundImage: "repeating-linear-gradient(90deg, rgba(59,130,246,0.06) 0px, rgba(59,130,246,0.06) 8px, transparent 8px, transparent 16px)",
  },
  bg_hexagons: {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='32'%3E%3Cpath d='M14 2L26 9v14L14 30 2 23V9z' fill='none' stroke='rgba(0%2C0%2C0%2C0.14)' stroke-width='1.2'/%3E%3C/svg%3E")`,
    backgroundSize: "28px 32px",
  },
  bg_diagonal: {
    backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.08) 10px, rgba(0,0,0,0.08) 12px)",
  },
  bg_stadium: {
    backgroundImage: [
      "radial-gradient(ellipse at 20% 0%, rgba(245,158,11,0.28) 0%, transparent 55%)",
      "radial-gradient(ellipse at 80% 0%, rgba(59,130,246,0.22) 0%, transparent 55%)",
    ].join(", "),
  },
  bg_gradient: {
    backgroundImage: "linear-gradient(135deg, rgba(168,85,247,0.10) 0%, rgba(59,130,246,0.10) 50%, rgba(34,197,94,0.10) 100%)",
  },
  bg_stars: {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='5' cy='5' r='1' fill='rgba(59%2C130%2C246%2C0.20)'/%3E%3Ccircle cx='15' cy='8' r='0.8' fill='rgba(59%2C130%2C246%2C0.15)'/%3E%3Ccircle cx='25' cy='12' r='1' fill='rgba(168%2C85%2C247%2C0.20)'/%3E%3Ccircle cx='35' cy='6' r='0.8' fill='rgba(59%2C130%2C246%2C0.15)'/%3E%3Ccircle cx='10' cy='25' r='1' fill='rgba(168%2C85%2C247%2C0.20)'/%3E%3Ccircle cx='20' cy='30' r='0.8' fill='rgba(59%2C130%2C246%2C0.15)'/%3E%3Ccircle cx='30' cy='28' r='1' fill='rgba(34%2C197%2C94%2C0.15)'/%3E%3C/svg%3E")`,
    backgroundSize: "40px 40px",
  },
  bg_gold_foil: {
    backgroundImage: [
      "linear-gradient(135deg, rgba(245,158,11,0.25) 0%, transparent 50%)",
      "linear-gradient(-135deg, rgba(245,158,11,0.20) 0%, transparent 50%)",
    ].join(", "),
    backgroundColor: "rgba(245,158,11,0.05)",
  },
  bg_lava: {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cdefs%3E%3Cfilter id='drip'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.03' numOctaves='4' result='noise'/%3E%3CfeDisplacementMap in='SourceGraphic' in2='noise' scale='8'/%3E%3C/filter%3E%3C/defs%3E%3Crect width='120' height='120' fill='%23000'/%3E%3Ccircle cx='20' cy='10' r='6' fill='%23FF6B35' opacity='0.4'/%3E%3Ccircle cx='60' cy='15' r='8' fill='%23FF5722' opacity='0.5'/%3E%3Ccircle cx='100' cy='20' r='5' fill='%23FF6B35' opacity='0.4'/%3E%3Cpath d='M 20 16 Q 18 40 22 60' stroke='%23FF5722' stroke-width='2' fill='none' opacity='0.6'/%3E%3Cpath d='M 60 23 Q 58 45 65 70' stroke='%23FF6B35' stroke-width='2.5' fill='none' opacity='0.7'/%3E%3Cpath d='M 100 25 Q 98 50 105 75' stroke='%23FF5722' stroke-width='2' fill='none' opacity='0.6'/%3E%3C/svg%3E")`,
    backgroundSize: "120px 120px",
    backgroundColor: "#0a0a0a",
  },
  bg_soundwaves: {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='120'%3E%3Cdefs%3E%3ClinearGradient id='waveGrad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%239C27B0;stop-opacity:0.8'/%3E%3Cstop offset='50%25' style='stop-color:%236A1B9A;stop-opacity:0.6'/%3E%3Cstop offset='100%25' style='stop-color:%234A148C;stop-opacity:0.4'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='200' height='120' fill='%230d0221'/%3E%3C!-- Frequency bars left --%3E%3Crect x='10' y='80' width='6' height='30' fill='%239C27B0' opacity='0.7'/%3E%3Crect x='20' y='70' width='6' height='40' fill='%23BB86FC' opacity='0.8'/%3E%3Crect x='30' y='60' width='6' height='50' fill='%23CE93D8' opacity='0.9'/%3E%3Crect x='40' y='75' width='6' height='35' fill='%23BB86FC' opacity='0.8'/%3E%3C!-- Main waveform --%3E%3Cpath d='M 10 60 Q 20 40 30 60 T 70 60 T 110 60 T 150 60 T 190 60' stroke='url(%23waveGrad)' stroke-width='2.5' fill='none'/%3E%3Cpath d='M 10 70 Q 20 50 30 70 T 70 70 T 110 70 T 150 70 T 190 70' stroke='%239C27B0' stroke-width='1.5' fill='none' opacity='0.5'/%3E%3Cpath d='M 10 50 Q 20 30 30 50 T 70 50 T 110 50 T 150 50 T 190 50' stroke='%23BB86FC' stroke-width='1.5' fill='none' opacity='0.4'/%3E%3C!-- Frequency bars right --%3E%3Crect x='160' y='70' width='6' height='40' fill='%23BB86FC' opacity='0.8'/%3E%3Crect x='170' y='75' width='6' height='35' fill='%239C27B0' opacity='0.7'/%3E%3Crect x='180' y='80' width='6' height='30' fill='%23CE93D8' opacity='0.6'/%3E%3C!-- Center circle --%3E%3Ccircle cx='100' cy='60' r='4' fill='%23FF00FF' opacity='0.5'/%3E%3C/svg%3E")`,
    backgroundSize: "200px 120px",
    backgroundColor: "#0d0221",
  },
  bg_hand_van_god: {
    backgroundImage: [
      "linear-gradient(135deg, #1a0800 0%, #2d1200 30%, #1a0a00 60%, #0d0500 100%)",
    ].join(", "),
    backgroundColor: "#1a0800",
  },
  bg_confused: {
    backgroundImage: "linear-gradient(145deg, #0a1f0e 0%, #0d2a12 30%, #0a1f0e 60%, #061209 100%)",
    backgroundColor: "#0a1f0e",
  },
  bg_orgeljoke: {
    backgroundImage: "linear-gradient(145deg, #1a0800 0%, #2d1200 30%, #1a0a00 60%, #0d0500 100%)",
    backgroundColor: "#1a0800",
  },
  bg_midnight: {
    backgroundImage: "linear-gradient(135deg, #0a0a2e 0%, #1a1a4e 50%, #0a0a2e 100%)",
    backgroundColor: "#0a0a2e",
  },
  bg_embers: {
    backgroundImage: "linear-gradient(145deg, #200a00 0%, #3d1400 50%, #200a00 100%)",
    backgroundColor: "#200a00",
  },
  bg_matrix: {
    backgroundImage: "linear-gradient(135deg, #001a0a 0%, #002d12 50%, #001a0a 100%)",
    backgroundColor: "#001a0a",
  },
};

const BG_LAYER_CLASSES: Partial<Record<string, string>> = {
  bg_particles:  "cosmetic-bg-particles",
  bg_waves:      "cosmetic-bg-waves",
  bg_neon_grid:  "cosmetic-bg-neon-grid",
  bg_soundwaves: "cosmetic-bg-soundwaves",
  bg_hand_van_god: "cosmetic-bg-hand-van-god",
  bg_confused: "cosmetic-bg-confused",
  bg_orgeljoke: "cosmetic-bg-orgeljoke",
  bg_midnight: "cosmetic-bg-midnight",
  bg_embers: "cosmetic-bg-embers",
  bg_matrix: "cosmetic-bg-matrix",
};

export function cardBgLayerProps(id: string | null | undefined): {
  style?: CSSProperties;
  className?: string;
} | null {
  if (!id || id === "bg_default") return null;
  return {
    style:     BG_LAYER_STYLES[id],
    className: BG_LAYER_CLASSES[id] ?? "",
  };
}

// Check if a card background is dark (needs white text)
export function isCardBgDark(id: string | null | undefined): boolean {
  if (!id) return false;
  // Backgrounds that are dark and need white text
  const darkBackgrounds = [
    "bg_lava",
    "bg_soundwaves",
    "bg_neon_grid",
    "bg_waves",
    "bg_gradient",
    "bg_hand_van_god",
    "bg_confused",
    "bg_orgeljoke",
    "bg_midnight",
    "bg_embers",
    "bg_matrix",
  ];
  return darkBackgrounds.includes(id);
}

// ── Rarity display metadata ───────────────────────────────────────────────────
export const RARITY_META: Record<Rarity, { color: string; glow: string; label: string }> = {
  common:    { color: "#9CA3AF", glow: "#6B7280",  label: "Common"    },
  rare:      { color: "#93C5FD", glow: "#3B82F6",  label: "Rare"      },
  epic:      { color: "#E9D5FF", glow: "#A855F7",  label: "Epic"      },
  legendary: { color: "#FDE68A", glow: "#F59E0B",  label: "Legendary" },
  special:   { color: "#FFD700", glow: "#FFA500",  label: "Special"   },
};

// Rarity fallback order used when the target pool is fully owned
export const RARITY_FALLBACK: Record<Rarity, Rarity[]> = {
  legendary: ["legendary", "epic", "rare", "common"],
  epic:      ["epic", "rare", "common"],
  rare:      ["rare", "common"],
  common:    ["common"],
  special:   ["special"],
};
