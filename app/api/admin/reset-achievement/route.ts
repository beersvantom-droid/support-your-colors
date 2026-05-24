import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_USER_ID } from "@/lib/admin";

export const runtime = "nodejs";

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getRequestUser(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: () => {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser(req);
    if (!user || user.id !== ADMIN_USER_ID) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let body: { achievementRowId?: unknown; userId?: unknown; pointsAwarded?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
    }

    const { achievementRowId, userId, pointsAwarded } = body;
    if (!achievementRowId || !userId || pointsAwarded == null) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const db = adminDb();

    const { error: delError } = await db
      .from("user_achievements")
      .delete()
      .eq("id", achievementRowId);

    if (delError) {
      console.error("[reset-achievement] delete error:", delError.message);
      return NextResponse.json({ success: false, error: delError.message }, { status: 500 });
    }

    const { error: rpcError } = await db.rpc("increment_supporter_points", {
      user_id: userId,
      amount: -(pointsAwarded as number),
    });

    if (rpcError) {
      console.error("[reset-achievement] RPC error:", rpcError.message);
      return NextResponse.json({ success: false, error: `Points deduction failed: ${rpcError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[reset-achievement] unhandled error:", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
