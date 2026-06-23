import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getActiveChallenge, ACTION_POINTS } from "@/lib/challenges";

export const runtime = "nodejs";

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

async function getAuthUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data } = await supabase.auth.getUser();
  return data.user;
}

async function calculatePerUserPoints(
  db: ReturnType<typeof adminClient>,
  start: string,
  end: string
): Promise<Map<string, number>> {
  const userPoints = new Map<string, number>();

  const addPoints = (userId: string, pts: number) => {
    userPoints.set(userId, (userPoints.get(userId) ?? 0) + pts);
  };

  // Get username→user_id mapping
  const { data: profiles } = await db.from("profiles").select("id, username");
  const usernameToId = new Map<string, string>();
  for (const p of profiles ?? []) usernameToId.set(p.username, p.id);

  // Posts (by username)
  const { data: posts } = await db
    .from("posts")
    .select("username")
    .gte("created_at", start)
    .lte("created_at", end);
  for (const p of posts ?? []) {
    const uid = usernameToId.get(p.username);
    if (uid) addPoints(uid, ACTION_POINTS.post);
  }

  // Comments (by username, exclude bots)
  const { data: comments } = await db
    .from("comments")
    .select("username")
    .gte("created_at", start)
    .lte("created_at", end);
  for (const c of comments ?? []) {
    if (BOT_USERNAMES.includes(c.username)) continue;
    const uid = usernameToId.get(c.username);
    if (uid) addPoints(uid, ACTION_POINTS.comment);
  }

  // Reactions (by user_id)
  const { data: reactions } = await db
    .from("post_reactions")
    .select("user_id")
    .gte("created_at", start)
    .lte("created_at", end);
  for (const r of reactions ?? []) addPoints(r.user_id, ACTION_POINTS.reaction);

  // Predictions (by user_id)
  const { data: preds } = await db
    .from("match_predictions")
    .select("user_id")
    .gte("created_at", start)
    .lte("created_at", end);
  for (const p of preds ?? []) addPoints(p.user_id, ACTION_POINTS.prediction);

  // Chat (by user_id)
  const { data: chats } = await db
    .from("live_chat_messages")
    .select("user_id")
    .gte("created_at", start)
    .lte("created_at", end);
  for (const c of chats ?? []) addPoints(c.user_id, ACTION_POINTS.chat_message);

  // Votes (by voter_id)
  const { data: votes } = await db
    .from("daily_votes")
    .select("voter_id")
    .gte("created_at", start)
    .lte("created_at", end);
  for (const v of votes ?? []) addPoints(v.voter_id, ACTION_POINTS.vote);

  return userPoints;
}

async function getOrCreateSnapshot(
  db: ReturnType<typeof adminClient>,
  challenge: NonNullable<ReturnType<typeof getActiveChallenge>>
): Promise<{ user_id: string; points: number; rank: number }[]> {
  const snapshotPath = `${challenge.id}_snapshot.json`;

  // Try to read existing snapshot
  const { data: existing } = await db.storage
    .from("challenge-data")
    .download(snapshotPath);

  if (existing) {
    const text = await existing.text();
    const parsed = JSON.parse(text);
    return parsed.rankings;
  }

  // Create snapshot
  const start = challenge.startDate + "T00:00:00+02:00";
  const end = challenge.endDate + "T23:59:59+02:00";
  const userPoints = await calculatePerUserPoints(db, start, end);

  const rankings = [...userPoints.entries()]
    .map(([user_id, points]) => ({ user_id, points, rank: 0 }))
    .sort((a, b) => b.points - a.points);

  rankings.forEach((r, i) => { r.rank = i + 1; });

  const snapshot = { rankings, snapshot_at: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(snapshot)], { type: "application/json" });

  await db.storage
    .from("challenge-data")
    .upload(snapshotPath, blob, { contentType: "application/json", upsert: false });

  return rankings;
}

export async function POST() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const challenge = getActiveChallenge();
  if (!challenge) {
    return NextResponse.json({ error: "No active challenge" }, { status: 400 });
  }

  const db = adminClient();

  // Check if already claimed
  const { data: existingClaim } = await db
    .from("user_cosmetics")
    .select("id")
    .eq("user_id", user.id)
    .eq("cosmetic_id", `challenge_${challenge.id}_claimed`)
    .maybeSingle();

  if (existingClaim) {
    return NextResponse.json({ error: "Already claimed", alreadyClaimed: true }, { status: 400 });
  }

  // Check if challenge is at 100%
  const start = challenge.startDate + "T00:00:00+02:00";
  const end = challenge.endDate + "T23:59:59+02:00";

  const [posts, reactions, predictions, chatMessages, votes] = await Promise.all([
    db.from("posts").select("id", { count: "exact", head: true }).gte("created_at", start).lte("created_at", end),
    db.from("post_reactions").select("id", { count: "exact", head: true }).gte("created_at", start).lte("created_at", end),
    db.from("match_predictions").select("id", { count: "exact", head: true }).gte("created_at", start).lte("created_at", end),
    db.from("live_chat_messages").select("id", { count: "exact", head: true }).gte("created_at", start).lte("created_at", end),
    db.from("daily_votes").select("id", { count: "exact", head: true }).gte("created_at", start).lte("created_at", end),
  ]);

  const { data: commentRows } = await db
    .from("comments")
    .select("username")
    .gte("created_at", start)
    .lte("created_at", end);
  const realCommentCount = (commentRows ?? []).filter(c => !BOT_USERNAMES.includes(c.username)).length;

  const totalPoints =
    (posts.count ?? 0) * ACTION_POINTS.post +
    realCommentCount * ACTION_POINTS.comment +
    (reactions.count ?? 0) * ACTION_POINTS.reaction +
    (predictions.count ?? 0) * ACTION_POINTS.prediction +
    (chatMessages.count ?? 0) * ACTION_POINTS.chat_message +
    (votes.count ?? 0) * ACTION_POINTS.vote;

  const percentage = Math.round((totalPoints / challenge.targetPoints) * 100);
  if (percentage < 100) {
    return NextResponse.json({ error: "Challenge not yet complete", percentage }, { status: 400 });
  }

  // Get or create snapshot (freezes rankings at first 100%)
  const rankings = await getOrCreateSnapshot(db, challenge);
  const userRank = rankings.find(r => r.user_id === user.id);
  const rank = userRank?.rank ?? rankings.length + 1;

  // Determine reward
  let rewardType: "mascot" | "coins";
  let rewardValue: string;
  let coinsAmount = 0;

  if (rank <= 3) {
    rewardType = "mascot";
    rewardValue = challenge.rewards.top3.mascotId;
    // Give mascot
    await db.from("user_cosmetics").insert({
      user_id: user.id,
      cosmetic_id: challenge.rewards.top3.mascotId,
    });
  } else if (rank <= 6) {
    rewardType = "coins";
    coinsAmount = challenge.rewards.rank4to6.amount;
    rewardValue = String(coinsAmount);
  } else {
    rewardType = "coins";
    coinsAmount = challenge.rewards.rest.amount;
    rewardValue = String(coinsAmount);
  }

  // Award coins if applicable
  if (rewardType === "coins" && coinsAmount > 0) {
    const { data: existing } = await db
      .from("user_coins")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await db
        .from("user_coins")
        .update({ balance: existing.balance + coinsAmount })
        .eq("user_id", user.id);
    } else {
      await db.from("user_coins").insert({ user_id: user.id, balance: coinsAmount });
    }
  }

  // Mark as claimed
  await db.from("user_cosmetics").insert({
    user_id: user.id,
    cosmetic_id: `challenge_${challenge.id}_claimed`,
  });

  return NextResponse.json({
    success: true,
    rewardType,
    rewardValue,
    coinsAmount,
    rank,
    mascotId: rewardType === "mascot" ? challenge.rewards.top3.mascotId : null,
    mascotLabel: rewardType === "mascot" ? challenge.mascotLabel : null,
    mascotEmoji: rewardType === "mascot" ? challenge.mascotEmoji : null,
  });
}
