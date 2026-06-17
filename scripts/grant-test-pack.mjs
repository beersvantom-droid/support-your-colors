/**
 * One-off: grant a test pack into a user's "Jouw Packs" inventory.
 * Run: node scripts/grant-test-pack.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf-8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, username")
    .ilike("username", "%tom%");

  if (error) {
    console.error("Profile lookup error:", error.message);
    return;
  }

  console.log("Matching profiles:", profiles);

  const tom = profiles.find((p) =>
    p.username.toLowerCase().includes("canada")
  ) ?? profiles[0];

  if (!tom) {
    console.error("No matching profile found for 'tom'/'canada'");
    return;
  }

  console.log("Granting pack to:", tom);

  const { data, error: insertError } = await supabase
    .from("user_pack_inventory")
    .insert({
      user_id: tom.id,
      pack_id: "daily_coins",
      source: "manual_test",
    })
    .select();

  if (insertError) {
    console.error("Insert error:", insertError.message);
    return;
  }

  console.log("Inserted:", data);
}

run();
