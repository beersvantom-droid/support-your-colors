import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getPack } from "@/lib/packs";

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

// GET /api/pack/inventory — list this user's unopened packs ("Jouw Packs")
export async function GET(req: NextRequest) {
  const db = makeUserClient(req);
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await db
    .from("user_pack_inventory")
    .select("id, pack_id, source, created_at")
    .eq("user_id", user.id)
    .is("opened_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[pack/inventory] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (data ?? [])
    .map((row) => {
      const pack = getPack(row.pack_id);
      if (!pack) return null;
      return {
        inventoryId: row.id,
        pack,
        source: row.source,
        createdAt: row.created_at,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ items });
}
