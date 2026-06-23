import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getActiveChallenge, ACTION_POINTS } from "@/lib/challenges";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  const challenge = getActiveChallenge();
  if (!challenge) {
    return NextResponse.json({ active: false });
  }

  const db = adminClient();
  const start = challenge.startDate + "T00:00:00+02:00";
  const end = challenge.endDate + "T23:59:59+02:00";

  const [posts, comments, reactions, predictions, chatMessages, votes] =
    await Promise.all([
      db
        .from("posts")
        .select("id", { count: "exact", head: true })
        .gte("created_at", start)
        .lte("created_at", end),
      db
        .from("comments")
        .select("id", { count: "exact", head: true })
        .gte("created_at", start)
        .lte("created_at", end),
      db
        .from("post_reactions")
        .select("id", { count: "exact", head: true })
        .gte("created_at", start)
        .lte("created_at", end),
      db
        .from("match_predictions")
        .select("id", { count: "exact", head: true })
        .gte("created_at", start)
        .lte("created_at", end),
      db
        .from("live_chat_messages")
        .select("id", { count: "exact", head: true })
        .gte("created_at", start)
        .lte("created_at", end),
      db
        .from("daily_votes")
        .select("id", { count: "exact", head: true })
        .gte("created_at", start)
        .lte("created_at", end),
    ]);

  const totalPoints =
    (posts.count ?? 0) * ACTION_POINTS.post +
    (comments.count ?? 0) * ACTION_POINTS.comment +
    (reactions.count ?? 0) * ACTION_POINTS.reaction +
    (predictions.count ?? 0) * ACTION_POINTS.prediction +
    (chatMessages.count ?? 0) * ACTION_POINTS.chat_message +
    (votes.count ?? 0) * ACTION_POINTS.vote;

  const percentage = Math.min(100, Math.round((totalPoints / challenge.targetPoints) * 100));

  return NextResponse.json({
    active: true,
    id: challenge.id,
    mascotLabel: challenge.mascotLabel,
    mascotEmoji: challenge.mascotEmoji,
    mascotImage: challenge.mascotImage,
    targetPoints: challenge.targetPoints,
    percentage,
    endDate: challenge.endDate,
  });
}
