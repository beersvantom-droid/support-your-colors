import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getCosmeticById, type CosmeticType } from "@/lib/cosmetics";

export const runtime = "nodejs";

const COLUMN: Record<CosmeticType, string> = {
  name_color: "equipped_name_color",
  border:     "equipped_border",
  badge:      "equipped_badge",
  card_bg:    "equipped_card_bg",
};

// Defaults: always equippable without an inventory row
const ALWAYS_EQUIPPABLE = new Set(["badge_default", "bg_default"]);

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

  console.log("[equip] auth user:", user?.id ?? "null — will 401");

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { cosmeticId?: unknown; type?: unknown };
  try {
    body = await req.json();
  } catch {
    console.error("[equip] failed to parse request body");
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  const cosmeticId = body.cosmeticId as string | null;
  const type       = body.type as CosmeticType | undefined;

  console.log("[equip] payload — cosmeticId:", cosmeticId, "type:", type);

  // ── Unequip ──────────────────────────────────────────────────────────────────
  if (cosmeticId === null) {
    if (!type || !COLUMN[type]) {
      return NextResponse.json({ success: false, error: "type required when unequipping" }, { status: 400 });
    }
    const { error } = await db
      .from("profiles")
      .update({ [COLUMN[type]]: null })
      .eq("id", user.id);

    console.log("[equip] unequip error:", error?.message ?? "none");
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // ── Equip ────────────────────────────────────────────────────────────────────
  const def = getCosmeticById(cosmeticId);
  console.log("[equip] cosmetic def:", def ? `${def.id} (${def.type})` : "NOT FOUND");
  if (!def) {
    return NextResponse.json({ success: false, error: `Unknown cosmetic: ${cosmeticId}` }, { status: 400 });
  }

  if (!ALWAYS_EQUIPPABLE.has(cosmeticId)) {
    const { data: row, error: invErr } = await db
      .from("user_cosmetics")
      .select("id")
      .eq("user_id", user.id)
      .eq("cosmetic_id", cosmeticId)
      .maybeSingle();

    console.log("[equip] inventory check — row:", row ? "found" : "NOT FOUND", "| inv error:", invErr?.message ?? "none");

    if (!row) {
      return NextResponse.json({ success: false, error: "Not in inventory" }, { status: 403 });
    }
  }

  const column = COLUMN[def.type];
  console.log("[equip] updating profiles — column:", column, "| value:", cosmeticId, "| userId:", user.id);

  const { error } = await db
    .from("profiles")
    .update({ [column]: cosmeticId })
    .eq("id", user.id);

  console.log("[equip] update error:", error?.message ?? "none", "| code:", error?.code ?? "—");

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
