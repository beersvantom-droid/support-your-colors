import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { COSMETICS, MASCOTS } from "@/lib/cosmetics";

export const runtime = "nodejs";

const ITEM_PRICES: Record<string, number> = {
  common: 150,
  rare: 500,
  epic: 750,
  legendary: 1000,
  special: 1500,
};

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const userClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { itemId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const itemId = body.itemId;
  if (!itemId) {
    return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
  }

  // Find the item
  const mascot = MASCOTS.find(m => m.id === itemId);
  const cosmetic = COSMETICS.find(c => c.id === itemId);
  const item = mascot || cosmetic;

  if (!item) {
    return NextResponse.json({ error: "Item niet gevonden" }, { status: 404 });
  }

  const price = ITEM_PRICES[item.rarity] ?? 500;
  const admin = adminClient();

  // Check if already owned
  const { data: existing } = await admin
    .from("user_cosmetics")
    .select("id")
    .eq("user_id", user.id)
    .eq("cosmetic_id", itemId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Je hebt dit item al" }, { status: 400 });
  }

  // Check coin balance
  const { data: coins } = await admin
    .from("user_coins")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle();

  const balance = coins?.balance ?? 0;
  if (balance < price) {
    return NextResponse.json(
      { error: `Niet genoeg munten. Je hebt ${balance}, nodig: ${price}.` },
      { status: 400 }
    );
  }

  // Deduct coins
  await admin
    .from("user_coins")
    .update({ balance: balance - price })
    .eq("user_id", user.id);

  // Give item
  await admin
    .from("user_cosmetics")
    .insert({ user_id: user.id, cosmetic_id: itemId });

  return NextResponse.json({
    success: true,
    balance: balance - price,
    itemId,
    label: item.label,
  });
}
