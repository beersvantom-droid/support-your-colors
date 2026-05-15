import GroupCard from "@/components/bracket/GroupCard";
import { GROUPS } from "@/lib/wc2026-data";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/supabase";
import type { SupporterMap } from "@/components/bracket/GroupCard";

export const dynamic = "force-dynamic";

async function buildSupporterMap(): Promise<SupporterMap> {
  const [profilesResult, sessionResult] = await Promise.all([
    supabase.from("profiles").select("id, username, country"),
    supabase.auth.getSession(),
  ]);

  const profiles = (profilesResult.data ?? []) as Pick<Profile, "id" | "username" | "country">[];
  const currentUserId = sessionResult.data.session?.user?.id ?? null;

  const map: SupporterMap = {};
  for (const p of profiles) {
    if (p.country) {
      map[p.country] = {
        name: p.username,
        isCurrentUser: p.id === currentUserId,
      };
    }
  }
  return map;
}

function countFriendGroups(supporters: SupporterMap) {
  return GROUPS.filter((g) => g.teams.some((t) => supporters[t])).length;
}

function countDerbies(supporters: SupporterMap) {
  let count = 0;
  for (const group of GROUPS) {
    for (const fixture of group.fixtures) {
      if (supporters[fixture.home] && supporters[fixture.away]) count++;
    }
  }
  return count;
}

export default async function BracketPage() {
  const supporters = await buildSupporterMap();
  const friendGroupCount = countFriendGroups(supporters);
  const derbyCount = countDerbies(supporters);

  return (
    <div className="min-h-full">
      {/* ── Hero banner ──────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, #002868 0%, #1A3A6E 40%, #006847 100%)",
        }}
      >
        <div
          className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-10"
          style={{ background: "#D52B1E" }}
        />
        <div
          className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full opacity-10"
          style={{ background: "#FFD700" }}
        />

        <div className="relative px-4 pt-5 pb-4">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-lg">🍁</span>
            <span className="text-lg">🇺🇸</span>
            <span className="text-lg">🇲🇽</span>
            <span
              className="text-[10px] font-black uppercase tracking-widest ml-1"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Canada · USA · Mexico
            </span>
          </div>

          <h1 className="text-2xl font-black text-white leading-tight">
            FIFA World Cup
          </h1>
          <p
            className="text-4xl font-black leading-none"
            style={{
              background: "linear-gradient(90deg, #FFFFFF, #FFD700)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            2026™
          </p>

          <div className="flex items-center gap-2 mt-2 mb-4">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[11px] font-bold text-white">
                Jun 11 – Jul 19, 2026
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div
              className="px-3 py-1.5 rounded-xl text-center"
              style={{ background: "rgba(255,255,255,0.12)" }}
            >
              <div className="text-white font-black text-base leading-none">48</div>
              <div
                className="text-[9px] font-semibold mt-0.5"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Teams
              </div>
            </div>
            <div
              className="px-3 py-1.5 rounded-xl text-center"
              style={{ background: "rgba(255,255,255,0.12)" }}
            >
              <div className="text-white font-black text-base leading-none">12</div>
              <div
                className="text-[9px] font-semibold mt-0.5"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Groups
              </div>
            </div>
            <div
              className="px-3 py-1.5 rounded-xl text-center"
              style={{ background: "rgba(255,255,255,0.12)" }}
            >
              <div className="text-white font-black text-base leading-none">
                {friendGroupCount}
              </div>
              <div
                className="text-[9px] font-semibold mt-0.5"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Friend groups
              </div>
            </div>
            <div
              className="px-3 py-1.5 rounded-xl text-center"
              style={{
                background: "rgba(245,158,11,0.25)",
                border: "1px solid rgba(245,158,11,0.4)",
              }}
            >
              <div
                className="font-black text-base leading-none"
                style={{ color: "#FCD34D" }}
              >
                {derbyCount}
              </div>
              <div
                className="text-[9px] font-semibold mt-0.5"
                style={{ color: "rgba(252,211,77,0.7)" }}
              >
                Derbies ⚡
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Phase navigation bar ─────────────────────────────────────── */}
      <div
        className="sticky top-0 z-20 flex items-center gap-2 px-4 py-2.5 overflow-x-auto"
        style={{
          background: "rgba(240,242,245,0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        {[
          { label: "Groups", active: true },
          { label: "R32", active: false },
          { label: "R16", active: false },
          { label: "QF", active: false },
          { label: "SF", active: false },
          { label: "Final", active: false },
        ].map(({ label, active }) => (
          <div
            key={label}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-black"
            style={{
              background: active ? "#D52B1E" : "rgba(0,0,0,0.05)",
              color: active ? "#FFFFFF" : "rgba(0,0,0,0.25)",
              cursor: active ? "default" : "not-allowed",
            }}
          >
            {label}
          </div>
        ))}

        <div className="flex-shrink-0 ml-auto text-[10px] font-bold text-text-muted whitespace-nowrap">
          Jun 11 – 27
        </div>
      </div>

      {/* ── Group overview ───────────────────────────────────────────── */}
      <div className="px-4 py-4 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-sm font-black text-text-primary uppercase tracking-widest">
              Group Stage
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Tap a group to see fixtures &amp; standings
            </p>
          </div>
          <div
            className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide"
            style={{ background: "#D52B1E18", color: "#D52B1E" }}
          >
            Upcoming
          </div>
        </div>

        {GROUPS.map((group) => (
          <GroupCard key={group.id} group={group} supporters={supporters} />
        ))}

        <div className="h-4" />
      </div>
    </div>
  );
}
