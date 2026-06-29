import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getActiveChallenge, ACTION_POINTS, type ChallengeReward } from "@/lib/challenges";

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

async function calculateTotalPoints(
  db: ReturnType<typeof adminClient>,
  challenge: NonNullable<ReturnType<typeof getActiveChallenge>>
): Promise<number> {
  const start = challenge.startDate + "T00:00:00+02:00";
  const end = challenge.endDate + "T23:59:59+02:00";

  if (challenge.mode === "mystery" && challenge.multipliers) {
    const { data: profiles } = await db.from("profiles").select("id, username");
    const idToUsername = new Map((profiles ?? []).map((p: { id: string; username: string }) => [p.id, p.username]));
    const mults = challenge.multipliers;

    const [posts, commentRows, reactions, predictions, chats, votes] = await Promise.all([
      db.from("posts").select("username").gte("created_at", start).lte("created_at", end),
      db.from("comments").select("username").gte("created_at", start).lte("created_at", end),
      db.from("post_reactions").select("user_id").gte("created_at", start).lte("created_at", end),
      db.from("match_predictions").select("user_id").gte("created_at", start).lte("created_at", end),
      db.from("live_chat_messages").select("user_id").gte("created_at", start).lte("created_at", end),
      db.from("daily_votes").select("voter_id").gte("created_at", start).lte("created_at", end),
    ]);

    let total = 0;
    for (const p of posts.data ?? []) total += ACTION_POINTS.post * (mults[p.username] ?? 1);
    for (const c of commentRows.data ?? []) {
      if (BOT_USERNAMES.includes(c.username)) continue;
      total += ACTION_POINTS.comment * (mults[c.username] ?? 1);
    }
    for (const r of reactions.data ?? []) total += ACTION_POINTS.reaction * (mults[idToUsername.get(r.user_id) ?? ""] ?? 1);
    for (const p of predictions.data ?? []) total += ACTION_POINTS.prediction * (mults[idToUsername.get(p.user_id) ?? ""] ?? 1);
    for (const c of chats.data ?? []) total += ACTION_POINTS.chat_message * (mults[idToUsername.get(c.user_id) ?? ""] ?? 1);
    for (const v of votes.data ?? []) total += ACTION_POINTS.vote * (mults[idToUsername.get(v.voter_id) ?? ""] ?? 1);
    return total;
  }

  // Standard mode
  const [posts, reactions, predictions, chatMessages, votes] = await Promise.all([
    db.from("posts").select("id", { count: "exact", head: true }).gte("created_at", start).lte("created_at", end),
    db.from("post_reactions").select("id", { count: "exact", head: true }).gte("created_at", start).lte("created_at", end),
    db.from("match_predictions").select("id", { count: "exact", head: true }).gte("created_at", start).lte("created_at", end),
    db.from("live_chat_messages").select("id", { count: "exact", head: true }).gte("created_at", start).lte("created_at", end),
    db.from("daily_votes").select("id", { count: "exact", head: true }).gte("created_at", start).lte("created_at", end),
  ]);
  const { data: commentRows } = await db.from("comments").select("username").gte("created_at", start).lte("created_at", end);
  const realCommentCount = (commentRows ?? []).filter(c => !BOT_USERNAMES.includes(c.username)).length;

  return (posts.count ?? 0) * ACTION_POINTS.post +
    realCommentCount * ACTION_POINTS.comment +
    (reactions.count ?? 0) * ACTION_POINTS.reaction +
    (predictions.count ?? 0) * ACTION_POINTS.prediction +
    (chatMessages.count ?? 0) * ACTION_POINTS.chat_message +
    (votes.count ?? 0) * ACTION_POINTS.vote;
}

async function getOrCreateRewardAssignment(
  db: ReturnType<typeof adminClient>,
  challengeId: string,
  rewards: ChallengeReward[]
): Promise<Map<number, string>> {
  const snapshotPath = `${challengeId}_rewards.json`;

  const { data: existing } = await db.storage
    .from("challenge-data")
    .download(snapshotPath);

  if (existing) {
    const text = await existing.text();
    const parsed = JSON.parse(text);
    return new Map(Object.entries(parsed.assignments).map(([k, v]) => [Number(k), v as string]));
  }

  // Get all users
  const { data: profiles } = await db.from("profiles").select("id");
  const userIds = (profiles ?? []).map((p: { id: string }) => p.id);

  // Shuffle users randomly
  const shuffled = [...userIds].sort(() => Math.random() - 0.5);

  // Assign rewards: first N users get special rewards, rest get coins
  const assignments: Record<number, string> = {};
  for (let i = 0; i < rewards.length && i < shuffled.length; i++) {
    assignments[i] = shuffled[i];
  }

  const snapshot = { assignments, created_at: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(snapshot)], { type: "application/json" });
  await db.storage
    .from("challenge-data")
    .upload(snapshotPath, blob, { contentType: "application/json", upsert: false });

  return new Map(Object.entries(assignments).map(([k, v]) => [Number(k), v]));
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
  const totalPoints = await calculateTotalPoints(db, challenge);
  const percentage = Math.round((totalPoints / challenge.targetPoints) * 100);
  if (percentage < 100) {
    return NextResponse.json({ error: "Challenge not yet complete", percentage }, { status: 400 });
  }

  // Get or create random reward assignment
  const assignments = await getOrCreateRewardAssignment(db, challenge.id, challenge.rewards);

  // Find this user's reward
  let userReward: ChallengeReward | null = null;
  for (const [rewardIndex, assignedUserId] of assignments) {
    if (assignedUserId === user.id) {
      userReward = challenge.rewards[rewardIndex];
      break;
    }
  }

  // If not assigned a special reward, give fallback (coins)
  if (!userReward) {
    userReward = {
      type: "coins",
      amount: challenge.fallbackReward.amount,
      label: `${challenge.fallbackReward.amount} Munten`,
      emoji: "🪙",
    };
  }

  // Award the reward
  if (userReward.type === "coins") {
    const coinsAmount = userReward.amount ?? 0;
    const { data: existing } = await db
      .from("user_coins")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await db.from("user_coins").update({ balance: existing.balance + coinsAmount }).eq("user_id", user.id);
    } else {
      await db.from("user_coins").insert({ user_id: user.id, balance: coinsAmount });
    }
  } else if (userReward.cosmeticId) {
    await db.from("user_cosmetics").insert({
      user_id: user.id,
      cosmetic_id: userReward.cosmeticId,
    });
  }

  // Mark as claimed
  await db.from("user_cosmetics").insert({
    user_id: user.id,
    cosmetic_id: `challenge_${challenge.id}_claimed`,
  });

  return NextResponse.json({
    success: true,
    rewardType: userReward.type,
    rewardValue: userReward.cosmeticId ?? String(userReward.amount ?? 0),
    coinsAmount: userReward.type === "coins" ? (userReward.amount ?? 0) : 0,
    mascotId: userReward.type === "mascot" ? userReward.cosmeticId : null,
    mascotLabel: userReward.label,
    mascotEmoji: userReward.emoji,
  });
}
