import { MessageCircle } from "lucide-react";
import type { Comment } from "@/lib/supabase";
import { getCountryInfo, timeAgo } from "@/lib/countries";

interface CommentsSectionProps {
  comments: Comment[];
}

export default function CommentsSection({ comments }: CommentsSectionProps) {
  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 px-4 text-center">
        <MessageCircle size={24} className="text-text-muted" />
        <p className="text-xs text-text-muted">No comments yet</p>
        <p className="text-xs text-text-muted">Be the first to comment</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 py-4 px-4">
      {comments.map((comment) => {
        const country = getCountryInfo(comment.country);
        const time = timeAgo(comment.created_at);

        return (
          <div key={comment.id} className="flex gap-3">
            {/* Country flag */}
            <div className="text-sm mt-0.5 flex-shrink-0">{country.flag}</div>

            {/* Comment content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm font-bold text-text-primary">
                  {comment.username}
                </span>
                <span className="text-xs text-text-muted">·</span>
                <span className="text-xs text-text-muted">{time}</span>
              </div>
              <p className="text-sm text-text-primary leading-relaxed break-words">
                {comment.comment_text}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
