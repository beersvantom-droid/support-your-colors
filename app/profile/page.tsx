"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Star, Flame, MessageCircle, Trophy, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAchievements } from "@/components/achievements/AchievementsProvider";
import TrophyCase from "@/components/achievements/TrophyCase";
import { getCountryInfo } from "@/lib/countries";
import { ADMIN_USER_ID } from "@/lib/admin";

export default function ProfilePage() {
  const router = useRouter();
  const { profile, user, loading, signOut } = useAuth();
  const { userAchievements } = useAchievements();
  const isAdmin = user?.id === ADMIN_USER_ID;

  const country = profile?.country ?? null;
  const countryInfo = getCountryInfo(country);
  const accentColor = countryInfo.color;

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
        style={{
          background: `linear-gradient(160deg, ${accentColor} 0%, ${accentColor}cc 100%)`,
        }}
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
