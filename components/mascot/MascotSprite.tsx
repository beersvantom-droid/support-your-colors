"use client";

// ── Mascot image registry ─────────────────────────────────────────────────────
const MASCOT_IMAGE: Record<string, string> = {
  mascot_dj_derksen:  "/mascots/dj-derksen.png",
  mascot_abu_harb:    "/mascots/abu-harb.png",
  mascot_jannes:      "/mascots/jannes.png",
  mascot_ron_jans:    "/mascots/ronjanss.png",
  mascot_golden_cor:  "/mascots/golden-cor.png",
  mascot_udo:         "/mascots/udo.png",
  mascot_ballie_kat:  "/mascots/kat.png",
  mascot_vuist:       "/mascots/vuist.png",
  mascot_winner:      "/mascots/winner.png",
  mascot_guiness:     "/mascots/drinken.png",
  mascot_gyokeres:    "/mascots/Gyökeres.png",
  mascot_pizza:       "/mascots/pizza.png",
  mascot_ster:        "/mascots/ster.png",
  mascot_ballie_patta: "/mascots/ballie-patta.png",
  mascot_wereldbeker: "/mascots/wereldbeker.png",
  mascot_speed:       "/mascots/speed.png",
  mascot_rustaagh:    "/mascots/rustaagh.png",
  mascot_poephond:    "/mascots/poephond.png",
  mascot_aardbei:     "/mascots/aardbei.png",
  mascot_leren_bal:   "/mascots/leren-bal.png",
  mascot_goat:        "/mascots/goat.png",
  mascot_hand_van_god: "/mascots/hand-van-god.png",
  mascot_confused:     "/mascots/confused.png",
  mascot_orgeljoke:    "/mascots/orgeljoke.png",
};

// ── Per-mascot animation class ────────────────────────────────────────────────
// Each mascot gets its own animation style to match its personality.
const MASCOT_ANIMATION: Record<string, string> = {
  mascot_dj_derksen:  "mascot-dj-derksen",
  mascot_abu_harb:    "mascot-abu-harb",
  mascot_jannes:      "mascot-jannes",
  mascot_ron_jans:    "mascot-ron-jans",
  mascot_golden_cor:  "mascot-golden-cor",
  mascot_udo:         "mascot-udo",
  mascot_ballie_kat:  "mascot-idle-default",
  mascot_vuist:       "mascot-idle-default",
  mascot_winner:      "mascot-idle-default",
  mascot_guiness:     "mascot-guiness",
  mascot_gyokeres:    "mascot-idle-default",
  mascot_pizza:       "mascot-idle-default",
  mascot_ster:        "mascot-idle-default",
  mascot_ballie_patta: "mascot-idle-default",
  mascot_wereldbeker: "mascot-idle-default",
  mascot_speed:       "mascot-idle-default",
  mascot_rustaagh:    "mascot-rustaagh",
  mascot_poephond:    "mascot-idle-default",
  mascot_aardbei:     "mascot-idle-default",
  mascot_leren_bal:   "mascot-idle-default",
  mascot_goat:        "mascot-goat",
  mascot_hand_van_god: "mascot-idle-default",
  mascot_confused:     "mascot-idle-default",
  mascot_orgeljoke:    "mascot-idle-default",
};

// ── Per-mascot blend mode ──────────────────────────────────────────────────────
// Different mascots need different blend modes based on their background
const MASCOT_BLEND_MODE: Record<string, string> = {
  mascot_dj_derksen:  "lighten", // Hides white background
  mascot_abu_harb:    "normal",  // Already has transparent background
  mascot_jannes:      "normal",  // Transparent background
  mascot_ron_jans:    "normal",  // Transparent background
  mascot_golden_cor:  "normal",  // Transparent background
  mascot_udo:         "normal",  // Transparent background
  mascot_ballie_kat:  "normal",  // Transparent background
  mascot_vuist:       "normal",  // Transparent background
  mascot_winner:      "normal",  // Transparent background
  mascot_guiness:     "normal",  // Transparent background
  mascot_gyokeres:    "normal",  // Transparent background
  mascot_pizza:       "normal",  // Transparent background
  mascot_ster:        "normal",  // Transparent background
  mascot_ballie_patta: "normal",  // Transparent background
  mascot_wereldbeker: "normal",  // Transparent background
  mascot_speed:       "normal",  // Transparent background
  mascot_rustaagh:    "normal",  // Transparent background
  mascot_poephond:    "normal",  // Transparent background
  mascot_aardbei:     "normal",  // Transparent background
  mascot_leren_bal:   "normal",  // Transparent background
  mascot_goat:        "normal",  // Transparent background
  mascot_hand_van_god: "normal",  // Transparent background
  mascot_confused:     "normal",  // Transparent background
  mascot_orgeljoke:    "normal",  // Transparent background
};

// Per-mascot scale factor — 1.0 = normal, < 1.0 = smaller
const MASCOT_SCALE: Record<string, number> = {
  mascot_golden_cor: 0.96, // Slightly smaller than the rest
  mascot_udo:        0.96, // Same as Cor
};

interface MascotSpriteProps {
  id: string;
  size?: number;
  animationDelay?: number; // ms, staggers multiple mascots
}

export default function MascotSprite({
  id,
  size = 44,
  animationDelay = 0,
}: MascotSpriteProps) {
  const src       = MASCOT_IMAGE[id];
  const animClass = MASCOT_ANIMATION[id] ?? "mascot-idle-default";
  const scale     = MASCOT_SCALE[id] ?? 1.0;
  const scaledSize = Math.round(size * scale);

  if (!src) return null;

  return (
    <div
      className={`mascot-sprite ${animClass}`}
      style={{
        width:           scaledSize,
        height:          scaledSize * 1.25,
        position:        "relative",
        flexShrink:      0,
        animationDelay:  `${animationDelay}ms`,
        backgroundColor: "transparent",
        overflow:        "visible",
        marginBottom:    -4,
      }}
    >
      <img
        src={src}
        alt={id}
        width={scaledSize}
        height={Math.round(scaledSize * 1.25)}
        style={{
          width:           "100%",
          height:          "100%",
          objectFit:       "contain",
          objectPosition:  "bottom",
          imageRendering:  "pixelated",
          animationDelay:  `${animationDelay}ms`,
          backgroundColor: "transparent",
          mixBlendMode:    (MASCOT_BLEND_MODE[id] ?? "normal") as any,
          display:         "block",
        }}
      />
    </div>
  );
}
