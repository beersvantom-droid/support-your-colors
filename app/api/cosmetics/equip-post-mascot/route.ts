import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getMascotById } from "@/lib/cosmetics";

export const runtime = "nodejs";

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

  const mascotIds = body.mascots;
  if (!Array.isArray(mascotIds)) {
    return NextResponse.json({ success: false, error: "mascots must be an array" }, { status: 400 });
  }

  // Get user's profile to check slots and ranking mascots
  const { data: profile } = await db
    .from("profiles")
    .select("post_mascot_slots, equipped_mascots")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ success: false, error: "Profile not found" }, { status: 404 });
  }

  const maxSlots = profile.post_mascot_slots ?? 0;
  if (mascotIds.length > maxSlots) {
    return NextResponse.json(
      { success: false, error: `Je hebt ${maxSlots} post-slots. Koop meer in de locker.` },
      { status: 400 }
    );
  }

  // Validate each mascot exists
  for (const id of mascotIds) {
    if (!getMascotById(id as string)) {
      return NextResponse.json({ success: false, error: `Unknown mascot: ${id}` }, { status: 400 });
    }
  }

  // Check mascots are not also equipped on ranking card
  const rankingMascots = new Set(profile.equipped_mascots ?? []);
  for (const id of mascotIds) {
    if (rankingMascots.has(id as string)) {
      return NextResponse.json(
        { success: false, error: `${id} staat al op je ranking card. Kies een andere.` },
        { status: 400 }
      );
    }
  }

  // Check all mascots are owned
  if (mascotIds.length > 0) {
    const { data: inventory } = await db
      .from("user_cosmetics")
      .select("cosmetic_id")
      .eq("user_id", user.id)
      .in("cosmetic_id", mascotIds as string[]);

    const owned = new Set((inventory ?? []).map((r: { cosmetic_id: string }) => r.cosmetic_id));
    for (const id of mascotIds) {
      if (!owned.has(id as string)) {
        return NextResponse.json({ success: false, error: `Not owned: ${id}` }, { status: 403 });
      }
    }
  }

  const { error } = await db
    .from("profiles")
    .update({ equipped_post_mascots: mascotIds })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, equipped: mascotIds });
}
