import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cleanupOldChatMessages } from "@/lib/chat-reset";

export const runtime = "nodejs";

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(_req: NextRequest) {
  try {
    const db = makeServiceClient();

    // Clear out messages from before today's 05:00 Amsterdam reset, so the
    // chat resets daily without needing any external cron job.
    await cleanupOldChatMessages(db);

    // Fetch last 50 messages (newest last so UI can reverse)
    const { data: messages, error: msgError } = await db
      .from("live_chat_messages")
      .select("id, user_id, username, user_country, user_flag, message, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (msgError) {
      // PGRST205 = table not found (migration not yet run) — return empty instead of crashing
      if (msgError.code === "PGRST205" || msgError.message?.includes("live_chat_messages")) {
        return NextResponse.json({
          messages: [],
          activeUsers: 0,
          isMatchLive: false,
          liveMatches: [],
          nextMatchDate: null,
        });
      }
      console.error("[live-chat/messages] fetch error:", msgError);
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }

    // Count "online" users: anyone who sent a message in the last 5 minutes
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count: activeUsers } = await db
      .from("live_chat_messages")
      .select("user_id", { count: "exact", head: true })
      .gte("created_at", fiveMinAgo);

    // Check if any match is currently live
    const { data: liveMatches } = await db
      .from("match_results")
      .select("home_team, away_team, home_score, away_score, status")
      .eq("status", "live")
      .limit(3);

    // If no live match, find the next upcoming match date
    let nextMatchDate: string | null = null;
    const isMatchLive = (liveMatches?.length ?? 0) > 0;

    if (!isMatchLive) {
      const today = new Date().toISOString().split("T")[0];
      const { data: upcoming } = await db
        .from("match_results")
        .select("match_date")
        .eq("status", "upcoming")
        .gte("match_date", today)
        .order("match_date", { ascending: true })
        .limit(1);

      nextMatchDate = upcoming?.[0]?.match_date ?? null;
    }

    // Return messages oldest-first for the UI
    const sorted = (messages ?? []).reverse();

    return NextResponse.json({
      messages: sorted,
      activeUsers: activeUsers ?? 0,
      isMatchLive,
      liveMatches: liveMatches ?? [],
      nextMatchDate,
    });
  } catch (err) {
    console.error("[live-chat/messages] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
