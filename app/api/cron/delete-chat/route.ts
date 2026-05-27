/**
 * POST /api/cron/delete-chat
 * Deletes all live_chat_messages — runs daily at 07:00 UTC.
 *
 * Call this from cron-job.org or GitHub Actions:
 *   POST https://your-app.vercel.app/api/cron/delete-chat
 *   Header: x-cron-secret: YOUR_CRON_SECRET
 *
 * Same secret as /api/sync-scores (reuses CRON_SECRET env var).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function isAuthorized(req: NextRequest): boolean {
  const secret = req.headers.get("x-cron-secret");
  return !!process.env.CRON_SECRET && secret === process.env.CRON_SECRET;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = makeServiceClient();

    // Delete ALL messages (daily reset at 07:00 UTC)
    const { error, count } = await db
      .from("live_chat_messages")
      .delete({ count: "exact" })
      .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all rows trick

    if (error) {
      console.error("[cron/delete-chat] error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    console.log(`[cron/delete-chat] Deleted ${count ?? 0} chat messages`);
    return NextResponse.json({ ok: true, deleted: count ?? 0 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[cron/delete-chat] fatal:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

// GET for easy browser testing
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = makeServiceClient();
    const { error, count } = await db
      .from("live_chat_messages")
      .delete({ count: "exact" })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) throw error;

    return NextResponse.json({ ok: true, deleted: count ?? 0 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
