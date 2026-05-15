import { Flame, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import type { FeedPost } from "@/lib/placeholder-data";

interface FeedPostProps {
  post: FeedPost;
}

export default function FeedPost({ post }: FeedPostProps) {
  const { supporter: s, time, caption, imageColors, fires, laughs, comments, topComment } = post;

  return (
    <article className="bg-surface rounded-2xl overflow-hidden shadow-sm border border-black/5">
      {/* Post header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black border-2"
            style={{
              background: `${s.color}18`,
              color: s.color,
              borderColor: `${s.color}40`,
            }}
          >
            {s.initials}
          </div>
          {/* Name + meta */}
          <div className="flex flex-col leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-text-primary">
                {s.name}
              </span>
              <span className="text-sm leading-none">{s.flag}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-text-muted">{s.username}</span>
              <span className="text-text-muted text-xs">·</span>
              <span className="text-xs text-text-muted">{time}</span>
            </div>
          </div>
        </div>
        <button className="w-7 h-7 flex items-center justify-center rounded-full">
          <MoreHorizontal size={16} className="text-text-muted" />
        </button>
      </div>

      {/* Caption (above image, like Twitter/X style) */}
      <div className="px-4 pb-3">
        <p className="text-sm text-text-primary leading-relaxed font-medium">
          {caption}
        </p>
      </div>

      {/* Image placeholder — dark gradient with pitch texture */}
      <div
        className="w-full relative overflow-hidden"
        style={{
          aspectRatio: "4/3",
          background: `linear-gradient(145deg, ${imageColors[0]} 0%, ${imageColors[1]} 100%)`,
        }}
      >
        {/* Pitch grid lines */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
        {/* Center circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-white/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/20" />
        {/* Half-line */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/05" />
        {/* Faded flag watermark */}
        <div className="absolute bottom-4 right-4 text-6xl leading-none select-none pointer-events-none"
          style={{ opacity: 0.15 }}
        >
          {s.flag}
        </div>
      </div>

      {/* Interaction row */}
      <div className="flex items-center gap-1 px-4 py-3">
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95"
          style={{
            background: fires >= 10 ? "#D52B1E15" : "transparent",
            color: fires >= 10 ? "#D52B1E" : "#6B7280",
          }}
        >
          <Flame size={15} fill={fires >= 10 ? "currentColor" : "none"} />
          {fires}
        </button>

        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-text-secondary transition-all active:scale-95">
          <span className="text-sm leading-none">😂</span>
          {laughs}
        </button>

        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-text-secondary transition-all active:scale-95">
          <MessageCircle size={15} />
          {comments}
        </button>

        <div className="flex-1" />

        <button className="w-8 h-8 flex items-center justify-center rounded-full text-text-muted transition-all active:scale-95">
          <Share2 size={14} />
        </button>
      </div>

      {/* Top comment preview */}
      <div className="px-4 pb-4 border-t border-border">
        <div className="pt-3 flex gap-2">
          <span className="text-xs font-black text-text-primary">
            {topComment.name}
          </span>
          <span className="text-xs text-text-secondary flex-1 leading-snug">
            {topComment.text}
          </span>
        </div>
        <button className="mt-1.5 text-xs text-text-muted font-semibold">
          View all {comments} comments
        </button>
      </div>
    </article>
  );
}
