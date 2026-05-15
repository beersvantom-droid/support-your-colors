import Link from "next/link";
import { Plus } from "lucide-react";
import type { Supporter } from "@/lib/placeholder-data";

interface StoriesRowProps {
  supporters: Supporter[];
}

export default function StoriesRow({ supporters }: StoriesRowProps) {
  return (
    <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-none">
      {/* Add story button */}
      <Link href="/create-post" className="flex flex-col items-center gap-1 flex-none">
        <div className="w-14 h-14 rounded-full border-2 border-dashed border-text-muted flex items-center justify-center bg-surface">
          <Plus size={20} className="text-text-muted" strokeWidth={2} />
        </div>
        <span className="text-[10px] font-semibold text-text-muted text-center w-14 truncate">
          Your post
        </span>
      </Link>

      {/* Supporter stories */}
      {supporters.map((s) => (
        <button key={s.id} className="flex flex-col items-center gap-1 flex-none">
          {/* Avatar with colored ring */}
          <div
            className="w-14 h-14 rounded-full p-[2px]"
            style={{
              background: `linear-gradient(135deg, ${s.color}, ${s.color}88)`,
            }}
          >
            <div
              className="w-full h-full rounded-full flex items-center justify-center text-sm font-black border-2 border-white"
              style={{
                background: `${s.color}20`,
                color: s.color,
              }}
            >
              {s.initials}
            </div>
          </div>
          {/* Name */}
          <span className="text-[10px] font-semibold text-text-secondary text-center w-14 truncate">
            {s.name}
          </span>
          {/* Flag */}
          <span className="text-[10px] leading-none -mt-1">{s.flag}</span>
        </button>
      ))}
    </div>
  );
}
