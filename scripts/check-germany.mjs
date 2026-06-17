import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf-8").split("\n").filter(l => l.includes("=")).map(l => {
    const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Check Germany matches
const { data: matches } = await supabase
  .from("match_results")
  .select("id, home_team, away_team, home_score, away_score, status, processed")
  .or("home_team.eq.Germany,away_team.eq.Germany");

console.log("Germany matches:");
for (const m of matches ?? []) {
  console.log(`  ${m.home_team} ${m.home_score}-${m.away_score} ${m.away_team} | status: ${m.status}, processed: ${m.processed}`);
}

// Count Germany supporters
const { count: deCount } = await supabase
  .from("profiles")
  .select("*", { count: "exact", head: true })
  .eq("country", "Germany");

console.log("\nGermany supporters:", deCount);
console.log("87500 points / 500 per win =", 87500 / 500, "wins");
console.log("175 wins / " + deCount + " supporters = each supporter got", 175 / deCount, "sync runs");
