import { supabase } from "@/lib/supabase";
import { generateCommentary } from "@/lib/commentators";
import type { CommentatorId } from "@/lib/commentators";
import { TEAMS } from "@/lib/wc2026-data";

// Minimum time between auto-generated commentary posts (15 minutes)
const MIN_INTERVAL_MS = 15 * 60 * 1000;

export interface CommentaryTriggerOptions {
  triggeredBy: "post" | "vote" | "comment";
  country?: string;
  recentCountryPostCount?: number;
}

export async function maybeFireCommentary(
  opts: CommentaryTriggerOptions
): Promise<void> {
  // Probabilistic gate — not every action fires commentary
  const chance =
    opts.triggeredBy === "post"
      ? 0.65
      : opts.triggeredBy === "vote"
      ? 0.45
      : 0.25;

  if (Math.random() > chance) return;

  // Check minimum interval to avoid flooding the feed
  const { data: last } = await supabase
    .from("commentator_posts")
    .select("created_at, commentator_id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (last) {
    const ageMs = Date.now() - new Date(last.created_at).getTime();
    if (ageMs < MIN_INTERVAL_MS) return;
  }

  const teamInfo = opts.country ? TEAMS[opts.country] : null;
  const hour = new Date().getHours();

  const { commentatorId, message } = generateCommentary({
    triggeredBy: opts.triggeredBy,
    country: opts.country,
    flag: teamInfo?.flag,
    count: opts.recentCountryPostCount,
    isNight: hour >= 23 || hour <= 4,
    isHighActivity: (opts.recentCountryPostCount ?? 0) >= 2,
    lastCommentatorId: last?.commentator_id as CommentatorId | undefined,
  });

  await supabase.from("commentator_posts").insert({
    commentator_id: commentatorId,
    message,
    triggered_by: opts.triggeredBy,
  });
}
