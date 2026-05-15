"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2, Trash2, Camera, Plus, ToggleLeft, ToggleRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { FanPersona, FanPersonality } from "@/lib/supabase";

const PERSONALITIES: { id: FanPersonality; label: string; emoji: string }[] = [
  { id: "hype",      label: "Hype",      emoji: "🔥" },
  { id: "sarcastic", label: "Sarcastic", emoji: "😐" },
  { id: "funny",     label: "Funny",     emoji: "😂" },
  { id: "toxic",     label: "Toxic",     emoji: "💀" },
  { id: "tactical",  label: "Tactical",  emoji: "🧠" },
  { id: "chill",     label: "Chill",     emoji: "👌" },
  { id: "chaotic",   label: "Chaotic",   emoji: "😭" },
];

export default function FanPersonasSection() {
  const [fans, setFans] = useState<FanPersona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New fan form
  const [name, setName] = useState("");
  const [personality, setPersonality] = useState<FanPersonality>("hype");
  const [creating, setCreating] = useState(false);

  // Avatar upload per fan
  const [uploading, setUploading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function loadFans() {
    const { data, error: err } = await supabase
      .from("fan_personas")
      .select("*")
      .order("created_at", { ascending: false });
    if (!err && data) setFans(data as FanPersona[]);
    setLoading(false);
  }

  useEffect(() => { loadFans(); }, []);

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    const { error: err } = await supabase.from("fan_personas").insert({
      name: name.trim(),
      personality,
      active: true,
    });
    if (err) { setError(err.message); } else { setName(""); }
    await loadFans();
    setCreating(false);
  }

  async function handleAvatarUpload(fan: FanPersona, file: File) {
    setUploading(fan.id);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `fan-${fan.id}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("commentator-avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadErr) { setError(`Upload failed: ${uploadErr.message}`); setUploading(null); return; }

    const { data: urlData } = supabase.storage.from("commentator-avatars").getPublicUrl(path);
    await supabase.from("fan_personas").update({ avatar_url: `${urlData.publicUrl}?t=${Date.now()}` }).eq("id", fan.id);
    await loadFans();
    setUploading(null);
  }

  async function handleToggle(fan: FanPersona) {
    setToggling(fan.id);
    await supabase.from("fan_personas").update({ active: !fan.active }).eq("id", fan.id);
    await loadFans();
    setToggling(null);
  }

  async function handleDelete(fan: FanPersona) {
    setDeleting(fan.id);
    await supabase.from("fan_personas").delete().eq("id", fan.id);
    await loadFans();
    setDeleting(null);
  }

  const personalityMeta = (id: FanPersonality) => PERSONALITIES.find(p => p.id === id);

  return (
    <div className="space-y-4">
      {/* Header */}
      <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#6B7280" }}>
        Fan Personas
      </p>

      {/* Create fan form */}
      <div
        className="rounded-2xl p-4 space-y-3"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <p className="text-xs font-black text-white">Add Fan</p>

        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Name..."
          maxLength={40}
          className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
        />

        {/* Personality picker */}
        <div className="flex flex-wrap gap-1.5">
          {PERSONALITIES.map(p => (
            <button
              key={p.id}
              onClick={() => setPersonality(p.id)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black transition-all"
              style={{
                background: personality === p.id ? "#A855F7" : "rgba(255,255,255,0.06)",
                color:      personality === p.id ? "#fff"    : "#6B7280",
              }}
            >
              {p.emoji} {p.label}
            </button>
          ))}
        </div>

        {error && <p className="text-[10px] text-red-400">{error}</p>}

        <button
          onClick={handleCreate}
          disabled={!name.trim() || creating}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white transition-all active:scale-95"
          style={{ background: name.trim() && !creating ? "linear-gradient(135deg, #A855F7, #7C3AED)" : "rgba(255,255,255,0.08)" }}
        >
          {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          {creating ? "Creating…" : "Add Fan"}
        </button>
      </div>

      {/* Fan list */}
      {loading ? (
        <div className="space-y-2">
          {[0,1,2].map(i => (
            <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
          ))}
        </div>
      ) : fans.length === 0 ? (
        <p className="text-xs text-center py-6" style={{ color: "#4B5563" }}>No fan personas yet</p>
      ) : (
        <div className="space-y-2">
          {fans.map(fan => {
            const meta = personalityMeta(fan.personality);
            return (
              <div
                key={fan.id}
                className="rounded-2xl p-3 flex items-center gap-3"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  opacity: fan.active ? 1 : 0.5,
                }}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden text-lg"
                    style={{ background: "rgba(168,85,247,0.15)", border: "1.5px solid rgba(168,85,247,0.3)" }}
                  >
                    {fan.avatar_url
                      ? <img src={fan.avatar_url} alt={fan.name} className="w-full h-full object-cover" />
                      : <span>{meta?.emoji ?? "👤"}</span>
                    }
                  </div>
                  {/* Upload button */}
                  <button
                    onClick={() => fileRefs.current[fan.id]?.click()}
                    className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "#A855F7" }}
                  >
                    {uploading === fan.id
                      ? <Loader2 size={9} color="white" className="animate-spin" />
                      : <Camera size={9} color="white" />
                    }
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={el => { fileRefs.current[fan.id] = el; }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(fan, f); }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white truncate">{fan.name}</p>
                  <p className="text-[10px]" style={{ color: "#6B7280" }}>
                    {meta?.emoji} {meta?.label}
                  </p>
                </div>

                {/* Toggle active */}
                <button onClick={() => handleToggle(fan)} disabled={toggling === fan.id} className="flex-shrink-0">
                  {toggling === fan.id
                    ? <Loader2 size={18} color="#6B7280" className="animate-spin" />
                    : fan.active
                    ? <ToggleRight size={20} color="#A855F7" />
                    : <ToggleLeft size={20} color="#4B5563" />
                  }
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(fan)}
                  disabled={deleting === fan.id}
                  className="flex-shrink-0 w-7 h-7 rounded-xl flex items-center justify-center transition-all"
                  style={{ background: "rgba(239,68,68,0.1)" }}
                >
                  {deleting === fan.id
                    ? <Loader2 size={12} color="#EF4444" className="animate-spin" />
                    : <Trash2 size={12} color="#EF4444" />
                  }
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
