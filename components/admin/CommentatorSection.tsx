"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2, Trash2, Send, Camera } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { COMMENTATORS } from "@/lib/commentators";
import type { CommentatorId } from "@/lib/commentators";
import type { CommentatorPost, CommentatorConfig } from "@/lib/supabase";

const ALL_IDS: CommentatorId[] = ["jeroen", "sierd", "fabrizio"];

function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function CommentatorSection() {
  const [posts, setPosts] = useState<CommentatorPost[]>([]);
  const [config, setConfig] = useState<CommentatorConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<CommentatorId>("jeroen");
  const [message, setMessage] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploading, setUploading] = useState<CommentatorId | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileRefs = useRef<Record<CommentatorId, HTMLInputElement | null>>({
    jeroen: null,
    sierd: null,
    fabrizio: null,
  });

  async function loadData() {
    const [postsRes, configRes] = await Promise.all([
      supabase
        .from("commentator_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30),
      supabase.from("commentator_config").select("*"),
    ]);
    setPosts((postsRes.data as CommentatorPost[]) ?? []);
    setConfig((configRes.data as CommentatorConfig[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handlePost() {
    if (!message.trim()) return;
    setPosting(true);
    setPostError(null);
    const { error } = await supabase.from("commentator_posts").insert({
      commentator_id: selected,
      message: message.trim(),
      triggered_by: "manual",
    });
    if (error) {
      setPostError(error.message);
    } else {
      setMessage("");
      await loadData();
    }
    setPosting(false);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await supabase.from("commentator_posts").delete().eq("id", id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setDeleting(null);
  }

  async function handleAvatarUpload(id: CommentatorId, file: File) {
    setUploading(id);
    setUploadError(null);

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${id}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("commentator-avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadErr) {
      setUploadError(`Upload failed: ${uploadErr.message}`);
      setUploading(null);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("commentator-avatars")
      .getPublicUrl(path);

    // Append timestamp for cache-busting
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    await supabase
      .from("commentator_config")
      .upsert({ id, avatar_url: avatarUrl });

    await loadData();
    setUploading(null);
  }

  const avatarMap = new Map<string, string | null>(
    config.map((c) => [c.id, c.avatar_url])
  );

  const accentOf = (id: CommentatorId) => COMMENTATORS[id].accentColor;

  return (
    <div className="space-y-4">
      {/* ── Manual post composer ───────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="px-4 pt-3.5 pb-1">
          <p
            className="text-[10px] font-black uppercase tracking-widest mb-3"
            style={{ color: "#6B7280" }}
          >
            Post Manual Commentary
          </p>

          {/* Commentator selector */}
          <div className="flex gap-1.5 mb-3">
            {ALL_IDS.map((id) => {
              const cfg = COMMENTATORS[id];
              const active = selected === id;
              return (
                <button
                  key={id}
                  onClick={() => setSelected(id)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-black transition-all"
                  style={{
                    background: active
                      ? `${cfg.accentColor}20`
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${
                      active
                        ? cfg.accentColor + "50"
                        : "rgba(255,255,255,0.06)"
                    }`,
                    color: active ? cfg.accentColor : "#6B7280",
                  }}
                >
                  <span>{cfg.emoji}</span>
                  <span className="hidden sm:inline truncate">
                    {cfg.name.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Write as ${COMMENTATORS[selected].name}…`}
            rows={3}
            maxLength={300}
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white resize-none outline-none"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          />

          {postError && (
            <p className="text-[10px] text-red-400 mt-1">{postError}</p>
          )}
        </div>

        <div className="px-4 pb-3.5 flex items-center justify-between">
          <span className="text-[10px]" style={{ color: "#4B5563" }}>
            {message.length}/300
          </span>
          <button
            onClick={handlePost}
            disabled={posting || !message.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white transition-all active:scale-95"
            style={{
              background: message.trim()
                ? `linear-gradient(135deg, ${accentOf(selected)}, ${accentOf(selected)}cc)`
                : "rgba(255,255,255,0.08)",
              color: message.trim() ? "#fff" : "#4B5563",
            }}
          >
            {posting ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Send size={12} />
            )}
            {posting ? "Posting…" : "Post Now"}
          </button>
        </div>
      </div>

      {/* ── Avatar management ─────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="px-4 py-3.5">
          <p
            className="text-[10px] font-black uppercase tracking-widest mb-3"
            style={{ color: "#6B7280" }}
          >
            Profile Photos
          </p>

          {uploadError && (
            <p className="text-[10px] text-red-400 mb-2">{uploadError}</p>
          )}

          <div className="space-y-2.5">
            {ALL_IDS.map((id) => {
              const cfg = COMMENTATORS[id];
              const avatarUrl = avatarMap.get(id);
              return (
                <div key={id} className="flex items-center gap-3">
                  {/* Avatar preview */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 overflow-hidden"
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
                    <p className="text-xs font-black text-white">{cfg.name}</p>
                    <p className="text-[10px]" style={{ color: "#4B5563" }}>
                      {avatarUrl ? "Custom photo set" : "Using emoji avatar"}
                    </p>
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={(el) => {
                      fileRefs.current[id] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAvatarUpload(id, file);
                    }}
                  />

                  <button
                    onClick={() => fileRefs.current[id]?.click()}
                    disabled={uploading === id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95"
                    style={{
                      background: `${cfg.accentColor}18`,
                      color: cfg.accentColor,
                    }}
                  >
                    {uploading === id ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : (
                      <Camera size={10} />
                    )}
                    {uploading === id ? "…" : "Change"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Recent commentary posts ───────────────────────────────────── */}
      <div>
        <p
          className="text-[10px] font-black uppercase tracking-widest mb-2"
          style={{ color: "#6B7280" }}
        >
          Recent Commentary ({posts.length})
        </p>

        {loading ? (
          <div className="space-y-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-2xl animate-pulse"
                style={{ background: "rgba(255,255,255,0.04)" }}
              />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <p
            className="text-xs text-center py-6"
            style={{ color: "#4B5563" }}
          >
            No commentary yet
          </p>
        ) : (
          <div className="space-y-1.5">
            {posts.map((post) => {
              const cfg = COMMENTATORS[post.commentator_id];
              return (
                <div
                  key={post.id}
                  className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
                  style={{
                    background: `${cfg.accentColor}08`,
                    border: `1px solid ${cfg.accentColor}18`,
                  }}
                >
                  <span className="text-base flex-shrink-0 mt-0.5">
                    {cfg.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[10px] font-black mb-0.5"
                      style={{ color: cfg.accentColor }}
                    >
                      {cfg.name}
                    </p>
                    <p className="text-xs text-white leading-snug">
                      {post.message.slice(0, 100)}
                      {post.message.length > 100 ? "…" : ""}
                    </p>
                    <p
                      className="text-[10px] mt-0.5"
                      style={{ color: "#4B5563" }}
                    >
                      {relativeTime(post.created_at)}
                      {post.triggered_by && ` · ${post.triggered_by}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(post.id)}
                    disabled={deleting === post.id}
                    className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 transition-all active:scale-90"
                    style={{
                      background: "rgba(239,68,68,0.12)",
                      color: "#EF4444",
                    }}
                  >
                    {deleting === post.id ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : (
                      <Trash2 size={11} />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
