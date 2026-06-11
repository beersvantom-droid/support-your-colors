import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function makeUserClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    }
  );
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = makeUserClient(token);

    // Get user
    const { data: userData, error: userError } = await db.auth.getUser();

    if (userError || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const matchId = req.nextUrl.searchParams.get("match_id");

    if (!matchId) {
      return NextResponse.json({ error: "Missing match_id" }, { status: 400 });
    }

    // Get user's prediction for this match
    const { data: prediction, error } = await db
      .from("match_predictions")
      .select("prediction")
      .eq("user_id", userData.user.id)
      .eq("match_id", matchId)
      .maybeSingle();

    if (error) {
      console.error("[predictions/get] error:", error);
      return NextResponse.json({ error: "Failed to fetch prediction" }, { status: 500 });
    }

    return NextResponse.json({ prediction: prediction?.prediction || null });
  } catch (err) {
    console.error("[predictions/get] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
