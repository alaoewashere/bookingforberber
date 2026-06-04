"use client";

import { useState } from "react";
import { ar } from "@/lib/i18n/ar";

interface AdminLoginProps {
  onSuccess: () => void;
}

export default function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError(ar.admin.invalidPassword);
        return;
      }
      onSuccess();
    } catch {
      setError(ar.admin.loginFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="y2k-panel mx-auto w-full max-w-sm sm:p-8">
      <h1 className="y2k-heading y2k-heading-compact text-xl sm:text-2xl">{ar.admin.loginTitle}</h1>
      <p className="y2k-subtitle mt-2">{ar.admin.loginSubtitle}</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={ar.admin.password}
          required
          dir="ltr"
          className="y2k-input"
        />
        {error && <p className="text-sm font-bold text-red-400">{error}</p>}
        <button type="submit" disabled={loading} className="y2k-btn-primary w-full">
          {loading ? ar.admin.checking : ar.admin.signIn}
        </button>
      </form>
    </div>
  );
}
