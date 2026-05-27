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
    const db = makeServiceClient();
    const today = new Date();
    const in18Days = new Date(today.getTime() + 18 * 24 * 60 * 60 * 1000);

    // Get next 18 upcoming matches within 18 days
    const { data: matches, error } = await db
      .from("match_results")
      .select("*")
      .eq("status", "upcoming")
      .gte("match_date", today.toISOString().split("T")[0])
      .lte("match_date", in18Days.toISOString().split("T")[0])
      .order("match_date", { ascending: true })
      .limit(18);

    if (error) {
      console.error("[predictions/upcoming] error:", error);
      return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 });
    }

    return NextResponse.json({
      matches: matches ?? [],
      total: matches?.length ?? 0,
    });
  } catch (err) {
    console.error("[predictions/upcoming] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
