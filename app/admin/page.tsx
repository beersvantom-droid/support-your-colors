"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ADMIN_USER_ID, ADMIN_SESSION_KEY } from "@/lib/admin";
import AdminPasswordGate from "@/components/admin/AdminPasswordGate";
import UsersSection from "@/components/admin/UsersSection";
import PostsSection from "@/components/admin/PostsSection";
import PointsSection from "@/components/admin/PointsSection";
import AchievementsSection from "@/components/admin/AchievementsSection";
import ActivitySection from "@/components/admin/ActivitySection";
import CommentatorSection from "@/components/admin/CommentatorSection";

type Tab = "activity" | "users" | "posts" | "points" | "achievements" | "commentators";

const TABS: { id: Tab; emoji: string; label: string }[] = [
  { id: "activity",     emoji: "📡", label: "Activity" },
  { id: "users",        emoji: "👤", label: "Users" },
  { id: "posts",        emoji: "📸", label: "Posts" },
  { id: "points",       emoji: "⚡", label: "Points" },
  { id: "achievements", emoji: "🏆", label: "Trophies" },
  { id: "commentators", emoji: "🎙️", label: "Commentary" },
];

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [unlocked, setUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("activity");

  // Check session storage for cached unlock
  useEffect(() => {
    if (typeof window !== "undefined" &&
        sessionStorage.getItem(ADMIN_SESSION_KEY) === "true") {
      setUnlocked(true);
    }
  }, []);

  // Redirect non-admin users as soon as auth resolves
  useEffect(() => {
    if (!loading && user?.id !== ADMIN_USER_ID) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div
        className="min-h-full flex items-center justify-center"
        style={{ background: "#0A0F1A" }}
      >
        <div className="text-3xl animate-pulse">⚡</div>
      </div>
    );
  }

  // Render nothing while redirect fires
  if (!user || user.id !== ADMIN_USER_ID) return null;

  function handleUnlock() {
    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    setUnlocked(true);
  }

  return (
    <div className="min-h-full" style={{ background: "#0A0F1A" }}>
      {/* Password gate — renders as overlay until unlocked */}
      {!unlocked && <AdminPasswordGate onUnlock={handleUnlock} />}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3"
        style={{
          background: "#0A0F1A",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <Link
          href="/profile"
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <ArrowLeft size={16} color="white" />
        </Link>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-white leading-none">
            Control Room
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: "#4B5563" }}>
            Support Your Colors — WK 2026
          </p>
        </div>

        <span
          className="text-[10px] font-black px-2.5 py-1 rounded-full flex-shrink-0"
          style={{
            background: "rgba(168,85,247,0.15)",
            color: "#A855F7",
            border: "1px solid rgba(168,85,247,0.25)",
          }}
        >
          🔐 ADMIN
        </span>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <div
        className="sticky z-10 overflow-x-auto px-4 py-2"
        style={{
          top: "52px",
          background: "#0A0F1A",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div className="flex gap-1.5 min-w-max">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all"
              style={{
                background:
                  activeTab === tab.id
                    ? "#A855F7"
                    : "rgba(255,255,255,0.06)",
                color: activeTab === tab.id ? "#FFFFFF" : "#6B7280",
              }}
            >
              <span>{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="px-4 py-4 pb-36">
        {activeTab === "activity"     && <ActivitySection />}
        {activeTab === "users"        && <UsersSection />}
        {activeTab === "posts"        && <PostsSection />}
        {activeTab === "points"       && <PointsSection />}
        {activeTab === "achievements" && <AchievementsSection />}
        {activeTab === "commentators" && <CommentatorSection />}
      </div>
    </div>
  );
}
