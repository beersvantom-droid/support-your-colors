"use client";

import { useEffect, useState } from "react";

export default function ResetLockerPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if we're coming back from reset
    const params = new URLSearchParams(window.location.search);
    if (params.get("cleared") === "true") {
      // Already cleared, go to locker
      setTimeout(() => {
        window.location.href = "/locker";
      }, 1000);
    }
  }, []);

  const handleReset = async () => {
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/reset-locker", { method: "POST" });
      const data = await res.json();

      console.log("Reset response:", data);

      if (!res.ok) {
        setError(data.error || "Reset failed");
        setLoading(false);
        return;
      }

      setSuccess(true);

      // IMMEDIATELY clear all storage
      console.log("Clearing localStorage...");
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key) localStorage.removeItem(key);
      }

      console.log("Clearing sessionStorage...");
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key) sessionStorage.removeItem(key);
      }

      console.log("Storage cleared! Redirecting...");

      // Wait a moment then hard navigate with cache bust
      setTimeout(() => {
        // Add timestamp to bust cache
        window.location.href = "/locker?t=" + Date.now();
      }, 500);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError("Error: " + errorMsg);
      console.error("Reset error:", err);
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      padding: "20px",
    }}>
      <div style={{
        maxWidth: "500px",
        textAlign: "center",
        color: "#fff",
      }}>
        <h1 style={{ fontSize: "32px", marginBottom: "12px", fontWeight: 900 }}>
          🔄 Reset Locker
        </h1>

        <p style={{ color: "#9CA3AF", marginBottom: "24px", fontSize: "14px" }}>
          Dit zal alle cosmetics en cooldowns verwijderen en je coins op 10000 zetten.
        </p>

        {error && (
          <div style={{
            background: "rgba(239, 68, 68, 0.2)",
            border: "1px solid rgba(239, 68, 68, 0.5)",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "16px",
            color: "#FCA5A5",
            fontSize: "13px",
          }}>
            ❌ {error}
          </div>
        )}

        {success && (
          <div style={{
            background: "rgba(16, 185, 129, 0.2)",
            border: "1px solid rgba(16, 185, 129, 0.5)",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "16px",
            color: "#A7F3D0",
            fontSize: "13px",
          }}>
            ✅ Reset succesvol! Redirect naar locker...
          </div>
        )}

        <button
          onClick={handleReset}
          disabled={loading}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "12px",
            background: loading
              ? "rgba(107, 114, 128, 0.5)"
              : "linear-gradient(135deg, #F59E0B, #D97706)",
            color: "#fff",
            border: "none",
            fontSize: "16px",
            fontWeight: 900,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Resetting..." : "Reset Now"}
        </button>

        <p style={{
          color: "#6B7280",
          fontSize: "12px",
          marginTop: "16px",
        }}>
          Je wordt automatisch naar /locker redirect als het succesvol is.
        </p>
      </div>
    </div>
  );
}
