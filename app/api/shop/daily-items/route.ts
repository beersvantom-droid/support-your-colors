import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { COSMETICS, MASCOTS, RARITY_META } from "@/lib/cosmetics";
import type { Rarity } from "@/lib/cosmetics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ITEM_PRICES: Record<string, number> = {
  common: 150,
  rare: 500,
  epic: 750,
  legendary: 1000,
  special: 1500,
};

function getShopDay(): string {
  const amsNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
  if (amsNow.getHours() < 5) {
    amsNow.setDate(amsNow.getDate() - 1);
  }
  return amsNow.toISOString().split("T")[0];
}

function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = (h * 1664525 + 1013904223) | 0;
    return ((h >>> 0) / 4294967296);
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const shopDay = getShopDay();
  const rng = seededRandom(`${user.id}_${shopDay}`);

  // Get user's owned items
  const { data: owned } = await supabase
    .from("user_cosmetics")
    .select("cosmetic_id")
    .eq("user_id", user.id);
  const ownedSet = new Set((owned ?? []).map((r: { cosmetic_id: string }) => r.cosmetic_id));

  // Get coin balance
  const { data: coins } = await supabase
    .from("user_coins")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle();

  // Select 3 random mascots (exclude special rarity from random pool)
  const buyableMascots = MASCOTS.filter(m => m.rarity !== "special");
  const shuffledMascots = shuffle(buyableMascots, rng);
  const dailyMascots = shuffledMascots.slice(0, 3).map(m => ({
    id: m.id,
    type: "mascot" as const,
    label: m.label,
    emoji: m.emoji,
    rarity: m.rarity,
    rarityLabel: RARITY_META[m.rarity as Rarity]?.label ?? m.rarity,
    rarityColor: RARITY_META[m.rarity as Rarity]?.color ?? "#9CA3AF",
    price: ITEM_PRICES[m.rarity] ?? 500,
    owned: ownedSet.has(m.id),
  }));

  // Select 3 random cosmetics (exclude defaults and wheelEligible=false non-specials)
  const buyableCosmetics = COSMETICS.filter(c =>
    c.id !== "bg_default" && c.rarity !== "special"
  );
  const shuffledCosmetics = shuffle(buyableCosmetics, rng);
  const dailyCosmetics = shuffledCosmetics.slice(0, 3).map(c => ({
    id: c.id,
    type: c.type,
    label: c.label,
    emoji: c.emoji,
    rarity: c.rarity,
    rarityLabel: RARITY_META[c.rarity as Rarity]?.label ?? c.rarity,
    rarityColor: RARITY_META[c.rarity as Rarity]?.color ?? "#9CA3AF",
    price: ITEM_PRICES[c.rarity] ?? 200,
    owned: ownedSet.has(c.id),
  }));

  // Calculate next reset time (5 AM Amsterdam)
  const amsNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const nextReset = new Date(amsNow);
  if (amsNow.getHours() >= 5) {
    nextReset.setDate(nextReset.getDate() + 1);
  }
  nextReset.setHours(5, 0, 0, 0);
  const resetInMs = nextReset.getTime() - amsNow.getTime();
  const resetInHours = Math.floor(resetInMs / 3600000);
  const resetInMinutes = Math.floor((resetInMs % 3600000) / 60000);

  return NextResponse.json({
    mascots: dailyMascots,
    cosmetics: dailyCosmetics,
    balance: coins?.balance ?? 0,
    resetIn: `${resetInHours}u ${resetInMinutes}m`,
  });
}
