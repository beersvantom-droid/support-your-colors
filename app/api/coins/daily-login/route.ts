import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import * as coins from "@/lib/coins";

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

function makeServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );
}

/**
 * POST /api/coins/daily-login
 * Claims the daily login bonus (100 coins, once per day)
 * Returns:
 *   - success: true/false
 *   - coinsAdded: number of coins added
 *   - totalBalance: new total balance
 *   - alreadyClaimed?: true if already claimed today
 */
export async function POST(req: NextRequest) {
  try {
    const db = makeUserClient(req);
    const { data: { user } } = await db.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceDb = makeServiceClient();
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Check if user already claimed today
    const { data: loginRecord, error: loginError } = await serviceDb
      .from("user_daily_login")
      .select("last_login_date")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!loginError && loginRecord && loginRecord.last_login_date === today) {
      // Already claimed today
      const { data: coinRecord } = await serviceDb
        .from("user_coins")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      return NextResponse.json({
        success: false,
        alreadyClaimed: true,
        totalBalance: coinRecord?.balance ?? 0,
      });
    }

    // Claim not made today — add coins and update login record
    // First, ensure user has a coin record
    const { data: existingCoins } = await serviceDb
      .from("user_coins")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existingCoins) {
      // Create initial coin record with daily bonus
      await serviceDb.from("user_coins").insert({
        user_id: user.id,
        balance: coins.DAILY_LOGIN_COINS,
      });
    } else {
      // Update existing coin record
      await serviceDb
        .from("user_coins")
        .update({
          balance: existingCoins.balance + coins.DAILY_LOGIN_COINS,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    }

    // Update or insert daily login record
    if (!loginRecord) {
      // First login ever
      await serviceDb.from("user_daily_login").insert({
        user_id: user.id,
        last_login_date: today,
        coins_claimed: coins.DAILY_LOGIN_COINS,
      });
    } else {
      // Update existing record
      await serviceDb
        .from("user_daily_login")
        .update({
          last_login_date: today,
          coins_claimed: coins.DAILY_LOGIN_COINS,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    }

    // Get new balance
    const { data: updatedCoins } = await serviceDb
      .from("user_coins")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      coinsAdded: coins.DAILY_LOGIN_COINS,
      totalBalance: updatedCoins?.balance ?? coins.DAILY_LOGIN_COINS,
    });
  } catch (error) {
    console.error("Unexpected error in POST /api/coins/daily-login:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
