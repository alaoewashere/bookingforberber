"use client";

import { useEffect, useRef, useState } from "react";
import type { Appointment, ServiceType } from "@/lib/types";
import { formatTimeDisplay } from "@/lib/slots";
import { useLang } from "@/lib/lang-context";

interface BookingModalProps {
  appointment: Appointment | null;
  open: boolean;
  onClose: () => void;
  onBook: (name: string, phone: string, service: ServiceType) => Promise<void>;
}

type Phase = "form" | "saving" | "success";

const SERVICE_ICONS: Record<ServiceType, string> = {
  hair: "✂",
  beard: "🪒",
  hair_beard: "✂+",
};

export default function BookingModal({ appointment, open, onClose, onBook }: BookingModalProps) {
  const { t, lang } = useLang();

  const SERVICES: { value: ServiceType; label: string }[] = [
    { value: "hair",       label: t.services.hair },
    { value: "beard",      label: t.services.beard },
    { value: "hair_beard", label: t.services.hair_beard },
  ];

  const [name,    setName]    = useState("");
  const [phone,   setPhone]   = useState("");
  const [service, setService] = useState<ServiceType | "">("");
  const [error,   setError]   = useState("");
  const [phase,   setPhase]   = useState<Phase>("form");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setName(""); setPhone(""); setService(""); setError(""); setPhase("form");
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [open, appointment?.id]);

  if (!open || !appointment) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim(), p = phone.trim();
    if (!n) { setError(t.booking.nameRequired); return; }
    if (!p) { setError(t.booking.phoneRequired); return; }
    if (!service) { setError(t.booking.serviceRequired); return; }
    setPhase("saving"); setError("");
    try {
      await onBook(n, p, service as ServiceType);
      setPhase("success");
      timerRef.current = setTimeout(onClose, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.booking.saveFailed);
      setPhase("form");
    }
  }

  const F: React.CSSProperties = { fontFamily: "var(--font-thmanyah)" };

  /* ── Success ── */
  if (phase === "success") {
    return (
      <div className="m-confirm-overlay" onClick={onClose}>
        <div className="m-confirm-card" onClick={(e) => e.stopPropagation()}>
          <div className="m-confirm-ring">
            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="1.5" className="m-confirm-circle" opacity="0" />
              <path d="M24 40 L35 52 L57 28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="m-confirm-check" />
            </svg>
          </div>
          <h2 className="m-confirm-title">{t.booking.successTitle}</h2>
          <p className="m-confirm-detail">{formatTimeDisplay(appointment.time_slot, lang)}{service ? ` — ${t.services[service as ServiceType]}` : ""}</p>
          <p className="m-confirm-sub">{t.booking.successSub}</p>
          <div className="m-confirm-progress-track"><div className="m-confirm-progress-bar" /></div>
        </div>
      </div>
    );
  }

  /* ── Form ── */
  return (
    <div className="m-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="bm-title" onClick={onClose}>
      <div className="m-modal" dir={t.dir} onClick={(e) => e.stopPropagation()} style={{ padding: 0, overflow: "hidden" }}>

        {/* ── Header band ── */}
        <div style={{
          background: "linear-gradient(135deg, var(--m-elevated2) 0%, var(--m-elevated) 100%)",
          borderBottom: "1px solid var(--m-border)",
          padding: "1.25rem 1.25rem 1rem",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem",
        }}>
          <div>
            <p style={{ ...F, fontWeight: 300, fontSize: "0.68rem", color: "var(--m-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.3rem" }}>
              {t.booking.title}
            </p>
            <h2 id="bm-title" style={{ ...F, fontWeight: 700, fontSize: "1.7rem", color: "var(--m-cream)", lineHeight: 1 }}>
              {formatTimeDisplay(appointment.time_slot, lang)}
            </h2>
            <p style={{ ...F, fontWeight: 300, fontSize: "0.75rem", color: "var(--m-brown-light)", marginTop: "0.25rem" }}>
              {appointment.date}
            </p>
          </div>
          <button
            type="button" onClick={onClose} aria-label="Close"
            style={{
              width: 32, height: 32, borderRadius: "50%", border: "1px solid var(--m-border)",
              background: "var(--m-elevated2)", color: "var(--m-muted)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem",
              flexShrink: 0, transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--m-cream)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--m-muted)")}
          >×</button>
        </div>

        {/* ── Body ── */}
        <form onSubmit={handleSubmit} style={{ padding: "1.25rem", paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>

          {/* Name */}
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="bm-name" style={{ ...F, fontWeight: 300, fontSize: "0.7rem", color: "var(--m-muted)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: "0.45rem" }}>
              {t.booking.customerName}
            </label>
            <input
              id="bm-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
              autoFocus placeholder={t.booking.placeholder}
              className="m-input" dir={t.dir}
              style={{ fontSize: "1rem" }}
            />
          </div>

          {/* Phone */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label htmlFor="bm-phone" style={{ ...F, fontWeight: 300, fontSize: "0.7rem", color: "var(--m-muted)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: "0.45rem" }}>
              {t.booking.phone}
            </label>
            <input
              id="bm-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder={t.booking.phonePlaceholder}
              className="m-input" dir="ltr"
              style={{ fontSize: "1rem", letterSpacing: "0.03em" }}
            />
          </div>

          {/* Service */}
          <div style={{ marginBottom: "1.25rem" }}>
            <p style={{ ...F, fontWeight: 300, fontSize: "0.7rem", color: "var(--m-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.6rem" }}>
              {t.booking.service}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
              {SERVICES.map((s) => {
                const active = service === s.value;
                return (
                  <button
                    key={s.value} type="button" onClick={() => setService(s.value)}
                    style={{
                      ...F,
                      fontWeight: active ? 700 : 400,
                      fontSize: "0.82rem",
                      color: active ? "var(--m-bg)" : "var(--m-cream-2)",
                      background: active ? "var(--m-brown-light)" : "var(--m-elevated2)",
                      border: `1px solid ${active ? "var(--m-brown-light)" : "var(--m-border)"}`,
                      borderRadius: "10px",
                      padding: "0.75rem 0.4rem",
                      cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem",
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: "1rem", lineHeight: 1 }}>{SERVICE_ICONS[s.value]}</span>
                    <span style={{ lineHeight: 1.2, textAlign: "center" }}>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p style={{ ...F, fontSize: "0.82rem", color: "var(--m-red)", marginBottom: "0.75rem" }}>{error}</p>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button type="button" onClick={onClose} className="m-btn-secondary" style={{ flex: "0 0 auto", padding: "0 1.1rem" }}>
              {t.booking.cancel}
            </button>
            <button type="submit" disabled={phase === "saving"} className="m-btn-primary" style={{ flex: 1 }}>
              {phase === "saving" ? t.booking.saving : t.booking.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
