import AppHeader from "@/components/AppHeader";
import MatchSpotlight from "@/components/feed/MatchSpotlight";
import LiveScoresBar from "@/components/feed/LiveScoresBar";
import FeedList from "@/components/feed/FeedList";
import MatchBetCard from "@/components/feed/MatchBetCard";
import FloatingActionButton from "@/components/FloatingActionButton";
import { supabase } from "@/lib/supabase";
import type { Post, CommentatorPost, CommentatorConfig } from "@/lib/supabase";

// Fetch fresh posts on every request so new posts appear after redirect
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [postsResult, commentaryResult, configResult, countResult] = await Promise.all([
    supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(20),
    supabase.from("commentator_posts").select("*").order("created_at", { ascending: false }).limit(20),
    supabase.from("commentator_config").select("*"),
    supabase.from("posts").select("*", { count: "exact", head: true }),
  ]);

  const posts = (postsResult.data as Post[]) ?? [];
  const commentaryPosts = (commentaryResult.data as CommentatorPost[]) ?? [];
  const config = (configResult.data as CommentatorConfig[]) ?? [];
  const totalCount = countResult.count ?? posts.length;

  const avatarMap: Record<string, string | null> = Object.fromEntries(
    config.map((c) => [c.id, c.avatar_url])
  );

  return (
    <div className="min-h-full">
      <AppHeader />
      <LiveScoresBar />
      <MatchSpotlight />

      <div className="flex flex-col gap-3 px-4 pt-3 pb-6">
        <MatchBetCard />

        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-widest text-text-muted">
            Latest from the group
          </span>
          <span className="text-[10px] font-semibold text-text-muted">
            {totalCount} posts
          </span>
        </div>

        {postsResult.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl px-4 py-3 text-center">
            Could not load posts. Check your Supabase setup.
          </div>
        )}

        {!postsResult.error && (
          <FeedList
            initialPosts={posts}
            commentaryPosts={commentaryPosts}
            avatarMap={avatarMap}
            totalCount={totalCount}
          />
        )}
      </div>

      <FloatingActionButton />
    </div>
  );
}
