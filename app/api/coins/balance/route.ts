import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

/**
 * GET /api/coins/balance
 * Returns the current coin balance for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const db = makeUserClient(req);
    const { data: { user } } = await db.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Query user's current balance
    const { data: coinRecord, error: coinError } = await db
      .from("user_coins")
      .select("balance, updated_at")
      .eq("user_id", user.id)
      .single();

    if (coinError) {
      // If no record exists yet, return 0 balance (will be created on first login/purchase)
      if (coinError.code === "PGRST116") {
        return NextResponse.json({
          balance: 0,
          lastUpdated: new Date().toISOString(),
        });
      }

      console.error("Error fetching coin balance:", coinError);
      return NextResponse.json(
        { error: "Failed to fetch balance" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      balance: coinRecord.balance,
      lastUpdated: coinRecord.updated_at,
    });
  } catch (error) {
    console.error("Unexpected error in GET /api/coins/balance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
