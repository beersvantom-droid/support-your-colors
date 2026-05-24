import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";

// Dev/test accounts that can reset
const RESETABLE_USERS = new Set([
  "5dc52039-2adc-44fe-bc84-e7a6995ac2ec", // Testbot
]);

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

export async function POST(req: NextRequest) {
  const db = makeUserClient(req);
  const { data: { user } } = await db.auth.getUser();

  if (!user || !RESETABLE_USERS.has(user.id)) {
    return NextResponse.json({ error: "Not authorized to reset" }, { status: 403 });
  }

  try {
    console.log(`[Reset] Resetting user: ${user.id}`);

    // 1. Clear all equipped cosmetics from profiles table
    const profileRes = await db.from("profiles").update({
      equipped_name_color: null,
      equipped_border: null,
      equipped_badge: null,
      equipped_card_bg: null,
      equipped_mascots: null,
    }).eq("id", user.id);
    console.log("[Reset] Profile equipped cleared:", profileRes);

    // 2. Delete all cosmetics from inventory
    const cosmRes = await db.from("user_cosmetics").delete().eq("user_id", user.id);
    console.log("[Reset] Cosmetics deleted:", cosmRes);

    // 3. Delete pack cooldowns
    const coolRes = await db.from("user_pack_cooldowns").delete().eq("user_id", user.id);
    console.log("[Reset] Cooldowns deleted:", coolRes);

    // 4. Reset coins to 10000 (using service role for RLS bypass)
    const serviceDb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll: () => {},
        },
      }
    );
    const coinRes = await serviceDb.from("user_coins").upsert({
      user_id: user.id,
      balance: 10000,
    });
    console.log("[Reset] Coins reset:", coinRes);

    return NextResponse.json({
      success: true,
      message: "✅ Alles volledig geresetteld!",
    });
  } catch (err) {
    console.error("Reset error:", err);
    return NextResponse.json(
      { error: "Reset failed: " + (err instanceof Error ? err.message : "Unknown error") },
      { status: 500 }
    );
  }
}
