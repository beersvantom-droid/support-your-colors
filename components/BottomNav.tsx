"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, BarChart2, Vote, User } from "lucide-react";


const NAV_ITEMS = [
  { href: "/",            label: "Home",     icon: Home,     activeColor: "#D52B1E" },
  { href: "/bracket",     label: "Bracket",  icon: Trophy,   activeColor: "#1A3A6E" },
  { href: "/leaderboard", label: "Rankings", icon: BarChart2, activeColor: "#D52B1E" },
  { href: "/voting",      label: "Vote",     icon: Vote,     activeColor: "#006847" },
  { href: "/profile",     label: "Profile",  icon: User,     activeColor: "#1A3A6E" },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  // Hidden on login page — no nav chrome during auth flow
  if (pathname === "/login") return null;


  return (
    /* Floating pill nav — fixed to bottom with horizontal padding */
    <nav className="fixed bottom-4 left-0 right-0 z-40 px-4 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <div
          className="flex items-center rounded-2xl px-2 py-2"
          style={{
            background: "rgba(255, 255, 255, 0.88)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
            border: "1px solid rgba(255,255,255,0.6)",
          }}
        >
          {NAV_ITEMS.map(({ href, label, icon: Icon, activeColor }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-all"
                style={{
                  background: isActive ? `${activeColor}14` : "transparent",
                }}
              >
                <Icon
                  size={21}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  style={{ color: isActive ? activeColor : "#9CA3AF" }}
                />
                <span
                  className="text-[10px] font-bold tracking-wide"
                  style={{ color: isActive ? activeColor : "#9CA3AF" }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
