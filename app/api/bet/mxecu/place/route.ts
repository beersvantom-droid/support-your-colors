import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const VALID_AMOUNTS = [50, 100, 200, 500];
const MATCH_ID = "mxecu_20260630";
const VALID_TEAMS = ["Mexico", "Ecuador"];

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function POST(req: NextRequest) {
  const userClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: { team?: string; amount?: number };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid" }, { status: 400 }); }

  const { team, amount } = body;
  if (!team || !VALID_TEAMS.includes(team)) return NextResponse.json({ error: "Ongeldig team" }, { status: 400 });
  if (!amount || !VALID_AMOUNTS.includes(amount)) return NextResponse.json({ error: "Ongeldige inzet" }, { status: 400 });

  const admin = adminClient();

  // Check if already bet on this match
  const { data: existingBets } = await admin
    .from("user_cosmetics")
    .select("cosmetic_id")
    .eq("user_id", user.id)
    .like("cosmetic_id", `bet_${MATCH_ID}_%`);

  if (existingBets && existingBets.length > 0) {
    return NextResponse.json({ error: "Je hebt al ingezet op deze wedstrijd" }, { status: 400 });
  }

  // Check coins
  const { data: coins } = await admin.from("user_coins").select("balance").eq("user_id", user.id).maybeSingle();
  const balance = coins?.balance ?? 0;
  if (balance < amount) {
    return NextResponse.json({ error: `Niet genoeg munten (${balance}/${amount})` }, { status: 400 });
  }

  // Deduct coins
  await admin.from("user_coins").update({ balance: balance - amount }).eq("user_id", user.id);

  // Store bet as cosmetic marker: bet_mxecu_20260630_Mexico_100
  const betId = `bet_${MATCH_ID}_${team}_${amount}`;
  await admin.from("user_cosmetics").insert({ user_id: user.id, cosmetic_id: betId });

  return NextResponse.json({ success: true, balance: balance - amount, team, amount });
}
