"use client";

import { useState } from "react";
import { ar } from "@/lib/i18n/ar";
import { verifyEmailOtp } from "@/lib/email-otp";

interface AdminLoginProps { onSuccess: () => void; }

export default function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code,     setCode]     = useState("");
  const [phase,    setPhase]    = useState<"credentials" | "code">("credentials");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/login/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError(res.status === 429 ? ar.admin.tooManyAttempts : ar.admin.invalidCredentials);
        return;
      }
      setPhase("code");
    } catch { setError(ar.admin.loginFailed); }
    finally { setLoading(false); }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const accessToken = await verifyEmailOtp(email.trim().toLowerCase(), code.trim());
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, access_token: accessToken }),
      });
      if (!res.ok) { setError(ar.admin.invalidCredentials); return; }
      onSuccess();
    } catch { setError(ar.admin.codeInvalid); }
    finally { setLoading(false); }
  }

  return (
    <div className="mx-auto w-full max-w-xs m-anim-fade" dir="rtl">
      <div className="mb-8">
        <p className="m-section-label mb-2">وصول مقيّد</p>
        <h1 className="m-heading" style={{ fontSize: "1.6rem" }}>{ar.admin.loginTitle}</h1>
        <p className="m-subtitle">{ar.admin.loginSubtitle}</p>
      </div>
      <form onSubmit={phase === "credentials" ? handleSubmit : handleVerify} className="space-y-4">
        {phase === "credentials" ? <>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={ar.admin.email}
            required
            dir="ltr"
            className="m-input"
            autoFocus
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={ar.admin.password}
            required
            dir="ltr"
            className="m-input"
          />
        </> : <>
          <p className="m-subtitle">{ar.admin.codeSent}</p>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={8}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/gu, ""))}
            placeholder={ar.admin.code}
            required
            dir="ltr"
            className="m-input"
            autoFocus
          />
        </>}
        {error && (
          <p style={{ fontFamily: "var(--font-thmanyah)", fontWeight: 400, fontSize: "0.85rem", color: "var(--m-red)" }}>
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} className="m-btn-primary w-full">
          {loading ? ar.admin.checking : phase === "credentials" ? ar.admin.sendCode : ar.admin.verifyCode}
        </button>
      </form>
    </div>
  );
}
