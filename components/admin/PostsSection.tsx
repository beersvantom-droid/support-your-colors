"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Post, Comment } from "@/lib/supabase";

type SubTab = "posts" | "comments";

export default function PostsSection() {
  const [subTab, setSubTab] = useState<SubTab>("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [postsRes, commentsRes] = await Promise.all([
        supabase
          .from("posts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("comments")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      setPosts((postsRes.data as Post[]) ?? []);
      setComments((commentsRes.data as Comment[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function deletePost(post: Post) {
    setDeleting(post.id);

    if (post.image_url) {
      const path = post.image_url.split("/posts-images/").pop();
      if (path) await supabase.storage.from("posts-images").remove([path]);
    }
    await supabase.from("comments").delete().eq("post_id", post.id);
    await supabase.from("posts").delete().eq("id", post.id);

    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    setComments((prev) => prev.filter((c) => c.post_id !== post.id));
    setConfirming(null);
    setDeleting(null);
  }

  async function deleteComment(comment: Comment) {
    setDeleting(comment.id);
    await supabase.from("comments").delete().eq("id", comment.id);
    setComments((prev) => prev.filter((c) => c.id !== comment.id));
    setConfirming(null);
    setDeleting(null);
  }

  return (
    <div className="space-y-3">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        {(["posts", "comments"] as SubTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className="px-3 py-1.5 rounded-full text-xs font-black capitalize"
            style={{
              background: subTab === t ? "#A855F7" : "rgba(255,255,255,0.06)",
              color: subTab === t ? "#FFFFFF" : "#6B7280",
            }}
          >
            {t === "posts" ? `📸 Posts (${posts.length})` : `💬 Comments (${comments.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-2xl animate-pulse"
              style={{ background: "rgba(255,255,255,0.04)" }}
            />
          ))}
        </div>
      ) : subTab === "posts" ? (
        <PostsList
          posts={posts}
          confirming={confirming}
          deleting={deleting}
          onConfirm={setConfirming}
          onDelete={deletePost}
        />
      ) : (
        <CommentsList
          comments={comments}
          confirming={confirming}
          deleting={deleting}
          onConfirm={setConfirming}
          onDelete={deleteComment}
        />
      )}
    </div>
  );
}

function PostsList({
  posts,
  confirming,
  deleting,
  onConfirm,
  onDelete,
}: {
  posts: Post[];
  confirming: string | null;
  deleting: string | null;
  onConfirm: (id: string | null) => void;
  onDelete: (post: Post) => void;
}) {
  if (posts.length === 0) {
    return <EmptyState emoji="📭" label="No posts yet" />;
  }

  return (
    <div className="space-y-2">
      {posts.map((post) => (
        <div
          key={post.id}
          className="flex items-center gap-3 p-3 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {post.image_url ? (
            <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 relative">
              <Image src={post.image_url} alt="" fill className="object-cover" unoptimized />
            </div>
          ) : (
            <div
              className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-lg"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              📸
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-white">{post.username}</p>
            <p className="text-[10px] truncate" style={{ color: "#6B7280" }}>
              {post.caption ?? "No caption"}
            </p>
            <p className="text-[10px]" style={{ color: "#374151" }}>
              {new Date(post.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <DeleteControl
            id={post.id}
            confirming={confirming}
            deleting={deleting}
            onConfirm={onConfirm}
            onDelete={() => onDelete(post)}
          />
        </div>
      ))}
    </div>
  );
}

function CommentsList({
  comments,
  confirming,
  deleting,
  onConfirm,
  onDelete,
}: {
  comments: Comment[];
  confirming: string | null;
  deleting: string | null;
  onConfirm: (id: string | null) => void;
  onDelete: (comment: Comment) => void;
}) {
  if (comments.length === 0) {
    return <EmptyState emoji="💬" label="No comments yet" />;
  }

  return (
    <div className="space-y-1.5">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="flex items-start gap-3 p-3 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-white">{comment.username}</p>
            <p className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>
              {comment.comment_text}
            </p>
            <p className="text-[10px] mt-1" style={{ color: "#374151" }}>
              {new Date(comment.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <DeleteControl
            id={comment.id}
            confirming={confirming}
            deleting={deleting}
            onConfirm={onConfirm}
            onDelete={() => onDelete(comment)}
          />
        </div>
      ))}
    </div>
  );
}

function DeleteControl({
  id,
  confirming,
  deleting,
  onConfirm,
  onDelete,
}: {
  id: string;
  confirming: string | null;
  deleting: string | null;
  onConfirm: (id: string | null) => void;
  onDelete: () => void;
}) {
  if (confirming === id) {
    return (
      <div className="flex gap-1.5 flex-shrink-0">
        <button
          onClick={() => onConfirm(null)}
          className="px-2 py-1.5 rounded-xl text-[10px] font-black"
          style={{ background: "rgba(255,255,255,0.06)", color: "#6B7280" }}
        >
          No
        </button>
        <button
          onClick={onDelete}
          disabled={deleting === id}
          className="px-2 py-1.5 rounded-xl text-[10px] font-black"
          style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}
        >
          {deleting === id ? "…" : "Delete"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => onConfirm(id)}
      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: "rgba(239,68,68,0.07)" }}
    >
      <Trash2 size={13} color="#EF4444" />
    </button>
  );
}

function EmptyState({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="text-center py-10">
      <p className="text-2xl mb-2">{emoji}</p>
      <p className="text-xs font-semibold" style={{ color: "#6B7280" }}>
        {label}
      </p>
    </div>
  );
}
