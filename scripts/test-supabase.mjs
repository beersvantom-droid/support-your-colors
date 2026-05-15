/**
 * Run: node scripts/test-supabase.mjs
 * Tests Supabase connection, posts table, and storage bucket.
 */
import { createClient } from "@supabase/supabase-js";

const url = "https://nextxdxefsfabahsxuxv.supabase.co";
const key =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5leHR4ZHhlZnNmYWJhaHN4dXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1ODAxOTAsImV4cCI6MjA5NDE1NjE5MH0._xRvGwazfs7DeRuUgxT5t3goiECMwCCzSRJYFnOvoHU";

const supabase = createClient(url, key);

async function run() {
  console.log("=== Supabase connection test ===\n");

  // 1. Check posts table
  console.log("1. Reading posts table...");
  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("*")
    .limit(3);

  if (postsError) {
    console.error("   FAIL:", postsError.message, `(code: ${postsError.code})`);
    if (postsError.code === "42P01") {
      console.error("   → Table 'posts' does not exist. Run the SQL setup in Supabase.");
    } else if (postsError.code === "PGRST301") {
      console.error("   → RLS is blocking SELECT. Add a SELECT policy for anon on posts.");
    }
  } else {
    console.log(`   OK — ${posts.length} post(s) found`);
  }

  // 2. Check storage bucket
  console.log("\n2. Listing storage buckets...");
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

  if (bucketsError) {
    console.error("   FAIL:", bucketsError.message);
  } else {
    const names = buckets.map((b) => b.name);
    console.log("   Buckets found:", names.join(", ") || "(none)");
    if (!names.includes("posts-images")) {
      console.error("   → Bucket 'posts-images' is MISSING. Create it in Supabase Storage dashboard.");
    } else {
      const bucket = buckets.find((b) => b.name === "posts-images");
      console.log(`   'post-images' is ${bucket.public ? "PUBLIC ✓" : "PRIVATE ✗ — must be public!"}`);
    }
  }

  // 3. Try inserting a test post
  console.log("\n3. Testing posts INSERT...");
  const { error: insertError } = await supabase.from("posts").insert({
    username: "Test User",
    country: "Canada",
    caption: "Connection test — safe to delete",
    image_url: null,
  });

  if (insertError) {
    console.error("   FAIL:", insertError.message, `(code: ${insertError.code})`);
    if (insertError.code === "42501") {
      console.error("   → RLS is blocking INSERT. Add an INSERT policy for anon on posts.");
    }
  } else {
    console.log("   OK — test post inserted");
    // Clean it up
    await supabase.from("posts").delete().eq("username", "Test User").eq("caption", "Connection test — safe to delete");
    console.log("   OK — test post cleaned up");
  }

  console.log("\n=== Done ===");
}

run().catch(console.error);
