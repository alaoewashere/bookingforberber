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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-barber-border bg-barber-surface p-6">
        <h2 className="text-xl font-bold text-barber-gold">{ar.addDay.title}</h2>
        <p className="mt-1 text-sm text-gray-400">{ar.addDay.subtitle}</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            dir="ltr"
            className="w-full rounded-lg border border-barber-border bg-barber-bg px-4 py-3 text-white outline-none focus:border-barber-gold"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-barber-border py-2 text-gray-300 hover:bg-barber-bg"
            >
              {ar.addDay.cancel}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-barber-gold py-2 font-semibold text-barber-bg disabled:opacity-50"
            >
              {loading ? ar.addDay.creating : ar.addDay.create}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
