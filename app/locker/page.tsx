"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LockerScreen from "@/components/locker/LockerScreen";

export default function LockerPage() {
  return (
    <div className="min-h-full flex flex-col" style={{ background: "#050810" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3"
        style={{
          background: "rgba(5,8,16,0.95)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          backdropFilter: "blur(20px)",
        }}
      >
        <Link
          href="/profile"
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <ArrowLeft size={16} color="white" />
        </Link>

        <div>
          <p className="text-sm font-black text-white">Locker</p>
          <p className="text-[10px]" style={{ color: "#4B5563" }}>Customize your card</p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-5">
        <LockerScreen />
      </div>
    </div>
  );
}
