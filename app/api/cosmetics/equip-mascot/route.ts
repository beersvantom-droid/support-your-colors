import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getMascotById } from "@/lib/cosmetics";

export const runtime = "nodejs";

const MAX_MASCOTS = 3;

function makeUserClient(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: () => {},
      },
    }
  );
}

export async function POST(req: NextRequest) {
  const db = makeUserClient(req);
  const { data: { user } } = await db.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { mascots?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  // Validate: must be array of strings, max MAX_MASCOTS
  const mascots = body.mascots;
  if (!Array.isArray(mascots) || mascots.length > MAX_MASCOTS) {
    return NextResponse.json(
      { success: false, error: `Max ${MAX_MASCOTS} mascots allowed` },
      { status: 400 }
    );
  }

  const mascotIds = mascots as string[];

  // Validate each mascot exists in the catalogue
  for (const id of mascotIds) {
    if (!getMascotById(id)) {
      return NextResponse.json(
        { success: false, error: `Unknown mascot: ${id}` },
        { status: 400 }
      );
    }
  }

  // Check all mascots are owned by this user
  if (mascotIds.length > 0) {
    const { data: inventory } = await db
      .from("user_cosmetics")
      .select("cosmetic_id")
      .eq("user_id", user.id)
      .in("cosmetic_id", mascotIds);

    const owned = new Set((inventory ?? []).map((r: { cosmetic_id: string }) => r.cosmetic_id));
    for (const id of mascotIds) {
      if (!owned.has(id)) {
        return NextResponse.json(
          { success: false, error: `Not in inventory: ${id}` },
          { status: 403 }
        );
      }
    }
  }

  // Update equipped_mascots column (PostgreSQL text array)
  const { error } = await db
    .from("profiles")
    .update({ equipped_mascots: mascotIds })
    .eq("id", user.id);

  if (error) {
    console.error("[equip-mascot] update error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, equipped: mascotIds });
}
