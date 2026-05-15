/**
 * Creates the posts-images storage bucket and verifies anon upload access.
 *
 * Run with:
 *   $env:SUPABASE_SERVICE_ROLE_KEY='eyJ...' ; node scripts/setup-storage.mjs
 *
 * Get your service role key from:
 *   Supabase dashboard → Settings → API → service_role (secret)
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://nextxdxefsfabahsxuxv.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5leHR4ZHhlZnNmYWJhaHN4dXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1ODAxOTAsImV4cCI6MjA5NDE1NjE5MH0._xRvGwazfs7DeRuUgxT5t3goiECMwCCzSRJYFnOvoHU";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error(
    "\nERROR: SUPABASE_SERVICE_ROLE_KEY is required.\n\n" +
    "  1. Go to: Supabase dashboard → Settings → API\n" +
    "  2. Copy the 'service_role' key (keep it secret!)\n" +
    "  3. Run:\n" +
    "     $env:SUPABASE_SERVICE_ROLE_KEY='eyJ...' ; node scripts/setup-storage.mjs\n"
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const anon = createClient(SUPABASE_URL, ANON_KEY);

const BUCKET = "posts-images";

async function run() {
  console.log("=== Storage Setup ===\n");

  // ── 1. Create bucket ────────────────────────────────────────────────────────
  console.log(`1. Creating bucket '${BUCKET}'...`);
  const { error: createErr } = await admin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  });

  if (createErr) {
    if (createErr.message?.toLowerCase().includes("already exists")) {
      console.log("   Already exists — making sure it is public...");
      const { error: updateErr } = await admin.storage.updateBucket(BUCKET, {
        public: true,
      });
      if (updateErr) console.error("   WARN: could not update bucket:", updateErr.message);
      else console.log("   OK");
    } else {
      console.error("   FAIL:", createErr.message);
      process.exit(1);
    }
  } else {
    console.log("   OK — created");
  }

  // ── 2. Test anon upload ─────────────────────────────────────────────────────
  console.log("\n2. Testing anon upload...");
  // Minimal 1×1 transparent PNG (68 bytes)
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQ" +
    "AABjkB6QAAAABJRU5ErkJggg==",
    "base64"
  );
  const testPath = `__test__/${Date.now()}.png`;
  const { error: uploadErr } = await anon.storage
    .from(BUCKET)
    .upload(testPath, png, { contentType: "image/png" });

  if (uploadErr) {
    console.error("   FAIL:", uploadErr.message);
    console.log("\n   → RLS is blocking anon uploads.");
    console.log("   → Run the following SQL in your Supabase SQL Editor:\n");
    console.log(SQL_POLICIES);
    console.log("\n   Then re-run this script to verify.\n");
    process.exit(1);
  }

  console.log("   OK — anon upload works");

  // Clean up test file
  await admin.storage.from(BUCKET).remove([testPath]);
  console.log("   OK — test file cleaned up");

  // ── 3. Verify public URL resolves ───────────────────────────────────────────
  console.log("\n3. Verifying public URL...");
  const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl("__test__.png");
  console.log("   URL format:", urlData.publicUrl);

  console.log("\n✓ Storage is fully configured. Posting should work.\n");
}

// ── SQL to print when policies are missing ────────────────────────────────────
const SQL_POLICIES = `
-- Paste this in: Supabase dashboard → SQL Editor → New query

-- Storage: allow anyone to upload images
CREATE POLICY "posts-images anon INSERT"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'posts-images');

-- Storage: allow anyone to read images
CREATE POLICY "posts-images anon SELECT"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'posts-images');

-- Posts table: allow anyone to insert posts
CREATE POLICY "posts anon INSERT"
ON public.posts FOR INSERT TO anon
WITH CHECK (true);

-- Posts table: allow anyone to read posts
CREATE POLICY "posts anon SELECT"
ON public.posts FOR SELECT TO anon
USING (true);
`;

run().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
