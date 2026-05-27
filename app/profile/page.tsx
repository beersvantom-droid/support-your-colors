"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LogOut, Star, Flame, MessageCircle, Trophy, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAchievements } from "@/components/achievements/AchievementsProvider";
import TrophyCase from "@/components/achievements/TrophyCase";
import ProgressAchievementCard from "@/components/achievements/ProgressAchievementCard";
import { getAchievementById, ALL_ACHIEVEMENTS, getCurrentTierLevel } from "@/lib/achievements";
import { supabase } from "@/lib/supabase";
import { getCountryInfo } from "@/lib/countries";
import { ADMIN_USER_ID } from "@/lib/admin";

export default function ProfilePage() {
  const router = useRouter();
  const { profile, user, loading, signOut } = useAuth();
  const { userAchievements } = useAchievements();
  const isAdmin = user?.id === ADMIN_USER_ID;

  const [progressStats, setProgressStats] = useState<{
    consecutiveActivityDays: number;
    packsOpenedCount: number;
    cosmeticsOwnedCount: number;
    mascotsOwnedCount: number;
  } | null>(null);
  const [expandedChallenges, setExpandedChallenges] = useState(false);

  const country = profile?.country ?? null;
  const countryInfo = getCountryInfo(country);
  const accentColor = countryInfo.color;
  const isTestbot = profile?.username?.toLowerCase() === "testbot";
  const isTom = profile?.username?.toLowerCase() === "tom (built)";

  // Load progression stats
  useEffect(() => {
    if (!user?.id) return;

    async function loadStats() {
      try {
        // Consecutive activity days
        const { data: activityData } = await supabase
          .from("user_activity_log")
          .select("activity_date")
          .eq("user_id", user?.id!)
          .order("activity_date", { ascending: false });

        let consecutiveActivityDays = 0;
        if (activityData && activityData.length > 0) {
          const dates: string[] = activityData.map((r: any) => r.activity_date);
          if (dates.length === 0) {
            consecutiveActivityDays = 0;
          } else {
            consecutiveActivityDays = 1;
            for (let i = 1; i < dates.length; i++) {
              const prev = Date.parse(dates[i - 1] + "T12:00:00Z");
              const curr = Date.parse(dates[i] + "T12:00:00Z");
              if (Math.round((prev - curr) / 86_400_000) === 1) {
                consecutiveActivityDays++;
              } else {
                break;
              }
            }
          }
        }

        // Packs opened
        const { data: packsData } = await supabase
          .from("user_pack_cooldowns")
          .select("pack_id")
          .eq("user_id", user?.id!);
        const packsOpenedCount = new Set(
          packsData?.map((p: any) => p.pack_id) ?? []
        ).size;

        // Cosmetics owned
        const { data: cosmeticsData } = await supabase
          .from("user_cosmetics")
          .select("cosmetic_id")
          .eq("user_id", user?.id!);
        const cosmeticsOwnedCount = cosmeticsData?.length ?? 0;
        const mascotsOwnedCount = cosmeticsData?.filter((c: any) =>
          c.cosmetic_id.startsWith("mascot_")
        ).length ?? 0;

        setProgressStats({
          consecutiveActivityDays,
          packsOpenedCount,
          cosmeticsOwnedCount,
          mascotsOwnedCount,
        });
      } catch (err) {
        console.error("[Profile] Error loading progress stats:", err);
      }
    }

    loadStats();
  }, [user?.id]);

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl mb-3">⚽</div>
          <p className="text-sm font-bold text-text-muted">Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full" style={{ background: "#F0F2F5" }}>
      {/* ── Identity hero ────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden px-4 pt-10 pb-8"
        style={
          isTestbot
            ? {
                backgroundImage: "url('/chat/achtergrond-brazil.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : isTom
            ? {
                backgroundImage: "url('/chat/achtergrond-canada.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : {
                background: `linear-gradient(160deg, ${accentColor} 0%, ${accentColor}cc 100%)`,
              }
        }
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-6 -right-6 w-36 h-36 rounded-full opacity-10"
          style={{ background: "#FFFFFF" }}
        />
        <div
          className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full opacity-10"
          style={{ background: "#FFFFFF" }}
        />

        <div className="relative flex flex-col items-center text-center gap-3">
          {/* Flag or default avatar */}
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-5xl"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            {countryInfo.flag}
          </div>

          {/* Name */}
          <div>
            <h1 className="text-2xl font-black text-white leading-tight">
              {profile?.username ?? user?.email?.split("@")[0] ?? "Supporter"}
            </h1>
            {country && (
              <p className="text-sm font-semibold mt-0.5" style={{ color: "rgba(255,255,255,0.75)" }}>
                {country} supporter
              </p>
            )}
          </div>

          {/* Rank badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <Star size={11} style={{ color: "#FFD700" }} />
            <span className="text-xs font-black text-white">
              {profile?.rank ?? "Supporter"}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* ── Stats row ────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Flame, label: "Flames", value: profile?.supporter_points ?? 0, color: "#EF4444" },
            { icon: MessageCircle, label: "Comments", value: 0, color: "#3B82F6" },
            { icon: Trophy, label: "Points", value: profile?.supporter_points ?? 0, color: "#F59E0B" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="rounded-2xl p-3 text-center"
              style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
            >
              <Icon size={16} style={{ color }} className="mx-auto mb-1" />
              <p className="text-lg font-black text-gray-800">{value}</p>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Locker button ────────────────────────────────────────── */}
        <Link
          href="/locker"
          className="flex items-center gap-3 rounded-2xl px-4 py-3.5 w-full transition-all active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, rgba(168,85,247,0.12), rgba(245,158,11,0.10))",
            border: "1px solid rgba(168,85,247,0.25)",
          }}
        >
          <span className="text-2xl">🎡</span>
          <div className="flex-1">
            <p className="text-sm font-black text-white">Locker</p>
            <p className="text-[10px] font-semibold" style={{ color: "#6B7280" }}>
              Customize your card cosmetics
            </p>
          </div>
          <span className="text-xs font-bold" style={{ color: "#A855F7" }}>Open →</span>
        </Link>

        {/* ── Supporter card ───────────────────────────────────────── */}
        {country && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <div
              className="px-4 py-2.5"
              style={{
                background: `${accentColor}10`,
                borderBottom: `1px solid ${accentColor}20`,
              }}
            >
              <span
                className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: accentColor }}
              >
                My team
              </span>
            </div>
            <div className="px-4 py-4 flex items-center gap-4">
              <span className="text-5xl">{countryInfo.flag}</span>
              <div>
                <p className="text-base font-black text-gray-900">{country}</p>
                <p
                  className="text-xs font-bold mt-0.5"
                  style={{ color: accentColor }}
                >
                  World Cup 2026
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Account info ─────────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
        >
          <div className="px-4 py-2.5 border-b border-gray-50">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Account
            </span>
          </div>
          <div className="px-4 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Email</span>
              <span className="text-xs font-bold text-gray-700 truncate max-w-[200px]">
                {user?.email ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Username</span>
              <span className="text-xs font-bold text-gray-700">
                {profile?.username ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Member since</span>
              <span className="text-xs font-bold text-gray-700">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Challenges (Tiered Achievements) ─────────────────────────────────────────── */}
        {progressStats && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <button
              onClick={() => setExpandedChallenges(!expandedChallenges)}
              className="w-full px-4 py-2.5 border-b border-gray-50 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Challenges
              </span>
              <span
                style={{
                  transform: expandedChallenges ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 200ms ease",
                  display: "inline-block",
                }}
              >
                ▼
              </span>
            </button>
            {expandedChallenges && (
              <div className="px-3 py-3 space-y-2">
              {/* Filter tiered achievements */}
              {ALL_ACHIEVEMENTS.filter((a) => a.tiers && a.tiers.length > 0)
                .sort((a, b) => {
                  const rarityOrder = { easy: 0, medium: 1, hard: 2, secret: 3 };
                  return rarityOrder[a.rarity] - rarityOrder[b.rarity];
                })
                .map((achievement) => {
                  const stats = {
                    postCount: 0,
                    commentCount: 0,
                    voteDayCount: 0,
                    consecutiveActivityDays: progressStats.consecutiveActivityDays,
                    consecutiveVoteDays: 0,
                    nightPostCount: 0,
                    midnightPostCount: 0,
                    hasAroundTheClock: false,
                    hasFastResponse: false,
                    villain_arc_max_comments: 0,
                    djDerksenCommentCount: 0,
                    abuHarbCommentCount: 0,
                    hasScheidrechterComment: false,
                    hasRonJansKeyword: false,
                    hasHutsOrNiffo: false,
                    packsOpenedCount: progressStats.packsOpenedCount,
                    cosmeticsOwnedCount: progressStats.cosmeticsOwnedCount,
                    mascotsOwnedCount: progressStats.mascotsOwnedCount,
                  };

                  const currentTier = getCurrentTierLevel(achievement, stats);

                  // Get next tier threshold and coins
                  let nextTierThreshold = achievement.tiers![0].threshold;
                  let nextTierCoins = achievement.tiers![0].coins;

                  if (currentTier === "bronze" && achievement.tiers!.length > 1) {
                    nextTierThreshold = achievement.tiers![1].threshold;
                    nextTierCoins = achievement.tiers![1].coins;
                  } else if (currentTier === "silver" && achievement.tiers!.length > 2) {
                    nextTierThreshold = achievement.tiers![2].threshold;
                    nextTierCoins = achievement.tiers![2].coins;
                  }

                  // Get current value
                  let currentValue = 0;
                  if (achievement.id === "login_challenge") {
                    currentValue = progressStats.consecutiveActivityDays;
                  } else if (achievement.id === "pack_hunter") {
                    currentValue = progressStats.packsOpenedCount;
                  } else if (achievement.id === "cosmetics_collector") {
                    currentValue = progressStats.cosmeticsOwnedCount;
                  } else if (achievement.id === "mascot_master") {
                    currentValue = progressStats.mascotsOwnedCount;
                  }

                  return (
                    <ProgressAchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      currentTier={currentTier}
                      currentProgress={currentValue}
                      nextTierThreshold={nextTierThreshold}
                      nextTierCoins={nextTierCoins}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Trophy Case ──────────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
        >
          <div className="px-4 py-2.5 border-b border-gray-50">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Trophy Case
            </span>
          </div>
          <div className="px-3 py-3">
            <TrophyCase userAchievements={userAchievements} />
          </div>
        </div>

        {/* ── Admin button (admin user only) ───────────────────────── */}
        {isAdmin && (
          <Link
            href="/admin"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-black transition-all active:scale-[0.98]"
            style={{
              background: "rgba(168,85,247,0.08)",
              border: "1px solid rgba(168,85,247,0.25)",
              color: "#A855F7",
            }}
          >
            <ShieldCheck size={16} />
            Admin Panel
          </Link>
        )}

        {/* ── Sign out ─────────────────────────────────────────────── */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-black transition-all active:scale-[0.98]"
          style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            color: "#DC2626",
          }}
        >
          <LogOut size={16} />
          Sign out
        </button>

        <div className="h-2" />
      </div>
    </div>
  );
}
