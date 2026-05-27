"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Send } from "lucide-react";

interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  user_country: string | null;
  user_flag: string | null;
  message: string;
  created_at: string;
}

interface LiveMatch {
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
}

interface Props {
  onClose: () => void;
}

const POLL_INTERVAL_MS = 2000;

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNextMatch(dateStr: string): string {
  const matchDate = new Date(dateStr + "T12:00:00Z");
  const now = new Date();
  const diffMs = matchDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Vandaag";
  if (diffDays === 1) return "Morgen";
  return matchDate.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
}

export default function LiveChatModal({ onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeUsers, setActiveUsers] = useState(0);
  const [isMatchLive, setIsMatchLive] = useState(false);
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [nextMatchDate, setNextMatchDate] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevMessageCount = useRef(0);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/live-chat/messages");
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages ?? []);
      setActiveUsers(data.activeUsers ?? 0);
      setIsMatchLive(data.isMatchLive ?? false);
      setLiveMatches(data.liveMatches ?? []);
      setNextMatchDate(data.nextMatchDate ?? null);
    } catch {
      // Silent fail — try again next poll
    }
  }, []);

  // Initial fetch + polling every 2s
  useEffect(() => {
    fetchMessages();
    const id = setInterval(fetchMessages, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchMessages]);

  // Auto-scroll to bottom when new messages arrive (only if already at bottom)
  useEffect(() => {
    const newCount = messages.length;
    if (newCount > prevMessageCount.current && isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessageCount.current = newCount;
  }, [messages, isAtBottom]);

  // Track whether user is at bottom
  function handleScroll() {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setIsAtBottom(atBottom);
  }

  async function handleSend() {
    const text = inputText.trim();
    if (!text || sending) return;

    setSending(true);
    setRateLimitError(null);

    try {
      const res = await fetch("/api/live-chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setRateLimitError(data.error ?? "Te snel! Wacht even.");
        setTimeout(() => setRateLimitError(null), 5000);
        return;
      }

      if (!res.ok) {
        setRateLimitError(data.error ?? "Versturen mislukt");
        setTimeout(() => setRateLimitError(null), 3000);
        return;
      }

      setInputText("");
      setIsAtBottom(true);
      // Immediately refetch to show own message
      await fetchMessages();
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch {
      setRateLimitError("Verbindingsfout, probeer opnieuw");
      setTimeout(() => setRateLimitError(null), 3000);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const charsLeft = 140 - inputText.length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal — bottom sheet on mobile */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto flex flex-col rounded-t-3xl overflow-hidden"
        style={{
          height: "85vh",
          background: "#0F1117",
          borderTop: isMatchLive
            ? "2px solid #EF4444"
            : "2px solid rgba(255,255,255,0.1)",
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex-none px-4 pt-4 pb-3"
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background: isMatchLive
              ? "linear-gradient(135deg, #1a0a0a, #0F1117)"
              : "#0F1117",
          }}
        >
          {/* Drag handle */}
          <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-3" />

          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Title row */}
              <div className="flex items-center gap-2 mb-1">
                {isMatchLive && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  </span>
                )}
                <span className="text-base font-black text-white">
                  {isMatchLive ? "LIVE CHAT" : "Match Chat"}
                </span>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}
                >
                  {activeUsers} online
                </span>
              </div>

              {/* Live match scores */}
              {isMatchLive && liveMatches.map((m, i) => (
                <p key={i} className="text-sm font-black" style={{ color: "#EF4444" }}>
                  ⚽ {m.home_team} {m.home_score ?? 0} – {m.away_score ?? 0} {m.away_team}
                </p>
              ))}

              {/* Next match info */}
              {!isMatchLive && nextMatchDate && (
                <p className="text-xs font-semibold" style={{ color: "#9CA3AF" }}>
                  Volgende wedstrijd: {formatNextMatch(nextMatchDate)}
                </p>
              )}

              {/* No matches info */}
              {!isMatchLive && !nextMatchDate && (
                <p className="text-xs font-semibold" style={{ color: "#9CA3AF" }}>
                  WK 2026 begint 11 juni 🏆
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90 flex-none"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <X size={16} className="text-white" />
            </button>
          </div>
        </div>

        {/* ── Messages ── */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-2"
          style={{ overscrollBehavior: "contain" }}
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <span className="text-5xl">⚽</span>
              <p className="text-sm font-bold text-white/60">
                Nog geen berichten.
              </p>
              <p className="text-xs text-white/40">
                Wees de eerste!
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-2">
              {/* Avatar / Flag */}
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center text-sm flex-none mt-0.5"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                {msg.user_flag ?? "🌍"}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 mb-0.5">
                  <span className="text-[11px] font-black text-white/80 truncate max-w-[120px]">
                    {msg.username}
                  </span>
                  <span className="text-[10px] text-white/30 flex-none">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
                <p
                  className="text-sm leading-snug break-words"
                  style={{ color: "rgba(255,255,255,0.88)" }}
                >
                  {msg.message}
                </p>
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Scroll-to-bottom indicator */}
        {!isAtBottom && (
          <button
            onClick={() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
              setIsAtBottom(true);
            }}
            className="absolute bottom-20 right-4 w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold"
            style={{ background: "#EF4444", color: "white" }}
          >
            ↓
          </button>
        )}

        {/* ── Input ── */}
        <div
          className="flex-none px-4 pb-6 pt-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          {/* Rate limit error */}
          {rateLimitError && (
            <p
              className="text-xs font-bold mb-2 text-center"
              style={{ color: "#EF4444" }}
            >
              {rateLimitError}
            </p>
          )}

          <div className="flex items-center gap-2">
            <div
              className="flex-1 flex items-center rounded-2xl px-3 py-2.5"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.10)" }}
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value.slice(0, 140))}
                onKeyDown={handleKeyDown}
                placeholder="Typ een bericht..."
                maxLength={140}
                className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none min-w-0"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              {inputText.length > 0 && (
                <span
                  className="text-[10px] font-bold flex-none ml-1"
                  style={{ color: charsLeft < 20 ? "#EF4444" : "rgba(255,255,255,0.3)" }}
                >
                  {charsLeft}
                </span>
              )}
            </div>

            <button
              onClick={handleSend}
              disabled={!inputText.trim() || sending}
              className="w-10 h-10 flex items-center justify-center rounded-2xl transition-all active:scale-90 flex-none"
              style={{
                background:
                  inputText.trim() && !sending
                    ? isMatchLive
                      ? "linear-gradient(135deg, #EF4444, #B91C1C)"
                      : "linear-gradient(135deg, #3B82F6, #2563EB)"
                    : "rgba(255,255,255,0.08)",
                opacity: !inputText.trim() ? 0.4 : 1,
              }}
            >
              <Send size={15} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
