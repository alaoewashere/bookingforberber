"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ar } from "@/lib/i18n/ar";

interface AddDayModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AddDayModal({ open, onClose }: AddDayModalProps) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? ar.addDay.createDayFailed);
      onClose();
      router.push(`/day/${date}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : ar.addDay.failed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="y2k-modal-overlay">
      <div className="y2k-modal">
        <h2 className="y2k-modal-title">{ar.addDay.title}</h2>
        <p className="mt-1 text-sm font-bold text-y2k-muted">{ar.addDay.subtitle}</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            dir="ltr"
            className="y2k-input"
          />
          {error && <p className="text-sm font-bold text-red-400">{error}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
            <button type="button" onClick={onClose} className="y2k-btn-secondary min-h-11 flex-1">
              {ar.addDay.cancel}
            </button>
            <button type="submit" disabled={loading} className="y2k-btn-primary min-h-11 flex-1">
              {loading ? ar.addDay.creating : ar.addDay.create}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
