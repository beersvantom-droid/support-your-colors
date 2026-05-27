import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

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

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const RATE_LIMIT = 10;         // max messages
const RATE_WINDOW_MS = 60_000; // per 60 seconds

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const userDb = makeUserClient(req);
    const { data: { user } } = await userDb.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Je moet ingelogd zijn om te chatten" }, { status: 401 });
    }

    // Parse body
    let body: { message?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Ongeldig verzoek" }, { status: 400 });
    }

    const message = (body.message ?? "").trim();

    if (!message) {
      return NextResponse.json({ error: "Bericht mag niet leeg zijn" }, { status: 400 });
    }

    if (message.length > 140) {
      return NextResponse.json({ error: "Bericht is te lang (max 140 tekens)" }, { status: 400 });
    }

    const serviceDb = makeServiceClient();

    // Rate limit check: count messages from this user in the last 60 seconds
    const windowStart = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
    const { count: recentCount } = await serviceDb
      .from("live_chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", windowStart);

    if ((recentCount ?? 0) >= RATE_LIMIT) {
      return NextResponse.json(
        { error: "Te snel! Max 10 berichten per minuut." },
        { status: 429 }
      );
    }

    // Fetch user profile for username + country
    const { data: profile } = await serviceDb
      .from("profiles")
      .select("username, country")
      .eq("id", user.id)
      .single();

    const username = profile?.username ?? user.email?.split("@")[0] ?? "Supporter";
    const userCountry = profile?.country ?? null;

    // Derive flag from country name (use the TEAMS data logic server-side)
    const userFlag = deriveFlag(userCountry);

    // Insert message
    const { data: inserted, error: insertError } = await serviceDb
      .from("live_chat_messages")
      .insert({
        user_id: user.id,
        username,
        user_country: userCountry,
        user_flag: userFlag,
        message,
      })
      .select("id, created_at")
      .single();

    if (insertError) {
      console.error("[live-chat/send] insert error:", insertError);
      return NextResponse.json({ error: "Versturen mislukt" }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: inserted.id, timestamp: inserted.created_at });
  } catch (err) {
    console.error("[live-chat/send] unexpected error:", err);
    return NextResponse.json({ error: "Interne fout" }, { status: 500 });
  }
}

// Country name → emoji flag mapping (server-side, mirrors countries.ts logic)
const COUNTRY_FLAGS: Record<string, string> = {
  "Netherlands": "🇳🇱", "Germany": "🇩🇪", "France": "🇫🇷", "Spain": "🇪🇸",
  "Brazil": "🇧🇷", "Argentina": "🇦🇷", "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Italy": "🇮🇹",
  "Portugal": "🇵🇹", "Belgium": "🇧🇪", "Japan": "🇯🇵", "Mexico": "🇲🇽",
  "United States": "🇺🇸", "Canada": "🇨🇦", "Australia": "🇦🇺", "Morocco": "🇲🇦",
  "Senegal": "🇸🇳", "South Korea": "🇰🇷", "Uruguay": "🇺🇾", "Switzerland": "🇨🇭",
  "Denmark": "🇩🇰", "Sweden": "🇸🇪", "Norway": "🇳🇴", "Poland": "🇵🇱",
  "Croatia": "🇭🇷", "Serbia": "🇷🇸", "Ukraine": "🇺🇦", "Turkey": "🇹🇷",
  "Türkiye": "🇹🇷", "Saudi Arabia": "🇸🇦", "Iran": "🇮🇷", "Ghana": "🇬🇭",
  "Ecuador": "🇪🇨", "Qatar": "🇶🇦", "Tunisia": "🇹🇳", "Cameroon": "🇨🇲",
  "South Africa": "🇿🇦", "Egypt": "🇪🇬", "Algeria": "🇩🇿", "Iraq": "🇮🇶",
  "Czechia": "🇨🇿", "Austria": "🇦🇹", "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Haiti": "🇭🇹",
  "Paraguay": "🇵🇾", "Curaçao": "🇨🇼", "Ivory Coast": "🇨🇮", "Jordan": "🇯🇴",
  "New Zealand": "🇳🇿", "Bosnia and Herzegovina": "🇧🇦", "Cape Verde": "🇨🇻",
};

function deriveFlag(country: string | null): string {
  if (!country) return "🌍";
  return COUNTRY_FLAGS[country] ?? "🌍";
}
