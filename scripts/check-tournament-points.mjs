import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf-8").split("\n").filter(l => l.includes("=")).map(l => {
    const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const POINTS = { win: 500, draw: 250, loss: 100 };

// Get ALL finished matches (processed or not)
const { data: matches } = await supabase
  .from("match_results")
  .select("home_team, away_team, home_score, away_score, winner, status, processed")
  .eq("status", "finished");

console.log(`\n=== ALL FINISHED MATCHES (${matches.length}) ===`);
for (const m of matches) {
  console.log(`  ${m.home_team} ${m.home_score}-${m.away_score} ${m.away_team} | processed=${m.processed}`);
}

// Get all profiles with a country set
const { data: profiles } = await supabase
  .from("profiles")
  .select("id, username, country, tournament_points")
  .not("country", "is", null);

console.log(`\n=== CURRENT TOURNAMENT POINTS vs CORRECT ===`);

const corrections = [];

for (const p of profiles) {
  const country = p.country;
  let correct = 0;

  for (const m of matches) {
    const { home_team, away_team, home_score, away_score, winner } = m;
    if (home_score == null || away_score == null) continue;

    if (country === home_team || country === away_team) {
      const isHome = country === home_team;
      if (winner === "draw") {
        correct += POINTS.draw;
      } else if ((winner === home_team && isHome) || (winner === away_team && !isHome)) {
        correct += POINTS.win;
      } else {
        correct += POINTS.loss;
      }
    }
  }

  const current = p.tournament_points ?? 0;
  const status = current === correct ? "✅" : "❌";
  if (current !== correct) {
    corrections.push({ id: p.id, username: p.username, country, current, correct });
  }
  console.log(`  ${status} ${p.username} (${country}): heeft ${current}, moet ${correct}`);
}

// Also check: which countries have users but no finished matches?
const userCountries = new Set(profiles.map(p => p.country));
const matchCountries = new Set(matches.flatMap(m => [m.home_team, m.away_team]));
const noMatches = [...userCountries].filter(c => c && !matchCountries.has(c));
if (noMatches.length > 0) {
  console.log(`\n=== LANDEN MET USERS MAAR GEEN FINISHED MATCHES ===`);
  for (const c of noMatches) {
    const users = profiles.filter(p => p.country === c);
    console.log(`  ${c}: ${users.map(u => u.username).join(", ")} (punten: ${users.map(u => u.tournament_points ?? 0).join(", ")})`);
  }
}

if (corrections.length === 0) {
  console.log("\n✅ Alle punten kloppen!");
} else {
  console.log(`\n❌ ${corrections.length} gebruikers hebben verkeerde punten:`);
  for (const c of corrections) {
    console.log(`  ${c.username} (${c.country}): ${c.current} → ${c.correct}`);
  }
}
