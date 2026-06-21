"use client";

import { useState } from "react";
import { ar } from "@/lib/i18n/ar";

interface AdminLoginProps { onSuccess: () => void; }

export default function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) { setError(ar.admin.invalidPassword); return; }
      onSuccess();
    } catch { setError(ar.admin.loginFailed); }
    finally { setLoading(false); }
  }

  return (
    <div className="mx-auto w-full max-w-xs m-anim-fade" dir="rtl">
      <div className="mb-8">
        <p className="m-section-label mb-2">وصول مقيّد</p>
        <h1 className="m-heading" style={{ fontSize: "1.6rem" }}>{ar.admin.loginTitle}</h1>
        <p className="m-subtitle">{ar.admin.loginSubtitle}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={ar.admin.password}
          required
          dir="ltr"
          className="m-input"
          autoFocus
        />
        {error && (
          <p style={{ fontFamily: "var(--font-thmanyah)", fontWeight: 400, fontSize: "0.85rem", color: "var(--m-red)" }}>
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} className="m-btn-primary w-full">
          {loading ? ar.admin.checking : ar.admin.signIn}
        </button>
      </form>
    </div>
  );
}
