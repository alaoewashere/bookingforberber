"use client";

import type { Appointment } from "@/lib/types";
import { formatTimeDisplay } from "@/lib/slots";
import { ar, statusLabelAr } from "@/lib/i18n/ar";

interface TimeSlotProps {
  appointment: Appointment;
  onBook: (appointment: Appointment) => void;
}

export default function TimeSlot({ appointment, onBook }: TimeSlotProps) {
  const avail  = appointment.status === "available";
  const booked = appointment.status === "booked";

  return (
    <button
      type="button"
      onClick={() => avail && onBook(appointment)}
      disabled={!avail}
      className={avail ? "m-slot-available" : booked ? "m-slot-booked" : "m-slot-blocked"}
    >
      <span className="m-slot-time" dir="ltr">{formatTimeDisplay(appointment.time_slot)}</span>
      <span className={avail ? "m-badge-available" : booked ? "m-badge-booked" : "m-badge-blocked"}>
        {statusLabelAr(appointment.status)}
      </span>
      {avail && (
        <span style={{
          marginInlineStart: "auto",
          width: 28, height: 28, borderRadius: "50%",
          background: "var(--m-elevated2)",
          border: "1px solid var(--m-border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1rem", color: "var(--m-brown-light)",
          flexShrink: 0,
        }} aria-hidden>+</span>
      )}
      {!avail && (
        <span style={{ fontFamily: "var(--font-thmanyah)", fontWeight: 300, fontSize: "0.8rem", color: "var(--m-muted)", marginInlineStart: "auto" }}>
          {booked ? ar.slot.booked : ar.slot.unavailable}
        </span>
      )}
    </button>
  );
}
