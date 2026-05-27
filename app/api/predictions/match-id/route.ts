import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(req: NextRequest) {
  try {
    const homeTeam = req.nextUrl.searchParams.get("home_team");
    const awayTeam = req.nextUrl.searchParams.get("away_team");
    const matchDate = req.nextUrl.searchParams.get("match_date");

    if (!homeTeam || !awayTeam || !matchDate) {
      return NextResponse.json(
        { error: "Missing home_team, away_team, or match_date" },
        { status: 400 }
      );
    }

    const db = makeServiceClient();

    // Find match by home_team, away_team, and match_date
    const { data: match, error } = await db
      .from("match_results")
      .select("id")
      .eq("home_team", homeTeam)
      .eq("away_team", awayTeam)
      .eq("match_date", matchDate)
      .single();

    if (error || !match) {
      // Match not found in database, return null
      return NextResponse.json({ id: null });
    }

    return NextResponse.json({ id: match.id });
  } catch (err) {
    console.error("[predictions/match-id] unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
