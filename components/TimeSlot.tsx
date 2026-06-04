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
    badge: "y2k-badge-available",
    card: "y2k-slot-available",
  },
  booked: {
    badge: "y2k-badge-booked",
    card: "y2k-slot-booked",
  },
  blocked: {
    badge: "y2k-badge-blocked",
    card: "y2k-slot-blocked",
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
      className={style.card}
    >
      <div className="flex min-w-0 items-center justify-between gap-2 sm:contents">
        <div className="y2k-slot-time" dir="ltr">
          {formatTimeDisplay(appointment.time_slot)}
        </div>
        <span className={style.badge}>{statusLabelAr(appointment.status)}</span>
      </div>
      <div className="min-w-0 flex-1 sm:order-2">
        {appointment.status === "booked" && appointment.customer_name ? (
          <p className="truncate text-base font-black text-y2k-white sm:text-lg">
            {appointment.customer_name}
          </p>
        ) : appointment.status === "blocked" ? (
          <p className="text-sm font-bold text-y2k-muted sm:text-base">
            {ar.slot.unavailable}
          </p>
        ) : (
          <p className="text-sm font-bold text-y2k-muted sm:text-base">{ar.slot.available}</p>
        )}
      </div>
      {canBook && (
        <span className="y2k-slot-add" aria-hidden>
          +
        </span>
      )}
    </button>
  );
}
