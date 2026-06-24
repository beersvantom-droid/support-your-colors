import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const MAX_POST_SLOTS = 5;
const SLOT_PRICES = [200, 400, 600, 800, 1000];

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

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const db = makeUserClient(req);
  const admin = adminClient();
  const { data: { user } } = await db.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Get profile
  const { data: profile } = await db
    .from("profiles")
    .select("post_mascot_slots, equipped_mascots")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ success: false, error: "Profile not found" }, { status: 404 });
  }

  const currentSlots = profile.post_mascot_slots ?? 0;

  // Must have 3 ranking mascots first
  const rankingMascots = profile.equipped_mascots ?? [];
  if (rankingMascots.length < 3) {
    return NextResponse.json(
      { success: false, error: "Je moet eerst 3 mascots op je ranking card hebben." },
      { status: 400 }
    );
  }

  if (currentSlots >= MAX_POST_SLOTS) {
    return NextResponse.json(
      { success: false, error: "Je hebt al het maximum aantal post-slots." },
      { status: 400 }
    );
  }

  const price = SLOT_PRICES[currentSlots];

  // Check coins
  const { data: coins } = await admin
    .from("user_coins")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle();

  const balance = coins?.balance ?? 0;
  if (balance < price) {
    return NextResponse.json(
      { success: false, error: `Niet genoeg munten. Je hebt ${balance}, nodig: ${price}.` },
      { status: 400 }
    );
  }

  // Deduct coins
  await admin
    .from("user_coins")
    .update({ balance: balance - price })
    .eq("user_id", user.id);

  // Add slot
  await admin
    .from("profiles")
    .update({ post_mascot_slots: currentSlots + 1 })
    .eq("id", user.id);

  return NextResponse.json({
    success: true,
    newSlotCount: currentSlots + 1,
    coinsSpent: price,
    remainingBalance: balance - price,
  });
}
