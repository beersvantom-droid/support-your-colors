/**
 * POST /api/sync-scores
 * Protected cron endpoint — call this every ~2 minutes from an external scheduler.
 *
 * Recommended schedulers (all free):
 *   • cron-job.org — set to every 2 min, POST with header x-cron-secret
 *   • GitHub Actions scheduled workflow
 *   • Vercel Cron Jobs (if on Pro plan — free tier supports daily only)
 *
 * Security: requests without the correct x-cron-secret header are rejected.
 *
 * Environment variables required (add to Vercel / .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL      — already set
 *   SUPABASE_SERVICE_ROLE_KEY     — Supabase project settings → API → service_role key
 *   CRON_SECRET                   — any random string you choose (keep it secret)
 */

import { NextRequest, NextResponse } from "next/server";
import { runScoreSync } from "@/lib/score-sync";

export const runtime    = "nodejs";
export const maxDuration = 30; // seconds — fits Vercel hobby plan limit

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runScoreSync();
    console.log("[sync-scores]", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[sync-scores] fatal:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

// Also accept GET so you can test from a browser tab:
// https://your-app.vercel.app/api/sync-scores?secret=YOUR_CRON_SECRET
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runScoreSync();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

function isAuthorized(req: NextRequest): boolean {
  const secret = req.headers.get("x-cron-secret");
  return !!process.env.CRON_SECRET && secret === process.env.CRON_SECRET;
}
