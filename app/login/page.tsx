"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError("Invalid email or password. Check your credentials and try again.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-10 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, #001845 0%, #002868 30%, #1A3A6E 60%, #006847 100%)",
      }}
    >
      {/* Decorative background shapes */}
      <div
        className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10"
        style={{ background: "#D52B1E" }}
      />
      <div
        className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-10"
        style={{ background: "#FFD700" }}
      />
      <div
        className="absolute top-1/3 -left-8 w-40 h-40 rounded-full opacity-5"
        style={{ background: "#FFFFFF" }}
      />

      {/* Branding */}
      <div className="relative text-center mb-8 w-full max-w-sm">
        {/* Host flags */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <span className="text-2xl">🍁</span>
          <span className="text-2xl">🇺🇸</span>
          <span className="text-2xl">🇲🇽</span>
        </div>

        {/* Ball icon */}
        <div className="text-5xl mb-4">⚽</div>

        {/* App name */}
        <h1 className="text-3xl font-black text-white leading-tight tracking-tight">
          Support Your Colors
        </h1>
        <p
          className="text-2xl font-black leading-tight mt-1"
          style={{
            background: "linear-gradient(90deg, #FFFFFF 0%, #FFD700 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          World Cup 2026™
        </p>
        <p className="text-sm font-medium mt-2" style={{ color: "rgba(255,255,255,0.55)" }}>
          Your private group match hub
        </p>
      </div>

      {/* Login card */}
      <div className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl">
        <div className="bg-white px-6 py-7">
          <h2 className="text-xl font-black text-gray-900">Welcome back</h2>
          <p className="text-sm text-gray-400 mt-0.5">Log in to join your crew</p>

          <form onSubmit={handleLogin} className="mt-6 space-y-3">
            {/* Email */}
            <div className="relative">
              <Mail
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "#9CA3AF" }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                autoComplete="email"
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none transition-all"
                style={{
                  background: "#F8F9FA",
                  border: "1.5px solid #E5E7EB",
                }}
                onFocus={(e) => {
                  e.target.style.border = "1.5px solid #D52B1E";
                  e.target.style.background = "#FFFFFF";
                }}
                onBlur={(e) => {
                  e.target.style.border = "1.5px solid #E5E7EB";
                  e.target.style.background = "#F8F9FA";
                }}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "#9CA3AF" }}
              />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-3 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none transition-all"
                style={{
                  background: "#F8F9FA",
                  border: "1.5px solid #E5E7EB",
                }}
                onFocus={(e) => {
                  e.target.style.border = "1.5px solid #D52B1E";
                  e.target.style.background = "#FFFFFF";
                }}
                onBlur={(e) => {
                  e.target.style.border = "1.5px solid #E5E7EB";
                  e.target.style.background = "#F8F9FA";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2"
                style={{ color: "#9CA3AF" }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div
                className="rounded-xl px-4 py-3 text-sm font-medium"
                style={{ background: "#FEF2F2", color: "#B91C1C" }}
              >
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-3.5 rounded-xl text-sm font-black text-white tracking-widest uppercase transition-all active:scale-[0.98] mt-1"
              style={{
                background: canSubmit
                  ? "linear-gradient(135deg, #D52B1E 0%, #B91C1C 100%)"
                  : "#D1D5DB",
                boxShadow: canSubmit
                  ? "0 4px 20px rgba(213, 43, 30, 0.35)"
                  : "none",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={15} className="animate-spin" />
                  Logging in…
                </span>
              ) : (
                "Log In"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3.5 text-center"
          style={{ background: "#F8F9FA", borderTop: "1px solid #F0F0F0" }}
        >
          <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>
            🔒 Private group · Invite only · No public signup
          </p>
        </div>
      </div>

      {/* Tournament dates badge */}
      <div
        className="mt-6 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
        style={{ background: "rgba(255,255,255,0.1)" }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.7)" }}>
          Jun 11 – Jul 19, 2026
        </span>
      </div>
    </div>
  );
}
