import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MATCH_ID = "nlma_20260630";

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function GET() {
  const cookieStore = await cookies();
  const userClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = adminClient();

  // Check user's bet
  const { data: bets } = await admin
    .from("user_cosmetics")
    .select("cosmetic_id")
    .eq("user_id", user.id)
    .like("cosmetic_id", `bet_${MATCH_ID}_%`);

  let userBet: { team: string; amount: number } | null = null;
  if (bets && bets.length > 0) {
    const parts = bets[0].cosmetic_id.split("_");
    const amount = parseInt(parts[parts.length - 1], 10);
    const team = parts[parts.length - 2];
    userBet = { team, amount };
  }

  // Check match result
  const { data: match } = await admin
    .from("match_results")
    .select("home_team, away_team, home_score, away_score, status")
    .or("home_team.eq.Netherlands,away_team.eq.Netherlands")
    .or("home_team.eq.Morocco,away_team.eq.Morocco")
    .maybeSingle();

  let matchStatus: "upcoming" | "live" | "finished" = "upcoming";
  let winner: string | null = null;
  let homeScore: number | null = null;
  let awayScore: number | null = null;

  if (match) {
    if (match.status === "finished") {
      matchStatus = "finished";
      homeScore = match.home_score;
      awayScore = match.away_score;
      if (match.home_score > match.away_score) winner = match.home_team;
      else if (match.away_score > match.home_score) winner = match.away_team;
      else winner = "draw";
    } else if (match.status === "live") {
      matchStatus = "live";
      homeScore = match.home_score;
      awayScore = match.away_score;
    }
  }

  // Check if payout already done
  const { data: payout } = await admin
    .from("user_cosmetics")
    .select("id")
    .eq("user_id", user.id)
    .eq("cosmetic_id", `bet_${MATCH_ID}_payout`)
    .maybeSingle();

  // Auto-payout if match finished and user bet and not yet paid out
  let wonAmount = 0;
  if (matchStatus === "finished" && userBet && !payout) {
    if (winner === userBet.team) {
      wonAmount = userBet.amount * 2;
      const { data: coins } = await admin.from("user_coins").select("balance").eq("user_id", user.id).maybeSingle();
      await admin.from("user_coins").update({ balance: (coins?.balance ?? 0) + wonAmount }).eq("user_id", user.id);
    }
    // Mark payout done
    await admin.from("user_cosmetics").insert({ user_id: user.id, cosmetic_id: `bet_${MATCH_ID}_payout` });
  }

  return NextResponse.json({
    userBet,
    matchStatus,
    homeScore,
    awayScore,
    winner,
    paidOut: !!payout || (matchStatus === "finished" && userBet !== null),
    wonAmount,
  });
}
