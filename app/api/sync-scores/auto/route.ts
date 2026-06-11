/**
 * GET /api/sync-scores/auto
 *
 * Lightweight, unauthenticated sync trigger meant to be called from the
 * client (e.g. every ~45s while the app is open) so live scores and
 * standings update automatically without any external cron setup.
 *
 * Rate-limited to once per 30 seconds across all callers to avoid
 * hammering TheSportsDB / Supabase.
 */

import { NextResponse } from "next/server";
import { runScoreSync } from "@/lib/score-sync";

export const runtime = "nodejs";
export const maxDuration = 30;

const MIN_INTERVAL_MS = 30_000;
let lastRun = 0;
let lastResult: unknown = { ok: true, skipped: true };

export async function GET() {
  const now = Date.now();

  if (now - lastRun < MIN_INTERVAL_MS) {
    return NextResponse.json(lastResult);
  }

  lastRun = now;

  try {
    const result = await runScoreSync();
    lastResult = { ok: true, ...result };
    return NextResponse.json(lastResult);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[sync-scores/auto] fatal:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
