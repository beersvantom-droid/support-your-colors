import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function makeUserClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    console.log("[predictions/submit] Token present:", !!token);

    if (!token) {
      console.error("[predictions/submit] No token in Authorization header");
      return NextResponse.json({ error: "Unauthorized - no token" }, { status: 401 });
    }

    const db = makeUserClient(token);

    // Get user
    const { data: userData, error: userError } = await db.auth.getUser();
    console.log("[predictions/submit] Auth check:", { user: !!userData.user, error: userError?.message });

    if (userError || !userData.user) {
      console.error("[predictions/submit] Auth failed:", userError?.message);
      return NextResponse.json({ error: "Unauthorized - auth failed" }, { status: 401 });
    }

    console.log("[predictions/submit] User authenticated:", userData.user.id);

    const { match_id, prediction } = await req.json();

    if (!match_id || !prediction) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!["home_win", "draw", "away_win"].includes(prediction)) {
      return NextResponse.json({ error: "Invalid prediction" }, { status: 400 });
    }

    // Upsert prediction (update if exists, insert if not)
    const { error } = await db
      .from("match_predictions")
      .upsert({
        user_id: userData.user.id,
        match_id,
        prediction,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error("[predictions/submit] error:", error);
      return NextResponse.json({ error: "Failed to save prediction" }, { status: 500 });
    }

    return NextResponse.json({ success: true, prediction });
  } catch (err) {
    console.error("[predictions/submit] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
