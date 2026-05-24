import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getShopPack } from "@/lib/packs";

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
 * POST /api/pack/purchase
 * Purchase a pack using coins
 * Body: { packId: string }
 * Returns:
 *   - success: true/false
 *   - balance: new coin balance after purchase
 *   - error?: error message if purchase failed
 */
export async function POST(req: NextRequest) {
  try {
    const db = makeUserClient(req);
    const { data: { user } } = await db.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { packId } = await req.json();

    if (!packId || typeof packId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid packId" },
        { status: 400 }
      );
    }

    // Validate pack exists in SHOP_PACKS
    const pack = getShopPack(packId);
    if (!pack) {
      return NextResponse.json(
        { error: "Pack not found" },
        { status: 404 }
      );
    }

    // Validate pack has a cost
    if (!pack.cost || pack.cost.currency !== "coins") {
      return NextResponse.json(
        { error: "Pack is not available for purchase" },
        { status: 400 }
      );
    }

    const cost = pack.cost.amount;
    const serviceDb = makeServiceClient();

    // Get user's current coin balance
    const { data: coinRecord, error: coinError } = await serviceDb
      .from("user_coins")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    if (coinError || !coinRecord) {
      // User has no coin record yet
      return NextResponse.json(
        { error: "Insufficient coins", success: false, balance: 0 },
        { status: 402 }
      );
    }

    const currentBalance = coinRecord.balance;

    // Check if user has enough coins
    if (currentBalance < cost) {
      return NextResponse.json(
        {
          error: `Insufficient coins (need ${cost}, have ${currentBalance})`,
          success: false,
          balance: currentBalance,
        },
        { status: 402 }
      );
    }

    // Deduct coins from user's balance
    const newBalance = currentBalance - cost;

    const { error: updateError } = await serviceDb
      .from("user_coins")
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating coin balance:", updateError);
      return NextResponse.json(
        { error: "Failed to process purchase" },
        { status: 500 }
      );
    }

    // Success — return new balance
    return NextResponse.json({
      success: true,
      balance: newBalance,
      coinsSpent: cost,
    });
  } catch (error) {
    console.error("Unexpected error in POST /api/pack/purchase:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
