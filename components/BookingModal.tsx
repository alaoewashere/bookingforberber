"use client";

import { useEffect, useState } from "react";
import type { Appointment } from "@/lib/types";
import { formatTimeDisplay } from "@/lib/slots";
import { ar } from "@/lib/i18n/ar";

interface BookingModalProps {
  appointment: Appointment | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, customerName: string) => Promise<void>;
}

export default function BookingModal({
  appointment,
  open,
  onClose,
  onSave,
}: BookingModalProps) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setError("");
    }
  }, [open, appointment?.id]);

  if (!open || !appointment) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError(ar.booking.nameRequired);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(appointment!.id, trimmed);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : ar.booking.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="y2k-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-title"
    >
      <div className="y2k-modal">
        <h2 id="booking-title" className="y2k-modal-title">
          {ar.booking.title}
        </h2>
        <p className="mt-1 font-display text-sm font-bold text-y2k-gold" dir="ltr">
          {formatTimeDisplay(appointment.time_slot)}
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="customer-name" className="mb-1 block text-sm font-bold text-y2k-white">
              {ar.booking.customerName}
            </label>
            <input
              id="customer-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              placeholder={ar.booking.placeholder}
              className="y2k-input"
            />
          </div>
          {error && <p className="text-sm font-bold text-red-400">{error}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
            <button type="button" onClick={onClose} className="y2k-btn-secondary min-h-11 flex-1">
              {ar.booking.cancel}
            </button>
            <button type="submit" disabled={saving} className="y2k-btn-primary min-h-11 flex-1">
              {saving ? ar.booking.saving : ar.booking.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
