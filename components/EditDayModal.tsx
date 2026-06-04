"use client";

import { useEffect, useState } from "react";
import type { ScheduleDay } from "@/lib/types";
import { ar } from "@/lib/i18n/ar";

interface EditDayModalProps {
  day: ScheduleDay | null;
  open: boolean;
  onClose: () => void;
  onSaved: (updated: ScheduleDay) => void;
}

export default function EditDayModal({ day, open, onClose, onSaved }: EditDayModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && day) {
      setName(day.display_name ?? "");
      setError("");
    }
  }, [open, day]);

  if (!open || !day) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/days/${day!.date}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? ar.home.updateFailed);
      onSaved(json as ScheduleDay);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : ar.home.updateFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="y2k-modal-overlay">
      <div className="y2k-modal">
        <h2 className="y2k-modal-title">{ar.home.editTitle}</h2>
        <p className="mt-1 text-sm font-bold text-y2k-muted">{ar.home.editSubtitle}</p>
        <p className="mt-2 font-mono text-xs font-bold text-y2k-gold" dir="ltr">
          {day.date}
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="day-display-name" className="mb-1 block text-sm font-bold text-y2k-white">
              {ar.home.displayName}
            </label>
            <input
              id="day-display-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              placeholder={ar.home.displayNamePlaceholder}
              className="y2k-input"
            />
          </div>
          {error && <p className="text-sm font-bold text-red-400">{error}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
            <button type="button" onClick={onClose} className="y2k-btn-secondary min-h-11 flex-1">
              {ar.addDay.cancel}
            </button>
            <button type="submit" disabled={loading} className="y2k-btn-primary min-h-11 flex-1">
              {loading ? ar.home.savingName : ar.home.saveName}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
