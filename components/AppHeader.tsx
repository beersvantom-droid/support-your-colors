import { Bell, Camera } from "lucide-react";
import Link from "next/link";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-30 w-full max-w-md mx-auto">
      <div className="bg-white/80 backdrop-blur-xl border-b border-black/5 px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#D52B1E] via-[#1A3A6E] to-[#006847] flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-black">⚽</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[13px] font-black tracking-tight text-text-primary">
              Support Your Colors
            </span>
            <span className="text-[10px] font-semibold text-text-muted tracking-widest uppercase">
              WK 2026
            </span>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Live badge */}
          <div className="flex items-center gap-1 bg-[#D52B1E]/10 rounded-full px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D52B1E] animate-pulse" />
            <span className="text-[10px] font-bold tracking-wide text-[#D52B1E]">
              LIVE
            </span>
          </div>

          {/* Quick post button */}
          <Link
            href="/create-post"
            className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90"
            style={{
              background: "linear-gradient(135deg, #D52B1E, #b01f15)",
              boxShadow: "0 2px 8px rgba(213,43,30,0.35)",
            }}
          >
            <Camera size={15} className="text-white" strokeWidth={2.5} />
          </Link>

          {/* Notifications */}
          <button className="relative w-8 h-8 flex items-center justify-center rounded-full bg-muted">
            <Bell size={16} className="text-text-secondary" strokeWidth={2} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#D52B1E] border border-white" />
          </button>
        </div>
      </div>
    </header>
  );
}
