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
    <div className="mx-auto max-w-sm rounded-xl border border-barber-border bg-barber-surface p-8">
      <h1 className="text-2xl font-bold text-barber-gold">{ar.admin.loginTitle}</h1>
      <p className="mt-2 text-sm text-gray-400">{ar.admin.loginSubtitle}</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={ar.admin.password}
          required
          dir="ltr"
          className="w-full rounded-lg border border-barber-border bg-barber-bg px-4 py-3 text-white outline-none focus:border-barber-gold"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-barber-gold py-3 font-semibold text-barber-bg disabled:opacity-50"
        >
          {loading ? ar.admin.checking : ar.admin.signIn}
        </button>
      </form>
    </div>
  );
}
