"use client";

import { useEffect, useState } from "react";

const ADMIN_PASSWORD = "Tom.RoodAdmin";

export default function AdminPasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (input === ADMIN_PASSWORD) {
      onUnlock();
    } else {
      setError(true);
      setShake(true);
      setInput("");
      setTimeout(() => {
        setError(false);
        setShake(false);
      }, 1500);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{
        background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 280ms ease",
      }}
    >
      <div
        className="w-full max-w-xs rounded-3xl overflow-hidden"
        style={{
          background: "#0F172A",
          border: "1px solid rgba(168,85,247,0.35)",
          boxShadow: "0 0 60px rgba(168,85,247,0.15), 0 24px 48px rgba(0,0,0,0.6)",
          transform: visible ? "scale(1)" : "scale(0.92)",
          transition: "transform 320ms cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #A855F7, #7C3AED88)" }} />

        <div className="px-6 pt-6 pb-5 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
            style={{
              background: "rgba(168,85,247,0.12)",
              border: "1.5px solid rgba(168,85,247,0.3)",
            }}
          >
            🔐
          </div>

          <h2 className="text-lg font-black text-white mb-0.5">Control Room</h2>
          <p className="text-xs font-semibold mb-5" style={{ color: "#6B7280" }}>
            Enter password to unlock
          </p>

          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="••••••••••••"
              autoFocus
              className="w-full px-4 py-3 rounded-2xl text-sm text-white font-semibold outline-none mb-3"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: `1.5px solid ${error ? "#EF4444" : "rgba(255,255,255,0.08)"}`,
                transition: "border-color 200ms",
                animation: shake ? "shake 0.4s ease" : "none",
              }}
            />

            {error && (
              <p className="text-xs font-bold text-red-400 mb-3">Incorrect password</p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl text-sm font-black text-white transition-all active:scale-[0.97]"
              style={{ background: "linear-gradient(135deg, #A855F7, #7C3AED)" }}
            >
              Unlock Panel
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-7px); }
          40%     { transform: translateX(7px); }
          60%     { transform: translateX(-4px); }
          80%     { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
