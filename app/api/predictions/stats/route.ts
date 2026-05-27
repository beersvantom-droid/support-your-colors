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
    const matchId = req.nextUrl.searchParams.get("match_id");

    if (!matchId) {
      return NextResponse.json({ error: "Missing match_id" }, { status: 400 });
    }

    const db = makeServiceClient();

    // Get all predictions for this match
    const { data: predictions, error } = await db
      .from("match_predictions")
      .select("prediction")
      .eq("match_id", matchId);

    if (error) {
      console.error("[predictions/stats] error:", error);
      return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }

    // Calculate percentages
    const total = predictions?.length ?? 0;
    const counts = {
      home_win: 0,
      draw: 0,
      away_win: 0,
    };

    predictions?.forEach((p: any) => {
      if (p.prediction in counts) {
        counts[p.prediction as keyof typeof counts]++;
      }
    });

    const percentages = {
      home_win: total > 0 ? Math.round((counts.home_win / total) * 100) : 0,
      draw: total > 0 ? Math.round((counts.draw / total) * 100) : 0,
      away_win: total > 0 ? Math.round((counts.away_win / total) * 100) : 0,
      total,
    };

    return NextResponse.json(percentages);
  } catch (err) {
    console.error("[predictions/stats] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
