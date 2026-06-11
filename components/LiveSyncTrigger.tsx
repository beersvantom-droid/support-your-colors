"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL = 45_000; // 45 seconds

/**
 * Silently pings /api/sync-scores/auto on an interval so live match scores,
 * group standings and the bracket update automatically while the app is
 * open — no manual SQL or external cron needed.
 */
export function LiveSyncTrigger() {
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const sync = async () => {
      try {
        const res = await fetch("/api/sync-scores/auto");
        if (!res.ok) return;

        const data = await res.json();
        if (data?.updated > 0 || data?.processed > 0) {
          router.refresh();
        }
      } catch (err) {
        console.debug("Live sync failed:", err);
      }
    };

    sync();
    intervalRef.current = setInterval(sync, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [router]);

  return null;
}
