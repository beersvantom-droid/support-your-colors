import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf-8").split("\n").filter(l => l.includes("=")).map(l => {
    const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data } = await supabase
  .from("match_results")
  .select("id, home_team, away_team, status, home_score, away_score, processed, match_date")
  .or("home_team.ilike.%argentina%,away_team.ilike.%argentina%")
  .order("match_date");

console.table(data);
