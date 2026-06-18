"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import RealFeedPost from "@/components/feed/RealFeedPost";
import CommentatorCard from "@/components/feed/CommentatorCard";
import VotingReminder from "@/components/feed/VotingReminder";
import type { Post, CommentatorPost } from "@/lib/supabase";

const PAGE_SIZE = 20;

type FeedItem =
  | { kind: "post"; data: Post; created_at: string }
  | { kind: "commentary"; data: CommentatorPost; created_at: string };

function buildFeed(posts: Post[], commentaryPosts: CommentatorPost[]): FeedItem[] {
  return [
    ...posts.map((p) => ({ kind: "post" as const, data: p, created_at: p.created_at })),
    ...commentaryPosts.map((c) => ({ kind: "commentary" as const, data: c, created_at: c.created_at })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

interface Props {
  initialPosts: Post[];
  commentaryPosts: CommentatorPost[];
  avatarMap: Record<string, string | null>;
  totalCount: number;
}

export default function FeedList({ initialPosts, commentaryPosts, avatarMap, totalCount }: Props) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length === PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (busyRef.current || !hasMore) return;
    busyRef.current = true;
    setLoading(true);

    const cursor = posts[posts.length - 1]?.created_at;
    if (!cursor) { setHasMore(false); setLoading(false); busyRef.current = false; return; }

    const { data } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .lt("created_at", cursor)
      .limit(PAGE_SIZE);

    const next = (data as Post[]) ?? [];
    setPosts((prev) => [...prev, ...next]);
    setHasMore(next.length === PAGE_SIZE);
    setLoading(false);
    busyRef.current = false;
  }, [posts, hasMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const feedItems = buildFeed(posts, commentaryPosts);

  if (feedItems.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="text-5xl">⚽</span>
        <div>
          <p className="text-sm font-black text-text-primary">No posts yet</p>
          <p className="text-xs text-text-muted mt-1">Be the first to share a moment from the group</p>
        </div>
        <Link
          href="/create-post"
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white"
          style={{ background: "#D52B1E" }}
        >
          <Plus size={14} />
          Post something
        </Link>
      </div>
    );
  }

  return (
    <>
      {feedItems.map((item) =>
        item.kind === "post" ? (
          <RealFeedPost key={`post-${item.data.id}`} post={item.data} />
        ) : (
          <CommentatorCard
            key={`commentary-${item.data.id}`}
            post={item.data}
            avatarUrl={avatarMap[item.data.commentator_id] ?? null}
          />
        )
      )}

      {hasMore && <div ref={sentinelRef} className="h-1" />}

      {loading && (
        <div className="flex justify-center py-4">
          <span className="text-xs font-semibold text-text-muted">Loading more posts…</span>
        </div>
      )}

      <VotingReminder />

      {!hasMore && (
        <div className="flex flex-col items-center gap-1 pt-2 pb-2">
          <span className="text-2xl">⚽</span>
          <span className="text-xs font-semibold text-text-muted">
            {totalCount > PAGE_SIZE ? `All ${totalCount} posts loaded` : "You're all caught up"}
          </span>
        </div>
      )}
    </>
  );
}
