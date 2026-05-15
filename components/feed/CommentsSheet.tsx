"use client";

import { useEffect, useState } from "react";
import { X, Send, Loader2 } from "lucide-react";
import type { Post, Comment } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import CommentsSection from "./CommentsSection";

interface CommentsSheetProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
}

export default function CommentsSheet({
  post,
  isOpen,
  onClose,
}: CommentsSheetProps) {
  const { profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch comments when sheet opens
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", post.id)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setComments(data as Comment[]);
      }
      setLoading(false);
    })();
  }, [isOpen, post.id]);

  async function handleSubmit() {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("comments").insert({
        post_id: post.id,
        username: profile?.username ?? "Anonymous",
        country: profile?.country ?? "Unknown",
        comment_text: newComment.trim(),
      });

      if (!error) {
        setNewComment("");
        // Refresh comments
        const { data } = await supabase
          .from("comments")
          .select("*")
          .eq("post_id", post.id)
          .order("created_at", { ascending: true });

        if (data) {
          setComments(data as Comment[]);
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl flex flex-col max-h-[90vh] transition-all duration-300"
        style={{
          animation: "slideUp 0.3s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-surface rounded-t-3xl">
          <span className="text-sm font-black text-text-primary">Comments</span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-text-primary hover:bg-border transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="text-text-muted animate-spin" />
            </div>
          ) : (
            <CommentsSection comments={comments} />
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-border p-3 bg-surface sticky bottom-0">
          <div className="flex gap-2 items-end">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              maxLength={280}
              className="flex-1 bg-muted rounded-full px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none border-2 border-transparent focus:border-[#D52B1E30] transition-colors"
              disabled={submitting}
            />
            <button
              onClick={handleSubmit}
              disabled={!newComment.trim() || submitting}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0"
              style={{
                background: newComment.trim() && !submitting ? "#D52B1E" : "#D1D5DB",
              }}
            >
              {submitting ? (
                <Loader2 size={14} className="animate-spin text-white" />
              ) : (
                <Send size={14} className="text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
