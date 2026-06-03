"use client";

import { useCallback, useState } from "react";
import type { Appointment } from "@/lib/types";
import TimeSlot from "@/components/TimeSlot";
import BookingModal from "@/components/BookingModal";

interface DayScheduleProps {
  initialAppointments: Appointment[];
  date: string;
}

export default function DaySchedule({
  initialAppointments,
  date,
}: DayScheduleProps) {
  const [appointments, setAppointments] =
    useState<Appointment[]>(initialAppointments);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleBookClick = useCallback((appointment: Appointment) => {
    setSelected(appointment);
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(
    async (_id: string, customerName: string) => {
      if (!selected) return;

      const res = await fetch("/api/appointments/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          time_slot: selected.time_slot,
          customer_name: customerName,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "فشل الحفظ");
      }

      const saved = json as Appointment;
      setAppointments((prev) =>
        prev.map((a) =>
          a.date === saved.date && a.time_slot === saved.time_slot ? saved : a
        )
      );
    },
    [date, selected]
  );

  return (
    <>
      <div className="space-y-3">
        {appointments.map((appointment) => (
          <TimeSlot
            key={`${appointment.date}-${appointment.time_slot}`}
            appointment={appointment}
            onBook={handleBookClick}
          />
        ))}
      </div>
      <BookingModal
        appointment={selected}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </>
  );
}
