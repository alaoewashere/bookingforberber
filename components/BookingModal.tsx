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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-title"
    >
      <div className="w-full max-w-md rounded-xl border border-barber-border bg-barber-surface p-6 shadow-xl">
        <h2 id="booking-title" className="text-xl font-bold text-barber-gold">
          {ar.booking.title}
        </h2>
        <p className="mt-1 text-sm text-gray-400" dir="ltr">
          {formatTimeDisplay(appointment.time_slot)}
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="customer-name"
              className="mb-1 block text-sm text-gray-300"
            >
              {ar.booking.customerName}
            </label>
            <input
              id="customer-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              placeholder={ar.booking.placeholder}
              className="w-full rounded-lg border border-barber-border bg-barber-bg px-4 py-3 text-white outline-none focus:border-barber-gold focus:ring-1 focus:ring-barber-gold"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-barber-border px-4 py-2 text-gray-300 transition hover:bg-barber-bg"
            >
              {ar.booking.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-barber-gold px-4 py-2 font-semibold text-barber-bg transition hover:bg-barber-gold-light disabled:opacity-50"
            >
              {saving ? ar.booking.saving : ar.booking.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
