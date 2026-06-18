"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ImagePlus, Globe, Send, X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAchievements } from "@/components/achievements/AchievementsProvider";
import { scheduleCommentatorReactions } from "@/lib/commentator-engine";
import { getCountryInfo } from "@/lib/countries";

export default function CreatePostPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { triggerCheck } = useAchievements();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const country = profile?.country ?? null;
  const countryInfo = getCountryInfo(country);
  const displayColor = countryInfo.color;
  const displayFlag = countryInfo.flag;

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setImage(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function compressImage(file: File): Promise<Blob> {
    return new Promise((resolve) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX = 1200;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
          else { width = Math.round((width * MAX) / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.82);
      };
      img.src = url;
    });
  }

  async function handleSubmit() {
    if (!image) {
      setError("Please select an image first.");
      return;
    }
    if (!profile) {
      setError("Could not load your profile. Try refreshing.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const compressed = await compressImage(image);
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("posts-images")
        .upload(fileName, compressed, { contentType: "image/jpeg" });

      if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

      const { data: urlData } = supabase.storage
        .from("posts-images")
        .getPublicUrl(fileName);

      const { data: insertData, error: insertError } = await supabase
        .from("posts")
        .insert({
          username:  profile.username,
          country:   profile.country ?? "Unknown",
          caption:   caption.trim() || null,
          image_url: urlData.publicUrl,
        })
        .select("id")
        .single();

      if (insertError) throw new Error(`Database insert failed: ${insertError.message}`);

      triggerCheck();
      // Schedule commentator reactions in background — don't block navigation
      if (insertData?.id) {
        scheduleCommentatorReactions({
          postId:  insertData.id,
          caption: caption.trim() || null,
          country: profile.country,
        }).catch(() => {});
      }
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const canPost = !!image && !loading && !!profile;

  return (
    <div className="min-h-full bg-surface flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="w-8 h-8 flex items-center justify-center rounded-full bg-muted"
        >
          <ArrowLeft size={16} className="text-text-primary" />
        </Link>

        <span className="text-sm font-black text-text-primary">New Post</span>

        <button
          onClick={handleSubmit}
          disabled={!canPost}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black text-white transition-all"
          style={{ background: canPost ? displayColor : "#D1D5DB" }}
        >
          {loading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Send size={12} />
          )}
          {loading ? "Posting…" : "Post"}
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-4 p-4 pb-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />

        {preview ? (
          <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
            <Image src={preview} alt="Preview" fill className="object-cover" unoptimized />
            <button
              onClick={removeImage}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center"
            >
              <X size={14} color="white" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-12 transition-colors active:bg-muted"
            style={{ borderColor: "#E8EAED" }}
          >
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
              <ImagePlus size={22} className="text-text-muted" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-text-secondary">Add a photo</p>
              <p className="text-xs text-text-muted mt-0.5">Share your match day moment</p>
            </div>
            <span
              className="px-4 py-2 rounded-full text-xs font-bold border"
              style={{ borderColor: displayColor, color: displayColor }}
            >
              Choose from library
            </span>
          </button>
        )}

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption… 🔥"
          maxLength={280}
          rows={3}
          className="w-full bg-muted rounded-2xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted resize-none outline-none border-2 border-transparent focus:border-[#D52B1E30] transition-colors"
        />

        <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3">
          <Globe size={16} className="text-text-secondary" />
          <span className="text-sm font-semibold text-text-secondary flex-1">
            Visible to the group
          </span>
          <span className="text-xs text-text-muted">friends only</span>
        </div>

        {/* Supporter identity tag */}
        {profile ? (
          <div
            className="flex items-center gap-2 rounded-2xl px-4 py-3"
            style={{
              background: `${displayColor}12`,
              border: `1px solid ${displayColor}30`,
            }}
          >
            <span className="text-base">{displayFlag}</span>
            <div>
              <p className="text-sm font-bold" style={{ color: displayColor }}>
                {profile.username}
              </p>
              {country && (
                <p className="text-xs text-text-muted">
                  Posting as {country} supporter
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-3">
            <Loader2 size={16} className="text-text-muted animate-spin" />
            <span className="text-sm text-text-muted">Loading profile…</span>
          </div>
        )}
      </div>
    </div>
  );
}
