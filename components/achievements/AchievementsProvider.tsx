"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import { createServerClient } from "@supabase/ssr";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  type AchievementDef,
  calcConsecutiveDays,
  getAchievementById,
  resolveNewUnlocks,
} from "@/lib/achievements";
import type { UserAchievement } from "@/lib/supabase";
import AchievementUnlockModal from "./AchievementUnlockModal";

interface AchievementsContextType {
  userAchievements: UserAchievement[];
  unlockedIds: Set<string>;
  triggerCheck: () => void;
}

const AchievementsContext = createContext<AchievementsContextType>({
  userAchievements: [],
  unlockedIds: new Set(),
  triggerCheck: () => {},
});

export function AchievementsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading: authLoading } = useAuth();

  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>(
    []
  );
  const [unlockQueue, setUnlockQueue] = useState<AchievementDef[]>([]);

  // Stable ref so triggerCheck closure always sees latest unlocked set
  const unlockedIdsRef = useRef<Set<string>>(new Set());
  const hasLoggedActivity = useRef(false);
  const lastCheckTs = useRef(0);

  // ── Load existing achievements on auth ───────────────────────────────────────
  useEffect(() => {
    if (authLoading || !user) return;

    async function load() {
      const { data } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", user!.id)
        .order("unlocked_at", { ascending: false });

      if (data) {
        const list = data as UserAchievement[];
        setUserAchievements(list);
        unlockedIdsRef.current = new Set(list.map((a) => a.achievement_id));
      }
    }

    load();
  }, [authLoading, user]);

  // ── Log daily activity (once per browser session) ─────────────────────────
  useEffect(() => {
    if (authLoading || !user || hasLoggedActivity.current) return;
    hasLoggedActivity.current = true;

    const today = new Date().toISOString().split("T")[0];
    supabase
      .from("user_activity_log")
      .upsert(
        { user_id: user.id, activity_date: today },
        { onConflict: "user_id,activity_date" }
      )
      .then(() => {});
  }, [authLoading, user]);

  // ── Check all achievements ────────────────────────────────────────────────
  const triggerCheck = useCallback(() => {
    if (!user || !profile) return;

    // Debounce: no more than once per 60 seconds
    const now = Date.now();
    if (now - lastCheckTs.current < 60_000) return;
    lastCheckTs.current = now;

    async function run() {
      try {
        const [postsRes, commentsRes, votesRes, activityRes] =
          await Promise.all([
            supabase
              .from("posts")
              .select("created_at")
              .eq("username", profile!.username),
            supabase
              .from("comments")
              .select("created_at")
              .eq("username", profile!.username),
            supabase
              .from("daily_votes")
              .select("vote_date")
              .eq("voter_id", user!.id),
            supabase
              .from("user_activity_log")
              .select("activity_date")
              .eq("user_id", user!.id)
              .order("activity_date", { ascending: false }),
          ]);

        const posts: Array<{ created_at: string }> = postsRes.data ?? [];
        const postCount = posts.length;
        const commentCount = (commentsRes.data ?? []).length;

        const voteDates: string[] = (votesRes.data ?? []).map(
          (v: { vote_date: string }) => v.vote_date
        );
        const voteDayCount = new Set(voteDates).size;
        const sortedVoteDates = [...voteDates].sort().reverse();
        const consecutiveVoteDays = calcConsecutiveDays(sortedVoteDates);

        const activityDates: string[] = (activityRes.data ?? []).map(
          (r: { activity_date: string }) => r.activity_date
        );
        const consecutiveActivityDays = calcConsecutiveDays(activityDates);

        // Night / midnight post counts
        const midnightPostCount = posts.filter((p) => {
          const h = new Date(p.created_at).getHours();
          return h >= 0 && h < 5;
        }).length;
        const nightPostCount = posts.filter((p) => {
          const h = new Date(p.created_at).getHours();
          return h >= 22 || h < 5;
        }).length;

        // Around The Clock: morning(6-12) + afternoon(12-18) + night(22+) on same day
        const daySlots = new Map<string, Set<string>>();
        for (const p of posts) {
          const d = new Date(p.created_at);
          const dateKey = d.toISOString().split("T")[0];
          const h = d.getHours();
          const slot =
            h >= 6 && h < 12
              ? "morning"
              : h >= 12 && h < 18
              ? "afternoon"
              : h >= 22 || h < 6
              ? "night"
              : null;
          if (slot) {
            if (!daySlots.has(dateKey)) daySlots.set(dateKey, new Set());
            daySlots.get(dateKey)!.add(slot);
          }
        }
        const hasAroundTheClock = [...daySlots.values()].some(
          (s) => s.has("morning") && s.has("afternoon") && s.has("night")
        );

        // Fast Responder: commented within 2 min of a post
        let hasFastResponse = false;
        let hasScheidrechterComment = false;
        let hasRonJansKeyword = false;
        let hasHutsOrNiffo = false;
        try {
          // Fetch all comments from user
          const { data: commentRows, error: commentError } = await supabase
            .from("comments")
            .select("id, created_at, comment_text, post_id")
            .eq("username", profile!.username);

          if (commentError) {
            console.error("[Achievements] Comment query error:", commentError);
          }

          if (commentRows && commentRows.length > 0) {
            console.log("[Achievements] Found", commentRows.length, "comments");

            // Check for scheidsrechter comment (or "scheids" shorthand)
            hasScheidrechterComment = commentRows.some((c: any) => {
              const text = c.comment_text && c.comment_text.toLowerCase();
              const hasWord = text && (text.includes("scheidsrechter") || text.includes("scheids"));
              if (hasWord) {
                console.log("[Achievements] Found scheidsrechter/scheids in comment:", c.comment_text);
              }
              return hasWord;
            });

            // Check for Ron Jans keywords: "keukenrol", "ronjansdans", or "pec zwolle"
            const ronJansKeywords = ["keukenrol", "ronjansdans", "pec zwolle"];
            hasRonJansKeyword = commentRows.some((c: any) => {
              const text = c.comment_text ? c.comment_text.toLowerCase() : "";
              const hasKeyword = ronJansKeywords.some(keyword => text.includes(keyword));
              if (hasKeyword) {
                console.log("[Achievements] Found Ron Jans keyword in comment:", c.comment_text);
              }
              return hasKeyword;
            });

            // Check for Udo keywords: "huts" or "niffo"
            const udoKeywords = ["huts", "niffo"];
            hasHutsOrNiffo = commentRows.some((c: any) => {
              const text = c.comment_text ? c.comment_text.toLowerCase() : "";
              const hasKeyword = udoKeywords.some(keyword => text.includes(keyword));
              if (hasKeyword) {
                console.log("[Achievements] Found Udo keyword in comment:", c.comment_text);
              }
              return hasKeyword;
            });

            // For fast responder, fetch post creation times separately
            try {
              const postIds = commentRows.map((c: any) => c.post_id);
              const { data: posts } = await supabase
                .from("posts")
                .select("id, created_at")
                .in("id", postIds);

              const postMap = new Map(posts?.map((p: any) => [p.id, p]) ?? []);

              hasFastResponse = commentRows.some((c: any) => {
                const post = postMap.get(c.post_id);
                if (!post) return false;
                const diff =
                  new Date(c.created_at).getTime() -
                  new Date(post.created_at).getTime();
                return diff >= 0 && diff <= 2 * 60 * 1000;
              });
            } catch (err) {
              console.error("[Achievements] Post fetch error:", err);
            }

            console.log("[Achievements] hasFastResponse:", hasFastResponse, "hasScheidrechterComment:", hasScheidrechterComment, "hasRonJansKeyword:", hasRonJansKeyword);
          }
        } catch (err) {
          console.error("[Achievements] Comment section error:", err);
        }

        // Villain Arc: received 25+ comments on a single post
        // Also: Viral Post (8+ likes on one post), and total likes received
        let villain_arc_max_comments = 0;
        let djDerksenCommentCount    = 0;
        let abuHarbCommentCount      = 0;
        let maxLikesOnPost           = 0;
        let totalLikesReceived       = 0;
        try {
          const { data: myPosts } = await supabase
            .from("posts")
            .select("id")
            .eq("username", profile!.username);

          if (myPosts && myPosts.length > 0) {
            const postIds = myPosts.map((p: { id: string }) => p.id);

            // Get comment counts
            const { data: commentCounts } = await supabase
              .from("comments")
              .select("post_id, username")
              .in("post_id", postIds);

            const counts = new Map<string, number>();
            for (const c of commentCounts ?? []) {
              const row = c as { post_id: string; username: string };
              counts.set(row.post_id, (counts.get(row.post_id) ?? 0) + 1);
              if (row.username.toLowerCase().trim() === "dj derksen") {
                djDerksenCommentCount++;
              }
              if (row.username.toLowerCase().trim() === "abu harb") {
                abuHarbCommentCount++;
              }
            }
            villain_arc_max_comments = Math.max(0, ...counts.values());

            // Get flame/reaction counts per post
            const { data: reactions } = await supabase
              .from("post_reactions")
              .select("post_id")
              .in("post_id", postIds);

            const reactionMap = new Map<string, number>();
            for (const r of reactions ?? []) {
              const row = r as { post_id: string };
              reactionMap.set(row.post_id, (reactionMap.get(row.post_id) ?? 0) + 1);
            }

            if (reactionMap.size > 0) {
              maxLikesOnPost = Math.max(...reactionMap.values());
              totalLikesReceived = Array.from(reactionMap.values()).reduce((sum, n) => sum + n, 0);
            }
          }
        } catch {}

        // ── Progression achievements: count packs, cosmetics, mascots ───────────────
        let packsOpenedCount = 0;
        let cosmeticsOwnedCount = 0;
        let mascotsOwnedCount = 0;
        try {
          // Count unique pack types opened
          const { data: packsOpened } = await supabase
            .from("user_pack_cooldowns")
            .select("pack_id")
            .eq("user_id", user!.id);
          packsOpenedCount = new Set(packsOpened?.map((p: any) => p.pack_id) ?? []).size;

          // Count unique cosmetics (including mascots)
          const { data: allCosmetics } = await supabase
            .from("user_cosmetics")
            .select("cosmetic_id")
            .eq("user_id", user!.id);
          cosmeticsOwnedCount = allCosmetics?.length ?? 0;
          mascotsOwnedCount = allCosmetics?.filter((c: any) =>
            c.cosmetic_id.startsWith("mascot_")
          ).length ?? 0;
        } catch (err) {
          console.error("[Achievements] Error counting progression stats:", err);
        }

        // Onderbuikgevoel: an "underdog pick" (≤25% of voters) that turned
        // out to match the actual finished result.
        let hasUnderdogCorrectPick = false;
        try {
          const { data: underdogPicks } = await supabase
            .from("match_predictions")
            .select("match_id, prediction")
            .eq("user_id", user!.id)
            .eq("was_underdog_pick", true);

          if (underdogPicks && underdogPicks.length > 0) {
            const matchIds = underdogPicks.map((p: any) => p.match_id);
            const { data: finishedMatches } = await supabase
              .from("match_results")
              .select("id, home_score, away_score, status")
              .in("id", matchIds)
              .eq("status", "finished");

            const resultMap = new Map(
              (finishedMatches ?? []).map((m: any) => [m.id, m])
            );

            hasUnderdogCorrectPick = underdogPicks.some((p: any) => {
              const match = resultMap.get(p.match_id);
              if (!match || match.home_score == null || match.away_score == null) return false;
              const actual =
                match.home_score > match.away_score
                  ? "home_win"
                  : match.home_score < match.away_score
                  ? "away_win"
                  : "draw";
              return p.prediction === actual;
            });
          }
        } catch (err) {
          console.error("[Achievements] Error checking underdog picks:", err);
        }

        const stats = {
          postCount,
          commentCount,
          voteDayCount,
          consecutiveActivityDays,
          consecutiveVoteDays,
          nightPostCount,
          midnightPostCount,
          hasAroundTheClock,
          hasFastResponse,
          villain_arc_max_comments,
          djDerksenCommentCount,
          abuHarbCommentCount,
          hasScheidrechterComment,
          hasRonJansKeyword,
          hasHutsOrNiffo,
          packsOpenedCount,
          cosmeticsOwnedCount,
          mascotsOwnedCount,
          hasUnderdogCorrectPick,
          maxLikesOnPost,
          totalLikesReceived,
        };

        const newUnlocks = resolveNewUnlocks(stats, unlockedIdsRef.current);
        if (newUnlocks.length === 0) return;

        // Insert into DB (ignore duplicate errors gracefully)
        const { error: insertError } = await supabase
          .from("user_achievements")
          .insert(
            newUnlocks.map((a) => ({
              user_id: user!.id,
              achievement_id: a.id,
              points_awarded: a.points,
            }))
          );

        if (insertError) {
          // Unique constraint: filter to truly new ones from the response
          // This can happen in a race condition — safe to ignore
          if (insertError.code !== "23505") {
            console.error("[Achievements] insert error:", insertError.message);
          }
          return;
        }

        // Award points (normal achievements only, not tiered)
        const normalAchievements = newUnlocks.filter((a) => !a.tiers);
        const totalPoints = normalAchievements.reduce((sum, a) => sum + a.points, 0);
        if (totalPoints > 0) {
          await supabase.rpc("increment_supporter_points", {
            user_id: user!.id,
            amount: totalPoints,
          });
        }

        // Award coins (only for non-tiered achievements with coins)
        const coinAchievements = normalAchievements.filter((a) => a.coins && a.coins > 0);
        const coinTotal = coinAchievements.reduce((sum, a) => sum + (a.coins ?? 0), 0);
        if (coinTotal > 0) {
          try {
            // Use service role to bypass RLS
            const serviceDb = createServerClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!,
              {
                cookies: {
                  getAll: () => [],
                  setAll: () => {},
                },
              }
            );

            const { data: existingCoins } = await serviceDb
              .from("user_coins")
              .select("balance")
              .eq("user_id", user!.id)
              .maybeSingle();

            if (existingCoins) {
              await serviceDb
                .from("user_coins")
                .update({ balance: existingCoins.balance + coinTotal })
                .eq("user_id", user!.id);
            } else {
              await serviceDb.from("user_coins").insert({
                user_id: user!.id,
                balance: coinTotal,
              });
            }
            console.log(`[Achievements] Awarded ${coinTotal} coins`);
          } catch (err) {
            console.error("[Achievements] Error awarding coins:", err);
          }
        }

        // Auto-unlock mascots when achievements are earned
        if (newUnlocks.some(a => a.id === "dj_derksen_fan")) {
          await supabase
            .from("user_cosmetics")
            .upsert(
              { user_id: user!.id, cosmetic_id: "mascot_dj_derksen" },
              { onConflict: "user_id,cosmetic_id" }
            );
        }
        if (newUnlocks.some(a => a.id === "abu_harb_fan")) {
          await supabase
            .from("user_cosmetics")
            .upsert(
              { user_id: user!.id, cosmetic_id: "mascot_abu_harb" },
              { onConflict: "user_id,cosmetic_id" }
            );
        }
        if (newUnlocks.some(a => a.id === "jannes_fan")) {
          await supabase
            .from("user_cosmetics")
            .upsert(
              { user_id: user!.id, cosmetic_id: "mascot_jannes" },
              { onConflict: "user_id,cosmetic_id" }
            );
        }
        if (newUnlocks.some(a => a.id === "ron_jans_fan")) {
          await supabase
            .from("user_cosmetics")
            .upsert(
              { user_id: user!.id, cosmetic_id: "mascot_ron_jans" },
              { onConflict: "user_id,cosmetic_id" }
            );
        }
        if (newUnlocks.some(a => a.id === "golden_cor_fan")) {
          await supabase
            .from("user_cosmetics")
            .upsert(
              { user_id: user!.id, cosmetic_id: "mascot_golden_cor" },
              { onConflict: "user_id,cosmetic_id" }
            );
        }
        if (newUnlocks.some(a => a.id === "udo_fan")) {
          await supabase
            .from("user_cosmetics")
            .upsert(
              { user_id: user!.id, cosmetic_id: "mascot_udo" },
              { onConflict: "user_id,cosmetic_id" }
            );
        }

        // Update local state
        const now = new Date().toISOString();
        const fresh: UserAchievement[] = newUnlocks.map((a) => ({
          id: a.id,
          user_id: user!.id,
          achievement_id: a.id,
          points_awarded: a.points,
          unlocked_at: now,
        }));

        unlockedIdsRef.current = new Set([
          ...unlockedIdsRef.current,
          ...newUnlocks.map((a) => a.id),
        ]);
        setUserAchievements((prev) => [...fresh, ...prev]);
        setUnlockQueue((prev) => [...prev, ...newUnlocks]);
      } catch (err) {
        console.error("[Achievements] check failed:", err);
      }
    }

    run();
  }, [user, profile]);

  function dismissCurrentUnlock() {
    setUnlockQueue((prev) => prev.slice(1));
  }

  const ctxValue: AchievementsContextType = {
    userAchievements,
    unlockedIds: unlockedIdsRef.current,
    triggerCheck,
  };

  return (
    <AchievementsContext.Provider value={ctxValue}>
      {children}
      {unlockQueue.length > 0 && (
        <AchievementUnlockModal
          achievement={unlockQueue[0]}
          onDismiss={dismissCurrentUnlock}
        />
      )}
    </AchievementsContext.Provider>
  );
}

export function useAchievements() {
  return useContext(AchievementsContext);
}
