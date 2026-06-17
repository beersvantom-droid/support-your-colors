import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf-8").split("\n").filter(l => l.includes("=")).map(l => {
    const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const MATCH_ID = "a9e67832-9d5c-4c06-8d47-ade3dc834c91"; // Argentina vs Algeria

// Update score to 3-0 and reset processed so standings + points recalculate
const { data, error } = await supabase
  .from("match_results")
  .update({ home_score: 3, away_score: 0, processed: false })
  .eq("id", MATCH_ID)
  .select("id, home_team, away_team, status, home_score, away_score, processed");

if (error) {
  console.error("Error:", error.message);
} else {
  console.log("Score updated:", data);
}
