import { NextRequest, NextResponse } from "next/server";
import { GROUPS } from "@/lib/wc2026-data";

export const runtime = "nodejs";

// Convert fixture date like "Jun 12" to Date object
function parseFixtureDate(date: string, year = 2026): Date {
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const [monthStr, dayStr] = date.split(" ");
  const month = months[monthStr] ?? 5;
  const day = parseInt(dayStr, 10);
  return new Date(Date.UTC(year, month, day));
}

export async function GET(req: NextRequest) {
  try {
    const today = new Date();
    const in18Days = new Date(today.getTime() + 18 * 24 * 60 * 60 * 1000);

    // Get all upcoming matches from static data within 18 days
    const matches = GROUPS.flatMap((group) =>
      group.fixtures
        .filter(
          (f) =>
            f.status === "upcoming" &&
            parseFixtureDate(f.date) >= today &&
            parseFixtureDate(f.date) <= in18Days
        )
        .map((f) => ({
          id: `${group.id}-${f.home}-${f.away}-${f.date}`,
          home_team: f.home,
          away_team: f.away,
          match_date: f.date,
          match_time: f.time,
          status: f.status,
          venue: f.venue,
          city: f.city,
        }))
    ).sort((a, b) => {
      const dateA = parseFixtureDate(a.match_date);
      const dateB = parseFixtureDate(b.match_date);
      return dateA.getTime() - dateB.getTime();
    }).slice(0, 18);

    return NextResponse.json({
      matches,
      total: matches.length,
    });
  } catch (err) {
    console.error("[predictions/upcoming] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
