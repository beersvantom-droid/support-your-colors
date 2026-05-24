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

    let body: { userId?: unknown; supporterPoints?: unknown; tournamentPoints?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
    }

    const { userId, supporterPoints, tournamentPoints } = body;
    if (!userId || typeof supporterPoints !== "number" || typeof tournamentPoints !== "number") {
      return NextResponse.json({ success: false, error: "Missing or invalid fields" }, { status: 400 });
    }

    const db = adminDb();

    const { error } = await db
      .from("profiles")
      .update({
        supporter_points:  supporterPoints,
        tournament_points: tournamentPoints,
      })
      .eq("id", userId);

    if (error) {
      console.error("[set-points] DB update error:", error.message, "code:", error.code);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[set-points] unhandled error:", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
