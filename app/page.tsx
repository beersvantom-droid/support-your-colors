import AppHeader from "@/components/AppHeader";
import MatchSpotlight from "@/components/feed/MatchSpotlight";
import LiveScoresBar from "@/components/feed/LiveScoresBar";
import VotingReminder from "@/components/feed/VotingReminder";
import RealFeedPost from "@/components/feed/RealFeedPost";
import CommentatorCard from "@/components/feed/CommentatorCard";
import FloatingActionButton from "@/components/FloatingActionButton";
import { supabase } from "@/lib/supabase";
import type { Post, CommentatorPost, CommentatorConfig } from "@/lib/supabase";
import Link from "next/link";
import { Plus } from "lucide-react";

// Fetch fresh posts on every request so new posts appear after redirect
export const dynamic = "force-dynamic";

type FeedItem =
  | { kind: "post"; data: Post; created_at: string }
  | { kind: "commentary"; data: CommentatorPost; created_at: string };

export default async function HomePage() {
  const [postsResult, commentaryResult, configResult] = await Promise.all([
    supabase.from("posts").select("*").order("created_at", { ascending: false }),
    supabase
      .from("commentator_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("commentator_config").select("*"),
  ]);

  const posts = (postsResult.data as Post[]) ?? [];
  const commentaryPosts = (commentaryResult.data as CommentatorPost[]) ?? [];
  const config = (configResult.data as CommentatorConfig[]) ?? [];

  const avatarMap = new Map<string, string | null>(
    config.map((c) => [c.id, c.avatar_url])
  );

  // Merge and sort by timestamp descending
  const feedItems: FeedItem[] = [
    ...posts.map((p) => ({
      kind: "post" as const,
      data: p,
      created_at: p.created_at,
    })),
    ...commentaryPosts.map((c) => ({
      kind: "commentary" as const,
      data: c,
      created_at: c.created_at,
    })),
  ].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const hasFeedItems = feedItems.length > 0;

  return (
    <div className="min-h-full">
      <AppHeader />

      {/* Live scores — only shown when a match is currently live */}
      <LiveScoresBar />

      {/* 1. Compact supporter match spotlight */}
      <MatchSpotlight />

      <div className="flex flex-col gap-3 px-4 pt-3 pb-6">
        {/* Feed section label */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-widest text-text-muted">
            Latest from the group
          </span>
          <span className="text-[10px] font-semibold text-text-muted">
            {posts.length} posts
          </span>
        </div>

        {/* Error state */}
        {postsResult.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl px-4 py-3 text-center">
            Could not load posts. Check your Supabase setup.
          </div>
        )}

        {/* Empty state */}
        {!postsResult.error && !hasFeedItems && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="text-5xl">⚽</span>
            <div>
              <p className="text-sm font-black text-text-primary">No posts yet</p>
              <p className="text-xs text-text-muted mt-1">
                Be the first to share a moment from the group
              </p>
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
        )}

        {/* 2. Mixed feed — posts and commentator cards interleaved */}
        {hasFeedItems && (
          <>
            {feedItems.map((item) =>
              item.kind === "post" ? (
                <RealFeedPost key={`post-${item.data.id}`} post={item.data} />
              ) : (
                <CommentatorCard
                  key={`commentary-${item.data.id}`}
                  post={item.data}
                  avatarUrl={avatarMap.get(item.data.commentator_id) ?? null}
                />
              )
            )}
          </>
        )}

        {/* 3. Voting reminder — always visible at the bottom */}
        <VotingReminder />

        {hasFeedItems && (
          <div className="flex flex-col items-center gap-1 pt-2 pb-2">
            <span className="text-2xl">⚽</span>
            <span className="text-xs font-semibold text-text-muted">
              You&apos;re all caught up
            </span>
          </div>
        )}
      </div>

      <FloatingActionButton />
    </div>
  );
}
