import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getPack } from "@/lib/packs";
import { pickFromPack, pickCoinsFromPack } from "@/lib/packSelection";
import * as coins from "@/lib/coins";

export const runtime = "nodejs";

// ── Dev / test accounts that bypass cooldowns ──────────────────────────────
const NO_COOLDOWN_USERS = new Set([
  "5dc52039-2adc-44fe-bc84-e7a6995ac2ec", // Testbot
]);

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
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── Validate pack id ───────────────────────────────────────────────────────
  const body        = await req.json() as { packId?: string; inventoryId?: string };
  const pack        = body.packId ? getPack(body.packId) : undefined;
  const inventoryId = body.inventoryId;
  console.log(`[pack/open] Pack request: ${body.packId}, Found: ${pack ? "yes" : "NO"}`);
  if (!pack) {
    console.error(`[pack/open] Pack not found: ${body.packId}`);
    return NextResponse.json({ error: "Unknown pack" }, { status: 400 });
  }

  // ── Inventory item: validate ownership, skip cooldown entirely ─────────────
  if (inventoryId) {
    const { data: invItem, error: invError } = await db
      .from("user_pack_inventory")
      .select("id, pack_id, opened_at")
      .eq("id", inventoryId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (invError || !invItem || invItem.pack_id !== pack.id || invItem.opened_at) {
      return NextResponse.json({ error: "Invalid inventory item" }, { status: 400 });
    }

    // Consume the inventory slot now — opening always produces a result
    await db
      .from("user_pack_inventory")
      .update({ opened_at: new Date().toISOString() })
      .eq("id", inventoryId);
  }

  // ── Cooldown check ─────────────────────────────────────────────────────────
  const skipCooldown = !!inventoryId || NO_COOLDOWN_USERS.has(user.id);

  if (pack.cooldownMinutes > 0 && !skipCooldown) {
    const { data: cd } = await db
      .from("user_pack_cooldowns")
      .select("last_opened_at")
      .eq("user_id", user.id)
      .eq("pack_id", pack.id)
      .maybeSingle();

    if (cd) {
      const elapsed = (Date.now() - new Date(cd.last_opened_at).getTime()) / 60_000;
      if (elapsed < pack.cooldownMinutes) {
        const minutesLeft = Math.ceil(pack.cooldownMinutes - elapsed);
        return NextResponse.json({ onCooldown: true, minutesLeft });
      }
    }
  }

  // ── Check if this is a roulette pack ──────────────────────────────────────
  const isRoulettePack = pack.id === "roulette_pack";

  if (isRoulettePack) {
    // ── Roulette Pack: 1% DJ Derksen, or 50/50 chance to double coins or lose ──
    console.log(`[pack/open] Roulette pack detected: ${pack.id}`);

    const rouletteRoll = Math.random();
    const hasDerksen = rouletteRoll < 0.01; // 1% chance for DJ Derksen

    if (hasDerksen) {
      // ── 1% chance: DJ Derksen mascot! ──────────────────────────────────────
      console.log(`[pack/open] ROULETTE JACKPOT! DJ Derksen awarded!`);

      // Save mascot to inventory
      const { error: insertErr } = await db.from("user_cosmetics").insert({
        user_id:     user.id,
        cosmetic_id: "mascot_dj_derksen",
      });

      if (insertErr && !insertErr.message.includes("duplicate")) {
        console.error("Error saving DJ Derksen:", insertErr);
        return NextResponse.json({ error: "Failed to award DJ Derksen" }, { status: 500 });
      }

      // Update cooldown
      if (pack.cooldownMinutes > 0 && !skipCooldown) {
        await db.from("user_pack_cooldowns").upsert({
          user_id:        user.id,
          pack_id:        pack.id,
          last_opened_at: new Date().toISOString(),
        }, { onConflict: "user_id,pack_id" });
      }

      return NextResponse.json({
        isRoulettePack: true,
        isDerksen: true,
        item: {
          id: "mascot_dj_derksen",
          type: "mascot",
          rarity: "legendary",
          label: "DJ Derksen",
          emoji: "🎧",
        },
        rarity: "mascots",
      });
    }

    // ── 99% chance: 50/50 coin gamble ──────────────────────────────────────
    const coinRoll = Math.random();
    const isWin = coinRoll < 0.5;
    const coinsToAdd = isWin ? 200 : 0; // Win: +200 total (net +100), Lose: +0 (net -100)

    console.log(`[pack/open] Roulette result: ${isWin ? "WIN!" : "LOSE!"} (roll: ${coinRoll.toFixed(3)})`);

    // ── Add/subtract coins using service role ──────────────────────────────
    const serviceDb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll: () => {},
        },
      }
    );

    const { data: existingCoins } = await serviceDb
      .from("user_coins")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingCoins) {
      await serviceDb
        .from("user_coins")
        .update({
          balance: existingCoins.balance + coinsToAdd,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    } else {
      await serviceDb.from("user_coins").insert({
        user_id: user.id,
        balance: coinsToAdd,
      });
    }

    // Update cooldown
    if (pack.cooldownMinutes > 0 && !skipCooldown) {
      await db.from("user_pack_cooldowns").upsert({
        user_id:        user.id,
        pack_id:        pack.id,
        last_opened_at: new Date().toISOString(),
      }, { onConflict: "user_id,pack_id" });
    }

    return NextResponse.json({
      isRoulettePack: true,
      isWin,
      coins: coinsToAdd,
      rarity: isWin ? "legendary" : "common",
    });
  }

  // ── Check if this is a coins pack ─────────────────────────────────────────
  const isCoinsPackage = pack.id === "daily_coins";

  if (isCoinsPackage) {
    // ── Coins Pack: just roll for coins ────────────────────────────────────
    console.log(`[pack/open] Coins pack detected: ${pack.id}`);
    const coinsResult = pickCoinsFromPack(pack.rarityPool);
    console.log(`[pack/open] Coins result: ${coinsResult.coins} coins (${String(coinsResult.rarity)})`);

    // ── Add coins to user balance ──────────────────────────────────────────
    const serviceDb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll: () => {},
        },
      }
    );

    // Ensure user has a coin record
    const { data: existingCoins, error: coinError } = await serviceDb
      .from("user_coins")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    if (coinError) {
      console.error("Error checking coin balance:", coinError);
      return NextResponse.json({ error: "Failed to process coins" }, { status: 500 });
    }

    if (existingCoins) {
      // User exists, increment balance
      const { error: updateErr } = await serviceDb
        .from("user_coins")
        .update({
          balance: existingCoins.balance + coinsResult.coins,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateErr) {
        console.error("Error updating coins:", updateErr);
        return NextResponse.json({ error: "Failed to add coins" }, { status: 500 });
      }
    } else {
      // Create new coin record
      const { error: insertErr } = await serviceDb.from("user_coins").insert({
        user_id: user.id,
        balance: coinsResult.coins,
      });

      if (insertErr) {
        console.error("Error inserting coins:", insertErr);
        return NextResponse.json({ error: "Failed to add coins" }, { status: 500 });
      }
    }

    // Update cooldown
    if (pack.cooldownMinutes > 0 && !skipCooldown) {
      await db.from("user_pack_cooldowns").upsert({
        user_id:        user.id,
        pack_id:        pack.id,
        last_opened_at: new Date().toISOString(),
      }, { onConflict: "user_id,pack_id" });
    }

    return NextResponse.json({
      isCoinsPackage: true,
      coins: coinsResult.coins,
      rarity: coinsResult.rarity,
    });
  }

  // ── Cosmetics Pack: fetch what user owns ────────────────────────────────────
  const { data: existing, error: cosmError } = await db
    .from("user_cosmetics")
    .select("cosmetic_id")
    .eq("user_id", user.id);

  if (cosmError) {
    console.error("[pack/open] Error fetching cosmetics:", cosmError);
    return NextResponse.json({ error: `DB Error: ${cosmError.message}` }, { status: 500 });
  }

  const owned = new Set((existing ?? []).map((r: { cosmetic_id: string }) => r.cosmetic_id));
  console.log(`[pack/open] User owns ${owned.size} items`);

  // ── Pick a reward ──────────────────────────────────────────────────────────
  console.log(`[pack/open] Calling pickFromPack for pack: ${pack.id}, owned items: ${owned.size}`);
  const result = pickFromPack(pack, owned);
  console.log(`[pack/open] pickFromPack result:`, result ? `${result.item.id} (${result.rarity})` : "NULL");

  if (!result) {
    console.log(`[pack/open] No result - all owned or no items available`);
    return NextResponse.json({ alreadyOwnsAll: true });
  }

  // ── Save cosmetic to user inventory ───────────────────────────────────────
  const { error: insertErr } = await db.from("user_cosmetics").insert({
    user_id:     user.id,
    cosmetic_id: result.item.id,
  });
  if (insertErr) {
    console.error("pack/open insert error:", insertErr);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // ── Update cooldown ────────────────────────────────────────────────────────
  if (pack.cooldownMinutes > 0 && !skipCooldown) {
    await db.from("user_pack_cooldowns").upsert({
      user_id:        user.id,
      pack_id:        pack.id,
      last_opened_at: new Date().toISOString(),
    }, { onConflict: "user_id,pack_id" });
  }

  return NextResponse.json({
    item: result.item,
    rarity: result.rarity,
  });
}
