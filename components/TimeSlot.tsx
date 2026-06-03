"use client";

import type { Appointment } from "@/lib/types";
import { formatTimeDisplay } from "@/lib/slots";
import { ar, statusLabelAr } from "@/lib/i18n/ar";

interface TimeSlotProps {
  appointment: Appointment;
  onBook: (appointment: Appointment) => void;
}

const statusStyles: Record<
  Appointment["status"],
  { badge: string; card: string }
> = {
  available: {
    badge: "bg-emerald-900/60 text-emerald-300 border-emerald-700",
    card: "border-barber-border bg-barber-surface hover:border-gray-500",
  },
  booked: {
    badge: "bg-red-900/60 text-red-300 border-red-700",
    card: "border-red-900/50 bg-red-950/30",
  },
  blocked: {
    badge: "bg-amber-900/60 text-amber-300 border-amber-700",
    card: "border-amber-900/40 bg-amber-950/20 opacity-80",
  },
};

export default function TimeSlot({ appointment, onBook }: TimeSlotProps) {
  const style = statusStyles[appointment.status];
  const canBook = appointment.status === "available";

  return (
    <button
      type="button"
      onClick={() => canBook && onBook(appointment)}
      disabled={!canBook}
      className={`flex w-full items-center gap-3 rounded-lg border p-4 text-start transition ${style.card} ${
        canBook ? "cursor-pointer" : "cursor-default"
      }`}
    >
      <div
        className="w-28 shrink-0 text-sm font-semibold text-barber-gold"
        dir="ltr"
      >
        {formatTimeDisplay(appointment.time_slot)}
      </div>
      <div className="min-w-0 flex-1">
        {appointment.status === "booked" && appointment.customer_name ? (
          <p className="truncate text-lg font-medium text-white">
            {appointment.customer_name}
          </p>
        ) : appointment.status === "blocked" ? (
          <p className="text-gray-400">{ar.slot.unavailable}</p>
        ) : (
          <p className="text-gray-400">{ar.slot.available}</p>
        )}
      </div>
      <span
        className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${style.badge}`}
      >
        {statusLabelAr(appointment.status)}
      </span>
      {canBook && (
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-barber-gold/20 text-lg text-barber-gold"
          aria-hidden
        >
          +
        </span>
      )}
    </button>
  );
}
