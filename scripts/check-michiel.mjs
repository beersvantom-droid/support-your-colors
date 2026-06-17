import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf-8").split("\n").filter(l => l.includes("=")).map(l => {
    const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Find Michiel
const { data: michiel } = await supabase.from("profiles").select("*").ilike("username", "%michiel%").single();
console.log("Michiel:", michiel?.username, "Country:", michiel?.country, "Tournament Points:", michiel?.tournament_points);

// Count Argentina supporters
const { count: argCount } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("country", "Argentina");
console.log("Argentina supporters:", argCount);

// Calculate: 87500 / 500 = 175
console.log("87500 / 500 =", 87500 / 500);
console.log("If", argCount, "supporters, then sync ran", 87500 / 500 / argCount, "times");

// Check match results
const { data: matches } = await supabase.from("match_results").select("id, home_team, away_team, status, processed").eq("home_team", "Argentina");
console.log("\nArgentina matches:", matches?.map(m => ({ id: m.id, vs: m.away_team, status: m.status, processed: m.processed })));
