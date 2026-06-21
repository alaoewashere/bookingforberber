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
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [open, appointment?.id]);

  if (!open || !appointment) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim(), p = phone.trim();
    if (!n) { setError(t.booking.nameRequired); return; }
    if (!p) { setError(t.booking.phoneRequired); return; }
    if (!service) { setError(t.booking.serviceRequired); return; }

    setPhase("saving");
    setError("");
    try {
      await onBook(n, p, service as ServiceType);
      setPhase("success");
      timerRef.current = setTimeout(onClose, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.booking.saveFailed);
      setPhase("form");
    }
  }

  /* ── Success screen ── */
  if (phase === "success") {
    return (
      <div className="m-confirm-overlay" onClick={onClose}>
        <div className="m-confirm-card" onClick={(e) => e.stopPropagation()}>
          <div className="m-confirm-ring">
            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle
                cx="40" cy="40" r="36"
                stroke="currentColor" strokeWidth="1.5"
                className="m-confirm-circle"
                opacity="0"
              />
              <path
                d="M24 40 L35 52 L57 28"
                stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
                className="m-confirm-check"
              />
            </svg>
          </div>

          <h2 className="m-confirm-title">{t.booking.successTitle}</h2>
          <p className="m-confirm-detail">
            {formatTimeDisplay(appointment.time_slot, lang)}
            {service ? ` — ${t.services[service as ServiceType]}` : ""}
          </p>
          <p className="m-confirm-sub">{t.booking.successSub}</p>

          <div className="m-confirm-progress-track">
            <div className="m-confirm-progress-bar" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Form ── */
  return (
    <div
      className="m-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bm-title"
      onClick={onClose}
    >
      <div className="m-modal" dir={t.dir} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 id="bm-title" className="m-modal-title">{t.booking.title}</h2>
            <p className="mt-1 text-sm font-light text-m-brown-light" dir="ltr" style={{ fontFamily: "var(--font-thmanyah)" }}>
              {formatTimeDisplay(appointment.time_slot, lang)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-m-muted transition hover:text-m-cream"
            style={{ background: "var(--m-elevated)", fontSize: "1.1rem" }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="bm-name" className="m-section-label mb-2 block">
              {t.booking.customerName}
            </label>
            <input
              id="bm-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              placeholder={t.booking.placeholder}
              className="m-input"
              dir={t.dir}
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="bm-phone" className="m-section-label mb-2 block">
              {t.booking.phone}
            </label>
            <input
              id="bm-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t.booking.phonePlaceholder}
              className="m-input"
              dir="ltr"
            />
          </div>

          {/* Service */}
          <div>
            <p className="m-section-label mb-2">{t.booking.service}</p>
            <div className="grid grid-cols-3 gap-2">
              {SERVICES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setService(s.value)}
                  className={service === s.value ? "m-service-opt m-service-opt-active" : "m-service-opt"}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-m-red" style={{ fontFamily: "var(--font-thmanyah)" }}>
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="m-btn-secondary flex-1">
              {t.booking.cancel}
            </button>
            <button
              type="submit"
              disabled={phase === "saving"}
              className="m-btn-primary flex-1"
            >
              {phase === "saving" ? t.booking.saving : t.booking.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
