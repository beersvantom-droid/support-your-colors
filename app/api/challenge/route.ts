import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getActiveChallenge, ACTION_POINTS } from "@/lib/challenges";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOT_USERNAMES = [
  "Jeroen Bijma", "Sierd de Vos", "Fabrizio Romano",
  "Udo de beatboxer", "Jannes", "Jan Boskampinho", "Ron Dans",
  "DJ Derksen", "Ome corpinho", "أبو حرب", "Kung Fugway",
  "Moffel", "Henk", "Huub Bosch", "Bram Stensen", "Hank Thunderman",
];

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

  let claimed = false;
  try {
    const cookieStore = await cookies();
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await authClient.auth.getUser();
    if (user) {
      const { data: claimRow } = await db
        .from("user_cosmetics")
        .select("id")
        .eq("user_id", user.id)
        .eq("cosmetic_id", `challenge_${challenge.id}_claimed`)
        .maybeSingle();
      claimed = !!claimRow;
    }
  } catch { /* ignore */ }

  if (challenge.mode === "mystery" && challenge.multipliers) {
    // Mystery mode: calculate weighted points per user
    const { data: profiles } = await db.from("profiles").select("id, username");
    const usernameToMult = challenge.multipliers;

    const { data: posts } = await db.from("posts").select("username").gte("created_at", start).lte("created_at", end);
    const { data: commentRows } = await db.from("comments").select("username").gte("created_at", start).lte("created_at", end);
    const { data: reactions } = await db.from("post_reactions").select("user_id").gte("created_at", start).lte("created_at", end);
    const { data: predictions } = await db.from("match_predictions").select("user_id").gte("created_at", start).lte("created_at", end);
    const { data: chats } = await db.from("live_chat_messages").select("user_id").gte("created_at", start).lte("created_at", end);
    const { data: votes } = await db.from("daily_votes").select("voter_id").gte("created_at", start).lte("created_at", end);

    const idToUsername = new Map((profiles ?? []).map((p: { id: string; username: string }) => [p.id, p.username]));

    let totalPoints = 0;

    for (const p of posts ?? []) {
      const mult = usernameToMult[p.username] ?? 1;
      totalPoints += ACTION_POINTS.post * mult;
    }
    for (const c of commentRows ?? []) {
      if (BOT_USERNAMES.includes(c.username)) continue;
      const mult = usernameToMult[c.username] ?? 1;
      totalPoints += ACTION_POINTS.comment * mult;
    }
    for (const r of reactions ?? []) {
      const name = idToUsername.get(r.user_id) ?? "";
      totalPoints += ACTION_POINTS.reaction * (usernameToMult[name] ?? 1);
    }
    for (const p of predictions ?? []) {
      const name = idToUsername.get(p.user_id) ?? "";
      totalPoints += ACTION_POINTS.prediction * (usernameToMult[name] ?? 1);
    }
    for (const c of chats ?? []) {
      const name = idToUsername.get(c.user_id) ?? "";
      totalPoints += ACTION_POINTS.chat_message * (usernameToMult[name] ?? 1);
    }
    for (const v of votes ?? []) {
      const name = idToUsername.get(v.voter_id) ?? "";
      totalPoints += ACTION_POINTS.vote * (usernameToMult[name] ?? 1);
    }

    const percentage = Math.min(100, Math.round((totalPoints / challenge.targetPoints) * 100));

    return NextResponse.json({
      active: true,
      id: challenge.id,
      mascotLabel: challenge.mascotLabel,
      mascotEmoji: challenge.mascotEmoji,
      mascotImage: challenge.mascotImage,
      packImage: challenge.packImage,
      targetPoints: challenge.targetPoints,
      percentage,
      endDate: challenge.endDate,
      claimed,
      mode: challenge.mode,
    });
  }

  // Standard community mode
  const [posts, reactions, predictions, chatMessages, votes] = await Promise.all([
    db.from("posts").select("id", { count: "exact", head: true }).gte("created_at", start).lte("created_at", end),
    db.from("post_reactions").select("id", { count: "exact", head: true }).gte("created_at", start).lte("created_at", end),
    db.from("match_predictions").select("id", { count: "exact", head: true }).gte("created_at", start).lte("created_at", end),
    db.from("live_chat_messages").select("id", { count: "exact", head: true }).gte("created_at", start).lte("created_at", end),
    db.from("daily_votes").select("id", { count: "exact", head: true }).gte("created_at", start).lte("created_at", end),
  ]);

  const { data: commentRows } = await db.from("comments").select("username").gte("created_at", start).lte("created_at", end);
  const realCommentCount = (commentRows ?? []).filter((c) => !BOT_USERNAMES.includes(c.username)).length;

  const totalPoints =
    (posts.count ?? 0) * ACTION_POINTS.post +
    realCommentCount * ACTION_POINTS.comment +
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
    packImage: challenge.packImage,
    targetPoints: challenge.targetPoints,
    percentage,
    endDate: challenge.endDate,
    claimed,
    mode: challenge.mode,
  });
}
