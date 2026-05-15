import type { TrendingItem } from "@/lib/placeholder-data";

interface TrendingBarProps {
  items: TrendingItem[];
}

export default function TrendingBar({ items }: TrendingBarProps) {
  return (
    <div>
      <div className="px-4 mb-2 flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-widest text-text-muted">
          Trending now
        </span>
        <span className="text-[10px] font-semibold text-text-muted">
          See all
        </span>
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-2 px-4 overflow-x-auto scrollbar-none pb-0.5">
        {items.map((item, i) => (
          <button
            key={i}
            className="flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap transition-all active:scale-95"
            style={{
              borderColor: `${item.color}30`,
              background: `${item.color}0d`,
              color: item.color,
            }}
          >
            <span>{item.emoji}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
