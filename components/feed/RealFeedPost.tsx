"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Flame, MessageCircle, Share2 } from "lucide-react";
import type { Post } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import { getCountryInfo, timeAgo } from "@/lib/countries";
import CommentsSheet from "./CommentsSheet";

interface RealFeedPostProps {
  post: Post;
}

export default function RealFeedPost({ post }: RealFeedPostProps) {
  const { user } = useAuth();
  const country = getCountryInfo(post.country);
  const initials = country.initials(post.username);
  const time = timeAgo(post.created_at);

  const [flameCount, setFlameCount] = useState(post.flame_count ?? 0);
  const [isFlamed, setIsFlamed] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [showComments, setShowComments] = useState(false);

  // Load reaction state from post_reactions table
  useEffect(() => {
    let cancelled = false;

    async function loadReactions() {
      const { count } = await supabase
        .from("post_reactions")
        .select("*", { count: "exact", head: true })
        .eq("post_id", post.id);

      if (!cancelled && count !== null) setFlameCount(count);

      if (user) {
        const { data } = await supabase
          .from("post_reactions")
          .select("id")
          .eq("post_id", post.id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (!cancelled) setIsFlamed(!!data);
      }
    }

    loadReactions();
    return () => { cancelled = true; };
  }, [post.id, user]);

  // Fetch comment count
  useEffect(() => {
    let cancelled = false;
    supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("post_id", post.id)
      .then(({ count }) => {
        if (!cancelled && count !== null) setCommentCount(count);
      });
    return () => { cancelled = true; };
  }, [post.id, showComments]);

  async function handleFlame() {
    if (!user) return;

    const newState = !isFlamed;
    setIsFlamed(newState);
    setFlameCount((c) => Math.max(0, c + (newState ? 1 : -1)));

    if (newState) {
      const { error } = await supabase
        .from("post_reactions")
        .insert({ post_id: post.id, user_id: user.id });

      if (error && error.code !== "23505") {
        // Revert on unexpected error (23505 = duplicate = already reacted, safe to ignore)
        setIsFlamed(false);
        setFlameCount((c) => Math.max(0, c - 1));
      }
    } else {
      await supabase
        .from("post_reactions")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", user.id);
    }
  }

  return (
    <>
      <article className="bg-surface rounded-2xl overflow-hidden shadow-sm border border-black/5">
        {/* Post header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black border-2"
              style={{
                background: `${country.color}18`,
                color: country.color,
                borderColor: `${country.color}40`,
              }}
            >
              {initials}
            </div>
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-text-primary">
                  {post.username}
                </span>
                <span className="text-sm leading-none">{country.flag}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-text-muted">{time}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Caption */}
        {post.caption && (
          <div className="px-4 pb-3">
            <p className="text-sm text-text-primary leading-relaxed font-medium">
              {post.caption}
            </p>
          </div>
        )}

        {/* Image */}
        {post.image_url && (
          <div className="w-full relative" style={{ aspectRatio: "4/3" }}>
            <Image
              src={post.image_url}
              alt={post.caption ?? `Post by ${post.username}`}
              fill
              className="object-cover"
              sizes="(max-width: 448px) 100vw, 448px"
            />
          </div>
        )}

        {/* Interaction row */}
        <div className="flex items-center gap-1 px-4 py-3">
          <button
            onClick={handleFlame}
            disabled={!user}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-90"
            style={{
              color: isFlamed ? "#D52B1E" : "#9CA3AF",
              textShadow: isFlamed ? "0 0 8px rgba(213, 43, 30, 0.5)" : "none",
            }}
          >
            <Flame
              size={15}
              fill={isFlamed ? "currentColor" : "none"}
              style={{
                filter: isFlamed ? "drop-shadow(0 0 4px rgba(213, 43, 30, 0.6))" : "none",
                transition: "all 200ms ease-out",
              }}
            />
            {flameCount}
          </button>

          <button
            onClick={() => setShowComments(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-text-secondary transition-all active:scale-90"
          >
            <MessageCircle size={15} />
            {commentCount}
          </button>

          <div className="flex-1" />

          <button className="w-8 h-8 flex items-center justify-center rounded-full text-text-muted transition-all active:scale-90">
            <Share2 size={14} />
          </button>
        </div>
      </article>

      <CommentsSheet
        post={post}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />
    </>
  );
}
