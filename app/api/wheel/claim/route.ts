import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { WHEEL_COSMETICS, WHEEL_MASCOTS, type Rarity, type Cosmetic, type Mascot } from "@/lib/cosmetics";

export const runtime = "nodejs";

function makeUserClient(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: () => {},
      },
    }
  );
}

function pickUnowned(rarity: Rarity | "mascots", owned: Set<string>): Cosmetic | Mascot | null {
  // If mascots rarity, return weighted random mascot by type: legendary 20%, epic 30%, rare 50%
  if (rarity === "mascots") {
    const legendaryMascots = WHEEL_MASCOTS.filter(m => m.rarity === "legendary" && !owned.has(m.id));
    const epicMascots = WHEEL_MASCOTS.filter(m => m.rarity === "epic" && !owned.has(m.id));
    const rareMascots = WHEEL_MASCOTS.filter(m => m.rarity === "rare" && !owned.has(m.id));

    const roll = Math.random();
    let pool: Mascot[] = [];
    if (roll < 0.20) {
      pool = legendaryMascots;
    } else if (roll < 0.50) {
      pool = epicMascots;
    } else {
      pool = rareMascots;
    }

    // If chosen pool is empty, try next tier
    if (!pool.length) {
      if (roll < 0.20 && epicMascots.length) pool = epicMascots;
      else if (roll < 0.50 && legendaryMascots.length) pool = legendaryMascots;
      else if (legendaryMascots.length) pool = legendaryMascots;
      else if (epicMascots.length) pool = epicMascots;
    }

    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Regular cosmetic pool by rarity
  const cosmeticPool = WHEEL_COSMETICS.filter(c => c.rarity === rarity && !owned.has(c.id));
  const pool = [...cosmeticPool];
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function POST(req: NextRequest) {
  const db = makeUserClient(req);
  const { data: { user } } = await db.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { rarity?: string };
  const rarity = body.rarity as Rarity | "mascots";
  if (!["common", "rare", "epic", "legendary", "mascots"].includes(rarity)) {
    return NextResponse.json({ error: "Invalid rarity" }, { status: 400 });
  }

  const { data: existing } = await db
    .from("user_cosmetics")
    .select("cosmetic_id")
    .eq("user_id", user.id);

  const owned = new Set((existing ?? []).map((r: { cosmetic_id: string }) => r.cosmetic_id));

  // Only pick from the exact rolled rarity — no downgrade fallback.
  // If all owned → tell the client "collection complete for this rarity".
  const picked = pickUnowned(rarity, owned);
  if (!picked) {
    return NextResponse.json({ alreadyOwnsAll: true });
  }

  const { error } = await db.from("user_cosmetics").insert({
    user_id:     user.id,
    cosmetic_id: picked.id,
  });

  if (error) {
    console.error("wheel/claim insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ cosmetic: picked });
}
