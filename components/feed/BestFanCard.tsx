import { Crown, Flame, TrendingUp } from "lucide-react";
import type { Supporter } from "@/lib/placeholder-data";

interface BestFanCardProps {
  supporter: Supporter;
}

export default function BestFanCard({ supporter }: BestFanCardProps) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${supporter.color} 0%, ${supporter.color}cc 60%, #111827 100%)`,
        boxShadow: `0 8px 32px ${supporter.color}40, 0 2px 8px rgba(0,0,0,0.15)`,
      }}
    >
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "radial-gradient(circle at 70% 50%, white 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />

      {/* Decorative circle */}
      <div
        className="absolute -right-8 -top-8 w-36 h-36 rounded-full"
        style={{ background: "rgba(255,255,255,0.07)" }}
      />
      <div
        className="absolute -right-4 -bottom-6 w-24 h-24 rounded-full"
        style={{ background: "rgba(255,255,255,0.05)" }}
      />

      <div className="relative p-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Crown size={13} className="text-yellow-300" fill="currentColor" />
            <span className="text-[10px] font-black tracking-widest uppercase text-yellow-300">
              Best Fan Today
            </span>
          </div>
          <span className="text-[10px] font-bold text-white/50 tracking-widest uppercase">
            WK 2026
          </span>
        </div>

        {/* Main content */}
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-black border-2 border-white/30"
              style={{ background: "rgba(255,255,255,0.15)", color: "white" }}
            >
              {supporter.initials}
            </div>
            <div className="absolute -bottom-1 -right-1 text-base leading-none">
              {supporter.flag}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xl font-black text-white leading-none">
                {supporter.name}
              </span>
              <span className="text-xs font-semibold text-white/60">
                {supporter.country}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className="text-sm font-black text-white"
                style={{ textShadow: "0 0 20px rgba(255,255,255,0.3)" }}
              >
                {supporter.supporter_points.toLocaleString()} pts
              </span>
              <span className="text-white/40 text-xs">·</span>
              <span className="text-xs font-semibold text-white/70">
                #{supporter.rank} overall
              </span>
            </div>
          </div>

          {/* Rank badge */}
          <div className="flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-white/15 border border-white/20">
            <TrendingUp size={14} className="text-white/70" />
            <span className="text-[10px] font-black text-white leading-none mt-0.5">
              #{supporter.rank}
            </span>
          </div>
        </div>

        {/* Streak bar */}
        {supporter.streak > 0 && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/10">
            <Flame size={13} className="text-orange-300" fill="currentColor" />
            <span className="text-xs font-semibold text-white/80">
              {supporter.streak}-day hot streak
            </span>
            <div className="flex-1 flex items-center gap-0.5 ml-1">
              {Array.from({ length: Math.min(supporter.streak, 7) }).map(
                (_, i) => (
                  <div
                    key={i}
                    className="h-1.5 flex-1 rounded-full"
                    style={{
                      background:
                        i < supporter.streak
                          ? "rgba(255,200,50,0.7)"
                          : "rgba(255,255,255,0.15)",
                    }}
                  />
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
