import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";

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

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const amount = Number(body.amount);
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const db = adminClient();

  const { data: existing } = await db
    .from("user_coins")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await db
      .from("user_coins")
      .update({ balance: existing.balance + amount })
      .eq("user_id", user.id);
  } else {
    await db.from("user_coins").insert({ user_id: user.id, balance: amount });
  }

  return NextResponse.json({ success: true, awarded: amount });
}
