// Voting day resets at 05:00 Amsterdam time (CEST = UTC+2 in summer 2026).
// 05:00 CEST = 03:00 UTC — so before 03:00 UTC we're still on "yesterday's" vote window.
const RESET_UTC_HOUR = 3;

export function getVotingDay(): string {
  const now = new Date();
  const d = new Date(now);
  if (d.getUTCHours() < RESET_UTC_HOUR) {
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return d.toISOString().split("T")[0];
}

export function getTimeUntilVotingReset(): string {
  const now = new Date();
  const nextReset = new Date(now);
  nextReset.setUTCHours(RESET_UTC_HOUR, 0, 0, 0);
  if (nextReset.getTime() <= now.getTime()) {
    nextReset.setUTCDate(nextReset.getUTCDate() + 1);
  }
  const diff = nextReset.getTime() - now.getTime();
  if (diff <= 0) return "Resetting now";
  const totalMins = Math.floor(diff / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${h}h ${m}m`;
}
