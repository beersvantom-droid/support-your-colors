import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GROUPS } from "@/lib/wc2026-data";

export const runtime = "nodejs";

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function parseFixtureDate(date: string): string {
  // "Jun 11" → "2026-06-11"
  const months: Record<string, number> = {
    Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
    Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
  };
  const [monthStr, day] = date.split(" ");
  const month = months[monthStr];
  return `2026-${String(month).padStart(2, "0")}-${String(parseInt(day)).padStart(2, "0")}`;
}

export async function POST(req: NextRequest) {
  // Simple auth check - only allow if admin or has special token
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const db = makeServiceClient();
    const matches = [];

    // Extract all fixtures from groups
    for (const group of GROUPS) {
      for (const fixture of group.fixtures) {
        if (fixture.status === "upcoming" || fixture.status === "live") {
          matches.push({
            external_id: `${group.id}-${fixture.home}-${fixture.away}-${fixture.date}`,
            home_team: fixture.home,
            away_team: fixture.away,
            match_date: parseFixtureDate(fixture.date),
            status: fixture.status || "upcoming",
          });
        }
      }
    }

    console.log(`[seed-matches] Seeding ${matches.length} matches...`);

    // Insert matches (upsert to avoid duplicates)
    const { data, error } = await db
      .from("match_results")
      .upsert(matches, { onConflict: "external_id" });

    if (error) {
      console.error("[seed-matches] error:", error);
      return NextResponse.json({ error: "Failed to seed matches" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      seeded: matches.length,
      data,
    });
  } catch (err) {
    console.error("[seed-matches] unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
