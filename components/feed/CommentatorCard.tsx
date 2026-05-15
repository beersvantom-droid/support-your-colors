import type { CommentatorPost } from "@/lib/supabase";
import { COMMENTATORS } from "@/lib/commentators";

function timeAgoSimple(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface Props {
  post: CommentatorPost;
  avatarUrl?: string | null;
}

export default function CommentatorCard({ post, avatarUrl }: Props) {
  const cfg = COMMENTATORS[post.commentator_id];

  return (
    <article
      className="rounded-2xl overflow-hidden"
      style={{
        background: cfg.bgColor,
        border: `1px solid ${cfg.borderColor}`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-4 py-3"
        style={{ borderBottom: `1px solid ${cfg.borderColor}` }}
      >
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 overflow-hidden"
          style={{
            background: `${cfg.accentColor}18`,
            border: `1.5px solid ${cfg.accentColor}35`,
          }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={cfg.name}
              className="w-full h-full object-cover"
            />
          ) : (
            cfg.emoji
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-black leading-tight truncate"
            style={{ color: cfg.accentColor }}
          >
            {cfg.name}
          </p>
          <p
            className="text-[10px] font-bold uppercase tracking-wide"
            style={{ color: `${cfg.accentColor}80` }}
          >
            {cfg.tagline}
          </p>
        </div>

        <span
          className="text-[9px] font-black px-2 py-1 rounded-full flex-shrink-0 tracking-wider"
          style={{
            background: `${cfg.accentColor}18`,
            color: cfg.accentColor,
          }}
        >
          {cfg.badgeText}
        </span>
      </div>

      {/* Message */}
      <div className="px-4 py-3.5">
        <p
          className="text-sm font-bold leading-relaxed text-gray-800"
          style={{ whiteSpace: "pre-line" }}
        >
          {post.message}
        </p>
      </div>

      {/* Footer */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-gray-400">
          {timeAgoSimple(post.created_at)}
        </span>
        <span
          className="text-[9px] font-black tracking-wider"
          style={{ color: `${cfg.accentColor}70` }}
        >
          📡 LIVE
        </span>
      </div>
    </article>
  );
}
