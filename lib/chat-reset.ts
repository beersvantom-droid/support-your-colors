import type { SupabaseClient } from "@supabase/supabase-js";

const RESET_HOUR_AMSTERDAM = 5;

/**
 * Returns the UTC instant of the most recent 05:00 Amsterdam-time reset point.
 * Messages older than this should be cleared.
 */
export function getDailyResetCutoffUTC(now: Date): Date {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const year = get("year");
  const month = get("month");
  const day = get("day");
  let hour = get("hour");
  if (hour === 24) hour = 0;

  let cutoff = new Date(Date.UTC(year, month - 1, day, RESET_HOUR_AMSTERDAM, 0, 0));
  if (hour < RESET_HOUR_AMSTERDAM) {
    cutoff = new Date(cutoff.getTime() - 24 * 60 * 60 * 1000);
  }

  const offsetFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Amsterdam",
    timeZoneName: "shortOffset",
  });
  const offsetStr =
    offsetFmt.formatToParts(cutoff).find((p) => p.type === "timeZoneName")?.value ?? "GMT+1";
  const offsetHours = Number(offsetStr.replace("GMT", "")) || 1;

  return new Date(cutoff.getTime() - offsetHours * 60 * 60 * 1000);
}

/**
 * Deletes all live chat messages older than the most recent 05:00
 * Amsterdam-time reset point, so the chat resets daily without needing
 * any external cron job.
 */
export async function cleanupOldChatMessages(db: SupabaseClient): Promise<void> {
  const cutoff = getDailyResetCutoffUTC(new Date());

  const { error } = await db
    .from("live_chat_messages")
    .delete()
    .lt("created_at", cutoff.toISOString());

  if (error && error.code !== "PGRST205") {
    console.error("[chat-reset] cleanup error:", error);
  }
}
