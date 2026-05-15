/**
 * POST /api/process-commentary
 * Cron endpoint — call every 2 minutes from cron-job.org or GitHub Actions.
 *
 * Header required: x-cron-secret: YOUR_CRON_SECRET
 * GET also accepted for browser testing: ?secret=YOUR_CRON_SECRET
 *
 * What it does:
 * 1. Fires pending commentator reactions whose fire_at has passed
 * 2. Checks for trending posts and schedules extra reactions
 */

import { NextRequest, NextResponse } from "next/server";
import { processPendingReactions } from "@/lib/commentator-engine";

export const runtime    = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const received = req.headers.get("x-cron-secret");
  const expected = process.env.CRON_SECRET;
  const method = req.method;
  console.log("[process-commentary] auth check — method:", method, "| received:", received, "| expected:", expected ?? "(undefined)");
  if (received !== expected) {
    return NextResponse.json({
      error: "Unauthorized",
      received,
      expected: expected ?? null,
      expectedDefined: expected !== undefined,
      method,
    }, { status: 401 });
  }
  return run();
}

export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const fromHeader = req.headers.get("x-cron-secret");
  const fromQuery  = req.nextUrl.searchParams.get("secret");
  if (fromHeader !== expected && fromQuery !== expected) {
    return NextResponse.json({
      error: "Unauthorized",
      receivedHeader: fromHeader,
      receivedQuery: fromQuery,
      receivedQueryLen: fromQuery?.length ?? null,
      expectedLen: expected?.length ?? null,
      expectedTrimmed: expected?.trim() === expected,
      expectedLast3: expected ? expected.slice(-3) : null,
    }, { status: 401 });
  }
  return run();
}

async function run() {
  try {
    const result = await processPendingReactions();
    console.log("[process-commentary]", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[process-commentary] fatal:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
