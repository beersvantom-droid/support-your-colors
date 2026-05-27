"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAchievements } from "@/components/achievements/AchievementsProvider";
import { maybeFireCommentary } from "@/lib/commentator-engine";
import { getTitleByRank } from "@/lib/leaderboard-titles";
import { getCountryFlag, getCountryInfo } from "@/lib/countries";
import { getVotingDay } from "@/lib/voting";
import { Zap, RefreshCw } from "lucide-react";
import type { Profile, DailyVote } from "@/lib/supabase";

const ACCENT = "#006847";

const MEDAL_CONFIG = [
  {
    emoji: "🥇",
    label: "#1",
    award: 500,
    color: "#B8860B",
    bg: "rgba(255,215,0,0.07)",
    border: "#FFD700",
    glow: "rgba(255,215,0,0.30)",
  },
  {
    emoji: "🥈",
    label: "#2",
    award: 300,
    color: "#707070",
    bg: "rgba(192,192,192,0.07)",
    border: "#B0B0B0",
    glow: "rgba(192,192,192,0.30)",
  },
  {
    emoji: "🥉",
    label: "#3",
    award: 150,
    color: "#8B5E1A",
    bg: "rgba(205,127,50,0.07)",
    border: "#CD7F32",
    glow: "rgba(205,127,50,0.30)",
  },
] as const;

export default function VotingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { triggerCheck } = useAchievements();

  const [supporters, setSupporters] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [picks, setPicks] = useState<Array<Profile | null>>([null, null, null]);
  const [todayVote, setTodayVote] = useState<DailyVote | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const today = getVotingDay();
  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  function resetAndReload() {
    setLoading(true);
    setLoadError(null);
    setPicks([null, null, null]);
    setTodayVote(null);
    setSubmitError(null);
  }

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    async function load() {
      setLoadError(null);

      // ── Step 1: load all profiles (public read, no auth needed) ──────────
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("supporter_points", { ascending: false });

      if (cancelled) return;

      if (profilesError) {
        setLoadError(`Could not load supporters: ${profilesError.message}`);
        setLoading(false);
        return;
      }

      const all = (profilesData as Profile[]) ?? [];
      // Filter out the logged-in user so they can't vote for themselves
      setSupporters(all.filter((p) => p.id !== user?.id));

      // ── Step 2: check if user already voted today ────────────────────────
      if (user) {
        const { data: voteData, error: voteError } = await supabase
          .from("daily_votes")
          .select("*")
          .eq("voter_id", user.id)
          .eq("vote_date", today)
          .maybeSingle();

        if (cancelled) return;

        // Ignore table-not-found (42P01) — table just hasn't been created yet
        if (!voteError && voteData) {
          setTodayVote(voteData as DailyVote);
        }
      }

      setLoading(false);
    }

    // Safety net: always clear loading even if load() throws unexpectedly
    load().catch((err) => {
      if (!cancelled) {
        console.error("[VotingPage] Unexpected load error:", err);
        setLoadError("Something went wrong loading the page. Tap to retry.");
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, today]);

  function handleCardTap(supporter: Profile) {
    const existingIdx = picks.findIndex((p) => p?.id === supporter.id);

    if (existingIdx !== -1) {
      // Deselect: remove and compact remaining picks
      const remaining = picks.filter((_, i) => i !== existingIdx);
      setPicks([remaining[0] ?? null, remaining[1] ?? null, null]);
      return;
    }

    const emptyIdx = picks.findIndex((p) => p === null);
    if (emptyIdx === -1) return; // All 3 slots filled

    const next = [...picks];
    next[emptyIdx] = supporter;
    setPicks(next);
  }

  async function handleSubmit() {
    const first = picks[0];
    const second = picks[1];
    const third = picks[2];
    if (!user || !first || !second || !third) return;

    setSubmitting(true);
    setSubmitError(null);

    // ── Insert the vote record ───────────────────────────────────────────────
    const { error: insertError } = await supabase.from("daily_votes").insert({
      voter_id: user.id,
      vote_date: today,
      first_pick: first.id,
      second_pick: second.id,
      third_pick: third.id,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        setSubmitError("You've already voted today!");
      } else if (insertError.code === "42P01") {
        setSubmitError(
          "Voting table missing. Run the Supabase SQL setup first."
        );
      } else {
        setSubmitError(insertError.message);
      }
      setSubmitting(false);
      return;
    }

    // ── Award points via DB function ─────────────────────────────────────────
    const [r1, r2, r3] = await Promise.allSettled([
      supabase.rpc("increment_supporter_points", { user_id: first.id, amount: 500 }),
      supabase.rpc("increment_supporter_points", { user_id: second.id, amount: 300 }),
      supabase.rpc("increment_supporter_points", { user_id: third.id, amount: 150 }),
    ]);

    // Surface RPC errors so they're visible during testing
    const rpcError =
      (r1.status === "fulfilled" && r1.value.error) ||
      (r2.status === "fulfilled" && r2.value.error) ||
      (r3.status === "fulfilled" && r3.value.error);

    if (rpcError) {
      // Vote is recorded but points couldn't be awarded —
      // still show success, but flag it so the user knows
      setSubmitError(
        `Vote saved! But points failed: ${rpcError.message} — run the Supabase SQL setup.`
      );
    }

    triggerCheck();
    // Fire commentary in background — don't block
    maybeFireCommentary({ triggeredBy: "vote" }).catch(() => {});

    // Transition to voted state
    setTodayVote({
      id: "",
      voter_id: user.id,
      vote_date: today,
      first_pick: first.id,
      second_pick: second.id,
      third_pick: third.id,
      created_at: new Date().toISOString(),
    });

    setSubmitting(false);
  }

  const filledCount = picks.filter((p) => p !== null).length;
  const allPicked = filledCount === 3;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading || authLoading) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ backgroundImage: "url('/chat/achtergrond-chat.png')", backgroundSize: "cover", backgroundAttachment: "fixed" }}>
        <div style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", borderRadius: "20px", padding: "24px", textAlign: "center" }}>
          <div className="text-3xl mb-2">⚽</div>
          <p className="text-sm font-semibold" style={{ color: "#9CA3AF" }}>
            Loading vote…
          </p>
        </div>
      </div>
    );
  }

  // ── Load error ─────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="min-h-full pb-24" style={{ backgroundImage: "url('/chat/achtergrond-chat.png')", backgroundSize: "cover", backgroundAttachment: "fixed", backgroundColor: "#F0F2F5" }}>
        <PageHeader title="Vote" subtitle={dateLabel} accentColor={ACCENT} />
        <div className="px-4">
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <p className="text-3xl mb-3">⚠️</p>
            <p className="text-sm font-black text-gray-900 mb-1">
              Could not load voting page
            </p>
            <p
              className="text-xs font-semibold mb-4"
              style={{ color: "#9CA3AF" }}
            >
              {loadError}
            </p>
            <button
              onClick={() => {
                resetAndReload();
              }}
              className="flex items-center gap-2 mx-auto px-4 py-2 rounded-full text-xs font-black text-white"
              style={{ background: ACCENT }}
            >
              <RefreshCw size={12} />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Not signed in ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-full pb-24" style={{ backgroundImage: "url('/chat/achtergrond-chat.png')", backgroundSize: "cover", backgroundAttachment: "fixed", backgroundColor: "#F0F2F5" }}>
        <PageHeader title="Vote" subtitle={dateLabel} accentColor={ACCENT} />
        <div className="px-4 space-y-3">
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <p className="text-4xl mb-3">🔒</p>
            <p className="text-sm font-black text-gray-900 mb-1">
              Sign in to vote
            </p>
            <p
              className="text-xs font-semibold mb-4"
              style={{ color: "#9CA3AF" }}
            >
              You need an account to pick your top 3 supporters
            </p>
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-2.5 rounded-full text-sm font-black text-white"
              style={{ background: ACCENT }}
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Already voted ──────────────────────────────────────────────────────────
  if (todayVote) {
    const votedProfiles = [
      supporters.find((s) => s.id === todayVote.first_pick) ?? null,
      supporters.find((s) => s.id === todayVote.second_pick) ?? null,
      supporters.find((s) => s.id === todayVote.third_pick) ?? null,
    ];

    return (
      <div className="min-h-full pb-24" style={{ backgroundImage: "url('/chat/achtergrond-chat.png')", backgroundSize: "cover", backgroundAttachment: "fixed", backgroundColor: "#F0F2F5" }}>
        <PageHeader title="Vote" subtitle={dateLabel} accentColor={ACCENT} />

        <div className="px-4 space-y-4">
          {/* Success hero */}
          <div
            className="rounded-3xl p-6 text-center"
            style={{
              background: "linear-gradient(135deg, #006847 0%, #00A36C 100%)",
              boxShadow: "0 8px 32px rgba(0,104,71,0.3)",
            }}
          >
            <div className="text-4xl mb-3">✅</div>
            <h2 className="text-xl font-black text-white mb-1">
              You voted today!
            </h2>
            <p
              className="text-sm font-semibold"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Your picks are powering the leaderboard
            </p>
          </div>

          {/* RPC warning if points failed */}
          {submitError && (
            <div
              className="rounded-2xl p-3"
              style={{
                background: "#FEF3C7",
                border: "1px solid #FCD34D",
              }}
            >
              <p className="text-xs font-semibold text-amber-800">
                {submitError}
              </p>
            </div>
          )}

          <p
            className="text-xs font-black uppercase tracking-widest px-1"
            style={{ color: "#9CA3AF" }}
          >
            Your picks today
          </p>

          {votedProfiles.map((pick, i) => {
            const medal = MEDAL_CONFIG[i];
            return (
              <div
                key={i}
                className="rounded-2xl p-4 flex items-center gap-3"
                style={{
                  background: "#FFFFFF",
                  border: `2px solid ${medal.border}`,
                  boxShadow: `0 4px 20px ${medal.glow}`,
                }}
              >
                <span className="text-2xl flex-shrink-0">{medal.emoji}</span>
                <span className="text-2xl flex-shrink-0">
                  {getCountryFlag(pick?.country)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-900 truncate">
                    {pick?.username ?? "—"}
                  </p>
                  <p
                    className="text-xs font-semibold"
                    style={{ color: medal.color }}
                  >
                    +{medal.award} pts awarded
                  </p>
                </div>
              </div>
            );
          })}

          <div
            className="rounded-2xl p-4 text-center"
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <p className="text-xs font-semibold" style={{ color: "#9CA3AF" }}>
              Next vote opens at 05:00 Amsterdam time
            </p>
            <p className="text-sm font-black mt-0.5" style={{ color: ACCENT }}>
              Come back tomorrow ⚽
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── No supporters found ────────────────────────────────────────────────────
  if (supporters.length === 0) {
    return (
      <div className="min-h-full pb-24" style={{ backgroundImage: "url('/chat/achtergrond-chat.png')", backgroundSize: "cover", backgroundAttachment: "fixed", backgroundColor: "#F0F2F5" }}>
        <PageHeader title="Vote" subtitle={dateLabel} accentColor={ACCENT} />
        <div className="px-4">
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <p className="text-3xl mb-3">👥</p>
            <p className="text-sm font-black text-gray-900 mb-1">
              No other supporters yet
            </p>
            <p
              className="text-xs font-semibold"
              style={{ color: "#9CA3AF" }}
            >
              Invite your friends to join so you can vote for them
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Main voting UI ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-full pb-56" style={{ backgroundImage: "url('/chat/achtergrond-chat.png')", backgroundSize: "cover", backgroundAttachment: "fixed", backgroundColor: "#F0F2F5" }}>
      <PageHeader
        title="Vote"
        subtitle="Choose your top 3 supporters"
        accentColor={ACCENT}
      />

      <div className="px-4 space-y-5">
        {/* Status bar */}
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl relative overflow-hidden"
          style={{
            background: `linear-gradient(90deg, ${ACCENT} 0%, #1E5A96 50%, #C1272D 100%)`,
            boxShadow: "0 4px 16px rgba(0,104,71,0.25)",
          }}
        >
          <Zap size={13} color="white" fill="white" />
          <p className="text-xs font-black text-white tracking-wide">
            VOTING OPEN · {dateLabel.toUpperCase()}
          </p>
          <div
            className="ml-auto w-2 h-2 rounded-full"
            style={{ background: "#4ADE80", boxShadow: "0 0 6px #4ADE80" }}
          />
        </div>

        {/* Selection slots */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div style={{ flex: 1, height: "2px", background: "linear-gradient(90deg, #006847 0%, transparent 100%)" }} />
            <p
              className="text-xs font-black uppercase tracking-widest"
              style={{ color: "#9CA3AF" }}
            >
              Your picks
            </p>
            <div style={{ flex: 1, height: "2px", background: "linear-gradient(90deg, transparent 0%, #C1272D 100%)" }} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {MEDAL_CONFIG.map((medal, i) => {
              const pick = picks[i];
              const accentColors = ["#006847", "#1E5A96", "#C1272D"]; // groen, blauw, rood
              const accentColor = accentColors[i];
              return (
                <div
                  key={i}
                  className="rounded-2xl p-3 text-center transition-all"
                  style={{
                    background: pick ? medal.bg : "rgba(255,255,255,0.7)",
                    border: `2px solid ${pick ? medal.border : "rgba(0,0,0,0.08)"}`,
                    borderLeft: `4px solid ${pick ? medal.border : accentColor}40`,
                    boxShadow: pick ? `0 4px 16px ${medal.glow}` : `0 0 12px ${accentColor}15`,
                    backdropFilter: pick ? "none" : "blur(8px)",
                    minHeight: "84px",
                  }}
                >
                  <p className="text-lg leading-none mb-1">{medal.emoji}</p>
                  {pick ? (
                    <>
                      <p className="text-xl leading-none">
                        {getCountryFlag(pick.country)}
                      </p>
                      <p className="text-[10px] font-black text-gray-700 truncate mt-1 leading-none">
                        {pick.username}
                      </p>
                    </>
                  ) : (
                    <p
                      className="text-[10px] font-semibold mt-1"
                      style={{ color: "#D1D5DB" }}
                    >
                      Pick {medal.label}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Supporter list */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div style={{ flex: 1, height: "2px", background: "linear-gradient(90deg, #1E5A96 0%, transparent 100%)" }} />
            <p
              className="text-xs font-black uppercase tracking-widest"
              style={{ color: "#9CA3AF" }}
            >
              {supporters.length} supporter{supporters.length !== 1 ? "s" : ""} · tap
            </p>
            <div style={{ flex: 1, height: "2px", background: "linear-gradient(90deg, transparent 0%, #006847 100%)" }} />
          </div>

          <div className="space-y-2">
            {supporters.map((supporter, index) => {
              const pickSlot = picks.findIndex((p) => p?.id === supporter.id);
              const isSelected = pickSlot !== -1;
              const medal = isSelected ? MEDAL_CONFIG[pickSlot] : null;
              const supporterFlag = getCountryFlag(supporter.country);
              const supporterColor = getCountryInfo(supporter.country).color;
              const titleData = getTitleByRank(index + 1);
              const isDisabled = !isSelected && filledCount === 3;

              return (
                <button
                  key={supporter.id}
                  onClick={() => handleCardTap(supporter)}
                  disabled={isDisabled}
                  className="w-full text-left rounded-2xl p-3 transition-all active:scale-[0.97]"
                  style={{
                    background: isSelected
                      ? medal!.bg
                      : isDisabled
                      ? "#FAFAFA"
                      : "#FFFFFF",
                    border: `2px solid ${
                      isSelected ? medal!.border : supporterColor + "20"
                    }`,
                    borderLeft: `4px solid ${
                      isSelected ? medal!.border : supporterColor + "60"
                    }`,
                    boxShadow: isSelected
                      ? `0 4px 20px ${medal!.glow}`
                      : "0 1px 4px rgba(0,0,0,0.04)",
                    opacity: isDisabled ? 0.45 : 1,
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank badge */}
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0"
                      style={{
                        background:
                          index === 0
                            ? "#FFD700"
                            : index === 1
                            ? "#C0C0C0"
                            : index === 2
                            ? "#CD7F32"
                            : "#F3F4F6",
                        color: index < 3 ? "white" : "#6B7280",
                      }}
                    >
                      {index + 1}
                    </div>

                    {/* Flag */}
                    <span className="text-2xl flex-shrink-0">
                      {supporterFlag}
                    </span>

                    {/* Name & title */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-gray-900 truncate">
                        {supporter.username}
                      </p>
                      <p
                        className="text-[11px] font-semibold truncate"
                        style={{ color: "#9CA3AF" }}
                      >
                        {titleData.emoji} {titleData.title}
                      </p>
                    </div>

                    {/* Points or selection badge */}
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <div
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black text-white"
                          style={{ background: medal!.border }}
                        >
                          <span>{medal!.emoji}</span>
                          <span>{medal!.label}</span>
                        </div>
                      ) : (
                        <div className="text-right">
                          <p
                            className="text-sm font-black"
                            style={{ color: "#1F2937" }}
                          >
                            {supporter.supporter_points ?? 0}
                          </p>
                          <p
                            className="text-[10px] font-semibold"
                            style={{ color: "#9CA3AF" }}
                          >
                            pts
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Fixed submit footer — sits above the BottomNav (bottom-4 + ~60px pill = ~76px) */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 pt-8"
        style={{
          background:
            "linear-gradient(to top, rgba(240,242,245,1) 55%, rgba(240,242,245,0))",
          paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {submitError && (
          <p
            className="text-xs font-semibold text-center mb-2"
            style={{ color: "#DC2626" }}
          >
            {submitError}
          </p>
        )}
        <button
          onClick={handleSubmit}
          disabled={!allPicked || submitting}
          className="w-full py-4 rounded-2xl text-base font-black tracking-wide transition-all active:scale-[0.98]"
          style={{
            background: allPicked
              ? "linear-gradient(135deg, #006847 0%, #00A36C 100%)"
              : "#E5E7EB",
            color: allPicked ? "#FFFFFF" : "#9CA3AF",
            boxShadow: allPicked ? "0 8px 24px rgba(0,104,71,0.35)" : "none",
          }}
        >
          {submitting
            ? "Submitting…"
            : allPicked
            ? "Submit My Votes ⚡"
            : `Select ${3 - filledCount} more supporter${3 - filledCount !== 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}
