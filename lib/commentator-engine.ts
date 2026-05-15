/**
 * commentator-engine.ts
 *
 * Two entry points:
 *
 * 1. scheduleCommentatorReactions(postId, caption, country, flag)
 *    Called from create-post immediately after a post is inserted.
 *    Rolls dice per commentator, inserts pending reaction rows with
 *    individual fire_at timestamps. Uses the browser Supabase client.
 *
 * 2. processPendingReactions()
 *    Called by POST /api/process-commentary (cron, every 2 min).
 *    Fires due reactions, checks trending posts, uses admin client.
 *
 * 3. maybeFireCommentary(opts) — kept for vote triggers only.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { scheduleFanReactions, processPendingFanReactions } from "@/lib/fan-personas";
import {
  COMMENTATORS,
  generateCommentary,
  generateCommentatorComment,
  detectTone,
  pickCommentator,
  type CommentatorId,
  type ToneCategory,
} from "@/lib/commentators";
import { GROUPS, SUPPORTERS, TEAMS } from "@/lib/wc2026-data";

// ─── Per-commentator config ───────────────────────────────────────────────────

const COOLDOWN_MS: Record<CommentatorId, number> = {
  jeroen:   5  * 60 * 1000,
  fabrizio: 12 * 60 * 1000,
  sierd:    20 * 60 * 1000,
};

// Delay window: commentator reacts within [minMs, maxMs] after the post
const DELAY_WINDOW_MS: Record<CommentatorId, [number, number]> = {
  jeroen:   [10_000,        5  * 60 * 1000],   // 10 sec – 5 min
  fabrizio: [60_000,        10 * 60 * 1000],   // 1 min – 10 min
  sierd:    [3  * 60 * 1000, 20 * 60 * 1000],  // 3 min – 20 min
};

// Reaction chances per commentator per context
// [commentChance, standaloneChance]
const CHANCES: Record<CommentatorId, {
  normal:   [number, number];
  trending: number;        // combined, then weighted toward comment
  derby:    number;
  night:    [number, number];
}> = {
  jeroen:   { normal: [0.35, 0.12], trending: 0.45, derby: 0.35, night: [0.40, 0.08] },
  fabrizio: { normal: [0.18, 0.08], trending: 0.30, derby: 0.28, night: [0.12, 0.06] },
  sierd:    { normal: [0.10, 0.05], trending: 0.18, derby: 0.15, night: [0.10, 0.04] },
};

// ─── Admin client ─────────────────────────────────────────────────────────────

function adminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE env vars");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isNightHour(): boolean {
  // Amsterdam time (UTC+2 in summer)
  const amsterdamHour = new Date(Date.now() + 2 * 60 * 60 * 1000).getUTCHours();
  return amsterdamHour >= 1 && amsterdamHour <= 5;
}

// Parses "Jun 12" + "3:00 PM ET" into a UTC Date (EDT = UTC-4)
const MONTH_INDEX: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

function parseFixtureDate(date: string, time: string): Date {
  const [monthStr, dayStr] = date.split(" ");
  const month = MONTH_INDEX[monthStr] ?? 5;
  const day = parseInt(dayStr, 10);
  const m = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  let h = 0, min = 0;
  if (m) {
    h = parseInt(m[1], 10);
    min = parseInt(m[2], 10);
    if (m[3].toUpperCase() === "PM" && h !== 12) h += 12;
    if (m[3].toUpperCase() === "AM" && h === 12) h = 0;
    h += 4; // EDT → UTC
  }
  return new Date(Date.UTC(2026, month, day, h, min));
}

function isDerbyWithin24h(): boolean {
  const now = Date.now();
  const limit = now + 24 * 60 * 60 * 1000;
  for (const g of GROUPS) {
    for (const f of g.fixtures) {
      if (f.status !== "upcoming") continue;
      if (!(SUPPORTERS[f.home] && SUPPORTERS[f.away])) continue;
      const t = parseFixtureDate(f.date, f.time).getTime();
      if (t > now && t <= limit) return true;
    }
  }
  return false;
}

// Check if a commentator is currently on cooldown.
// Looks at both commentator_posts (standalone) and comments (direct replies).
async function isOnCooldown(db: SupabaseClient, id: CommentatorId): Promise<boolean> {
  const name = COMMENTATORS[id].name;
  const cooldown = COOLDOWN_MS[id];

  const [postRes, commentRes] = await Promise.all([
    db.from("commentator_posts")
      .select("created_at")
      .eq("commentator_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from("comments")
      .select("created_at")
      .eq("username", name)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const postAge    = postRes.data    ? Date.now() - new Date(postRes.data.created_at).getTime()    : Infinity;
  const commentAge = commentRes.data ? Date.now() - new Date(commentRes.data.created_at).getTime() : Infinity;
  return Math.min(postAge, commentAge) < cooldown;
}

// ─── Schedule reactions when a post is created ───────────────────────────────
// Uses the browser supabase client — called client-side after post insert.

export interface ScheduleContext {
  postId:   string;
  caption?: string | null;
  country?: string | null;
}

export async function scheduleCommentatorReactions(ctx: ScheduleContext): Promise<void> {
  const tone      = detectTone(ctx.caption);
  const night     = isNightHour();
  const derby     = isDerbyWithin24h();
  const teamInfo  = ctx.country ? TEAMS[ctx.country] : null;
  const flag      = teamInfo?.flag;
  const country   = ctx.country ?? undefined;

  const ids: CommentatorId[] = ["jeroen", "fabrizio", "sierd"];
  const rows: object[] = [];

  for (const id of ids) {
    const cfg = CHANCES[id];
    const [win, delay] = DELAY_WINDOW_MS[id];

    // Determine tone override if night or derby
    const effectiveTone: ToneCategory = night ? "night_chaos" : derby ? "derby" : tone;

    // Roll comment chance
    const commentChance = night
      ? cfg.night[0]
      : derby
      ? cfg.derby * 0.7   // 70% of derby chance → comment
      : cfg.normal[0];

    if (Math.random() < commentChance) {
      rows.push({
        post_id:       ctx.postId,
        commentator_id: id,
        action_type:   "comment",
        fire_at:       new Date(Date.now() + randomInRange(win, delay)).toISOString(),
        context_json: { tone: effectiveTone, country, flag, caption: ctx.caption?.slice(0, 200) },
      });
      continue; // one action per commentator per post (comment wins over standalone)
    }

    // Roll standalone post chance
    const standaloneChance = night
      ? cfg.night[1]
      : derby
      ? cfg.derby * 0.3   // remaining 30% of derby chance → standalone
      : cfg.normal[1];

    if (Math.random() < standaloneChance) {
      rows.push({
        post_id:        ctx.postId,
        commentator_id: id,
        action_type:    "standalone_post",
        fire_at:        new Date(Date.now() + randomInRange(win, delay)).toISOString(),
        context_json:  { tone: effectiveTone, country, flag, caption: ctx.caption?.slice(0, 200) },
      });
    }
  }

  if (rows.length > 0) {
    await supabase.from("pending_commentator_reactions").insert(rows);
  }

  // Schedule fan persona reactions independently (fire-and-forget)
  scheduleFanReactions({ postId: ctx.postId, caption: ctx.caption }).catch(() => {});
}

// ─── Process due pending reactions ───────────────────────────────────────────
// Called by the cron endpoint. Uses admin client to bypass RLS.

export interface ProcessResult {
  processed: number;
  skipped:   number;
  errors:    string[];
}

export async function processPendingReactions(): Promise<ProcessResult> {
  const db = adminClient();
  const result: ProcessResult = { processed: 0, skipped: 0, errors: [] };

  // Fetch all reactions that are due
  const { data: due, error: fetchError } = await db
    .from("pending_commentator_reactions")
    .select("*")
    .lte("fire_at", new Date().toISOString())
    .eq("processed", false)
    .order("fire_at", { ascending: true })
    .limit(20);

  if (fetchError) {
    result.errors.push(`Fetch failed: ${fetchError.message}`);
    return result;
  }

  for (const row of due ?? []) {
    try {
      const id = row.commentator_id as CommentatorId;
      const ctx = row.context_json as {
        tone: ToneCategory;
        country?: string;
        flag?: string;
        caption?: string;
      };

      // Mark processed first to prevent double-firing on concurrent runs
      await db.from("pending_commentator_reactions")
        .update({ processed: true })
        .eq("id", row.id);

      // Check cooldown
      if (await isOnCooldown(db, id)) {
        result.skipped++;
        continue;
      }

      if (row.action_type === "comment") {
        const text = generateCommentatorComment(id, ctx.tone, {
          country: ctx.country,
          flag:    ctx.flag,
        });
        await db.from("comments").insert({
          post_id:      row.post_id,
          username:     COMMENTATORS[id].name,
          country:      id,              // CommentsSection detects this to show emoji
          comment_text: text,
        });
      } else {
        // standalone_post — use existing generateCommentary
        const { commentatorId, message } = generateCommentary({
          triggeredBy: "post",
          country:     ctx.country,
          flag:        ctx.flag,
          isNight:     ctx.tone === "night_chaos",
          isHighActivity: false,
        });
        await db.from("commentator_posts").insert({
          commentator_id: commentatorId,
          message,
          triggered_by:   "post",
        });
      }

      result.processed++;
    } catch (err) {
      result.errors.push(`Row ${row.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Check for trending posts and schedule extra reactions
  await checkAndScheduleTrending(db);

  // Process fan persona reactions in parallel
  const fanResult = await processPendingFanReactions();
  result.processed += fanResult.processed;
  result.skipped   += fanResult.skipped;
  result.errors.push(...fanResult.errors);

  return result;
}

// ─── Trending detection ───────────────────────────────────────────────────────
// Runs after every processing pass. Looks for posts that blew up in the last
// 20 minutes and don't yet have any commentator reaction.

async function checkAndScheduleTrending(db: SupabaseClient): Promise<void> {
  const windowStart = new Date(Date.now() - 20 * 60 * 1000).toISOString();

  const { data: recentPosts } = await db
    .from("posts")
    .select("id, country, caption")
    .gte("created_at", windowStart)
    .limit(10);

  for (const post of recentPosts ?? []) {
    try {
      // Count reactions and comments (excluding commentator comments)
      const [reactRes, commentRes] = await Promise.all([
        db.from("post_reactions")
          .select("*", { count: "exact", head: true })
          .eq("post_id", post.id),
        db.from("comments")
          .select("*", { count: "exact", head: true })
          .eq("post_id", post.id),
      ]);

      const isTrending =
        (reactRes.count ?? 0) >= 5 || (commentRes.count ?? 0) >= 5;
      if (!isTrending) continue;

      // Check if a commentator has already reacted (comment or standalone)
      const { count: alreadyReacted } = await db
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("post_id", post.id)
        .in("country", ["jeroen", "sierd", "fabrizio"]);

      const { count: pendingCount } = await db
        .from("pending_commentator_reactions")
        .select("*", { count: "exact", head: true })
        .eq("post_id", post.id);

      if ((alreadyReacted ?? 0) > 0 || (pendingCount ?? 0) > 0) continue;

      // Schedule a trending reaction (immediate-ish)
      const teamInfo = post.country ? TEAMS[post.country] : null;
      const rows: object[] = [];
      const ids: CommentatorId[] = ["jeroen", "fabrizio", "sierd"];

      for (const id of ids) {
        if (Math.random() < CHANCES[id].trending) {
          rows.push({
            post_id:        post.id,
            commentator_id: id,
            action_type:    Math.random() < 0.75 ? "comment" : "standalone_post",
            fire_at:        new Date(Date.now() + randomInRange(5_000, 90_000)).toISOString(),
            context_json:  {
              tone:    detectTone(post.caption),
              country: post.country,
              flag:    teamInfo?.flag,
              caption: post.caption?.slice(0, 200),
            },
          });

          // Double commentary: 10% chance a second commentator also reacts
          if (Math.random() < 0.10) {
            const second = pickCommentator(id);
            rows.push({
              post_id:        post.id,
              commentator_id: second,
              action_type:    "comment",
              fire_at:        new Date(Date.now() + randomInRange(30_000, 3 * 60_000)).toISOString(),
              context_json:  {
                tone:    detectTone(post.caption),
                country: post.country,
                flag:    teamInfo?.flag,
                caption: post.caption?.slice(0, 200),
              },
            });
          }

          break; // one trending reaction per trending check (unless double)
        }
      }

      if (rows.length > 0) {
        await db.from("pending_commentator_reactions").insert(rows);
      }
    } catch {
      // silent — trending check is best-effort
    }
  }
}

// ─── Vote trigger (unchanged interface) ──────────────────────────────────────
// Still creates standalone commentator posts, with per-commentator cooldowns.

export interface CommentaryTriggerOptions {
  triggeredBy: "vote";
}

export async function maybeFireCommentary(opts: CommentaryTriggerOptions): Promise<void> {
  const ids: CommentatorId[] = ["jeroen", "fabrizio", "sierd"];

  // Pick one commentator to fire (first one that passes chance + cooldown)
  for (const id of ids.sort(() => Math.random() - 0.5)) {
    const chance = CHANCES[id].normal[1]; // use standalone chance for votes
    if (Math.random() > chance) continue;

    // Check last post by this specific commentator
    const { data: last } = await supabase
      .from("commentator_posts")
      .select("created_at")
      .eq("commentator_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (last) {
      const age = Date.now() - new Date(last.created_at).getTime();
      if (age < COOLDOWN_MS[id]) continue;
    }

    const { commentatorId, message } = generateCommentary({
      triggeredBy:    "vote",
      lastCommentatorId: id,
    });

    await supabase.from("commentator_posts").insert({
      commentator_id: commentatorId,
      message,
      triggered_by:   "vote",
    });

    return; // only one commentator per vote event
  }
}
