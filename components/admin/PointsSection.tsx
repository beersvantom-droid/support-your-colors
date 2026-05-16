"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getCountryFlag } from "@/lib/countries";
import type { Profile } from "@/lib/supabase";

interface PendingPoints {
  supporter_points: number;
  tournament_points: number;
}

export default function PointsSection() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, PendingPoints>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .order("supporter_points", { ascending: false })
      .then(({ data }) => {
        setProfiles((data as Profile[]) ?? []);
        setLoading(false);
      });
  }, []);

  function getPoints(p: Profile): PendingPoints {
    return (
      pending[p.id] ?? {
        supporter_points: p.supporter_points,
        tournament_points: p.tournament_points,
      }
    );
  }

  function adjust(
    profile: Profile,
    type: keyof PendingPoints,
    delta: number
  ) {
    const current = getPoints(profile);
    setPending((prev) => ({
      ...prev,
      [profile.id]: {
        ...current,
        [type]: Math.max(0, current[type] + delta),
      },
    }));
  }

  async function save(profile: Profile) {
    const pts = getPoints(profile);
    setSaving(profile.id);
    setSaveError(null);

    try {
      const res = await fetch("/api/admin/set-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId:          profile.id,
          supporterPoints:   pts.supporter_points,
          tournamentPoints:  pts.tournament_points,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Save failed");
      }

      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profile.id
            ? { ...p, supporter_points: pts.supporter_points, tournament_points: pts.tournament_points }
            : p
        )
      );
      setPending((prev) => {
        const next = { ...prev };
        delete next[profile.id];
        return next;
      });
      setSaved(profile.id);
      setTimeout(() => setSaved((s) => (s === profile.id ? null : s)), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-14 rounded-2xl animate-pulse"
            style={{ background: "rgba(255,255,255,0.04)" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p
        className="text-[10px] font-black uppercase tracking-widest mb-3"
        style={{ color: "#6B7280" }}
      >
        Adjust user points
      </p>

      {profiles.map((profile) => {
        const countryFlag = getCountryFlag(profile.country);
        const isOpen = expanded === profile.id;
        const pts = getPoints(profile);
        const isDirty = !!pending[profile.id];

        return (
          <div
            key={profile.id}
            className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${isDirty ? "rgba(168,85,247,0.4)" : "rgba(255,255,255,0.06)"}`,
              transition: "border-color 200ms",
            }}
          >
            <button
              className="w-full flex items-center gap-3 px-3 py-3 text-left"
              onClick={() => setExpanded(isOpen ? null : profile.id)}
            >
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                {countryFlag}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white">{profile.username}</p>
              </div>

              <div className="text-right flex-shrink-0 mr-1">
                <p
                  className="text-xs font-black"
                  style={{ color: isDirty ? "#A855F7" : "#F59E0B" }}
                >
                  {pts.supporter_points} SP
                </p>
                <p className="text-[10px]" style={{ color: "#3B82F6" }}>
                  {pts.tournament_points} TP
                </p>
              </div>

              {isOpen ? (
                <ChevronUp size={14} color="#4B5563" />
              ) : (
                <ChevronDown size={14} color="#4B5563" />
              )}
            </button>

            {isOpen && (
              <div
                className="px-3 pb-3 space-y-3"
                style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
              >
                <PointRow
                  label="Supporter Points"
                  value={pts.supporter_points}
                  color="#F59E0B"
                  onAdjust={(delta) => adjust(profile, "supporter_points", delta)}
                />
                <PointRow
                  label="Tournament Points"
                  value={pts.tournament_points}
                  color="#3B82F6"
                  onAdjust={(delta) => adjust(profile, "tournament_points", delta)}
                />

                {isDirty && (
                  <button
                    onClick={() => save(profile)}
                    disabled={saving === profile.id}
                    className="w-full py-2.5 rounded-xl text-xs font-black text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    style={{ background: "linear-gradient(135deg, #A855F7, #7C3AED)" }}
                  >
                    {saving === profile.id ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        Saving…
                      </>
                    ) : saved === profile.id ? (
                      <>
                        <Check size={12} />
                        Saved!
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                )}
                {saveError && (
                  <p className="text-[10px] font-semibold" style={{ color: "#EF4444" }}>
                    ⚠️ {saveError}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PointRow({
  label,
  value,
  color,
  onAdjust,
}: {
  label: string;
  value: number;
  color: string;
  onAdjust: (delta: number) => void;
}) {
  return (
    <div className="pt-2.5">
      <p
        className="text-[10px] font-black uppercase tracking-widest mb-2"
        style={{ color }}
      >
        {label} — {value}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {([-500, -100, -50, +50, +100, +500] as const).map((delta) => (
          <button
            key={delta}
            onClick={() => onAdjust(delta)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95"
            style={{
              background:
                delta > 0 ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
              color: delta > 0 ? "#10B981" : "#EF4444",
            }}
          >
            {delta > 0 ? "+" : ""}
            {delta}
          </button>
        ))}
      </div>
    </div>
  );
}
