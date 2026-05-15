import { TEAMS } from "./wc2026-data";

// ISO alpha-2 → full country name (covers all WC 2026 nations + common codes)
const ISO_TO_NAME: Record<string, string> = {
  QA: "Qatar",
  IQ: "Iraq",
  TN: "Tunisia",
  BA: "Bosnia and Herzegovina",
  EC: "Ecuador",
  CW: "Curaçao",
  CH: "Switzerland",
  DE: "Germany",
  CA: "Canada",
  MX: "Mexico",
  US: "United States",
  BR: "Brazil",
  AR: "Argentina",
  JP: "Japan",
  MA: "Morocco",
  NL: "Netherlands",
  FR: "France",
  IT: "Italy",
  PT: "Portugal",
  ZA: "South Africa",
  KR: "South Korea",
  CZ: "Czechia",
  HT: "Haiti",
  PY: "Paraguay",
  AU: "Australia",
  TR: "Türkiye",
  CI: "Ivory Coast",
  SE: "Sweden",
  BE: "Belgium",
  EG: "Egypt",
  IR: "Iran",
  NZ: "New Zealand",
  ES: "Spain",
  CV: "Cape Verde",
  SA: "Saudi Arabia",
  UY: "Uruguay",
  SN: "Senegal",
  NO: "Norway",
  DZ: "Algeria",
  AT: "Austria",
  JO: "Jordan",
  CD: "Congo DR",
  UZ: "Uzbekistan",
  CO: "Colombia",
  HR: "Croatia",
  GH: "Ghana",
  PA: "Panama",
  // England / Scotland need special handling — ISO code is GB
  GB: "England",
};

export interface CountryInfo {
  flag: string;
  color: string;
  initials: (username: string) => string;
}

function toInitials(username: string): string {
  return username
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Convert ISO alpha-2 code to emoji flag using Unicode regional indicators
function isoToEmojiFlag(iso: string): string {
  if (iso.length !== 2) return "🌍";
  return Array.from(iso.toUpperCase())
    .map((c) => String.fromCodePoint(0x1f1e0 + c.charCodeAt(0) - 65))
    .join("");
}

const FALLBACK: CountryInfo = {
  flag: "🌍",
  color: "#6B7280",
  initials: (u) => toInitials(u),
};

function makeInfo(flag: string, color: string): CountryInfo {
  return { flag, color, initials: (u) => toInitials(u) };
}

export function getCountryInfo(country: string | null | undefined): CountryInfo {
  if (!country) return FALLBACK;

  // 1. Try full country name in TEAMS (the primary registry)
  const direct = TEAMS[country];
  if (direct) return makeInfo(direct.flag, direct.color);

  // 2. Try ISO alpha-2 alias → resolve to full name → TEAMS
  const upper = country.toUpperCase();
  const resolvedName = ISO_TO_NAME[upper];
  if (resolvedName) {
    const team = TEAMS[resolvedName];
    if (team) return makeInfo(team.flag, team.color);
    // Name found in alias but not in TEAMS — still compute correct flag
    return { ...FALLBACK, flag: isoToEmojiFlag(upper) };
  }

  // 3. If it looks like a 2-letter ISO code, generate the emoji directly
  if (/^[A-Z]{2}$/i.test(country)) {
    return { ...FALLBACK, flag: isoToEmojiFlag(upper) };
  }

  return FALLBACK;
}

// Convenience: just the flag — handles full names, ISO codes, anything
export function getCountryFlag(country: string | null | undefined): string {
  return getCountryInfo(country).flag;
}

export function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
