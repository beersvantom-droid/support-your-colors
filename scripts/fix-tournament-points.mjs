import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf-8").split("\n").filter(l => l.includes("=")).map(l => {
    const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const POINTS = { win: 500, draw: 250, loss: 100 };

// Get all finished + processed matches
const { data: matches, error: matchErr } = await supabase
  .from("match_results")
  .select("home_team, away_team, home_score, away_score, winner")
  .eq("status", "finished")
  .eq("processed", true);

if (matchErr) { console.error("Error fetching matches:", matchErr); process.exit(1); }
console.log(`Found ${matches.length} finished+processed matches`);

// Get all profiles
const { data: profiles, error: profErr } = await supabase
  .from("profiles")
  .select("id, username, country, tournament_points");

if (profErr) { console.error("Error fetching profiles:", profErr); process.exit(1); }

// Build correct points per user
const correctPoints = {};
for (const p of profiles) {
  correctPoints[p.id] = { username: p.username, country: p.country, current: p.tournament_points ?? 0, correct: 0 };
}

for (const match of matches) {
  const { home_team, away_team, home_score, away_score, winner } = match;
  if (home_score == null || away_score == null) continue;

  for (const p of profiles) {
    if (!p.country) continue;
    const country = p.country;
    let pts = 0;

    if (country === home_team || country === away_team) {
      const isHome = country === home_team;
      if (winner === "draw") {
        pts = POINTS.draw;
      } else if ((winner === home_team && isHome) || (winner === away_team && !isHome)) {
        pts = POINTS.win;
      } else {
        pts = POINTS.loss;
      }
    }

    correctPoints[p.id].correct += pts;
  }
}

// Find users whose points are wrong
const wrong = Object.entries(correctPoints).filter(([, v]) => v.current !== v.correct);
console.log(`\nUsers with incorrect tournament_points: ${wrong.length}`);
for (const [id, v] of wrong) {
  console.log(`  ${v.username} (${v.country}): has ${v.current}, should be ${v.correct}`);
}

if (wrong.length === 0) {
  console.log("All points are already correct!");
  process.exit(0);
}

// Fix them
console.log("\nFixing...");
for (const [id, v] of wrong) {
  const { error } = await supabase
    .from("profiles")
    .update({ tournament_points: v.correct })
    .eq("id", id);

  if (error) {
    console.error(`  FAILED for ${v.username}:`, error.message);
  } else {
    console.log(`  Fixed ${v.username}: ${v.current} → ${v.correct}`);
  }
}

console.log("\nDone!");
