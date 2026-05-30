const { createClient } = require("@supabase/supabase-js");

const GROUPS = require("../lib/wc2026-data").GROUPS;

const MONTH_MAP = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

function parseFixtureDate(date) {
  const [monthStr, day] = date.split(" ");
  const month = MONTH_MAP[monthStr];
  return `2026-${String(month).padStart(2, "0")}-${String(parseInt(day)).padStart(2, "0")}`;
}

async function seedMatches() {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const matches = [];

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

  console.log(`Seeding ${matches.length} matches...`);

  const { data, error } = await db
    .from("match_results")
    .upsert(matches, { onConflict: "external_id" });

  if (error) {
    console.error("Error:", error);
    process.exit(1);
  }

  console.log("✓ Successfully seeded matches!");
  console.log(`Inserted/updated: ${matches.length} matches`);
  process.exit(0);
}

seedMatches();
