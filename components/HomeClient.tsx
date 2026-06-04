"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDateLabel, todayISO } from "@/lib/slots";
import { getDayLabel } from "@/lib/day-label";
import type { ScheduleDay } from "@/lib/types";
import { ar } from "@/lib/i18n/ar";
import AddDayModal from "@/components/AddDayModal";
import EditDayModal from "@/components/EditDayModal";
import DayCardActions from "@/components/DayCardActions";

interface HomeClientProps {
  initialDays: ScheduleDay[];
}

export default function HomeClient({ initialDays }: HomeClientProps) {
  const router = useRouter();
  const [days, setDays] = useState(initialDays);
  const [addOpen, setAddOpen] = useState(false);
  const [editDay, setEditDay] = useState<ScheduleDay | null>(null);
  const [deletingDate, setDeletingDate] = useState<string | null>(null);
  const today = todayISO();

  async function handleDelete(date: string) {
    if (!confirm(ar.home.deleteConfirm)) return;

    setDeletingDate(date);
    try {
      const res = await fetch(`/api/days/${date}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? ar.home.deleteFailed);
      setDays((prev) => prev.filter((d) => d.date !== date));
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : ar.home.deleteFailed);
    } finally {
      setDeletingDate(null);
    }
  }

  function handleSaved(updated: ScheduleDay) {
    setDays((prev) =>
      prev.map((d) => (d.date === updated.date ? updated : d))
    );
    router.refresh();
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="y2k-heading">{ar.home.title}</h1>
          <p className="y2k-subtitle">{ar.home.subtitle}</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-3">
          <Link href={`/day/${today}`} className="y2k-btn-primary">
            {ar.home.openToday}
          </Link>
          <button type="button" onClick={() => setAddOpen(true)} className="y2k-btn-secondary">
            {ar.home.addDay}
          </button>
        </div>
      </div>

      {days.length === 0 ? (
        <div className="y2k-empty">
          <p className="y2k-empty-text">{ar.home.noDays}</p>
          <button type="button" onClick={() => setAddOpen(true)} className="y2k-btn-ghost mt-4">
            {ar.home.addFirstDay}
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {days.map((day) => (
            <li key={day.date} className="group relative">
              <Link
                href={`/day/${day.date}`}
                className="y2k-card-interactive block pe-20 sm:pe-20"
              >
                <span className="y2k-card-title">{getDayLabel(day.date, day.display_name)}</span>
                {day.display_name && (
                  <span className="mt-0.5 block text-xs font-bold text-y2k-muted">
                    {formatDateLabel(day.date)}
                  </span>
                )}
                <span className="y2k-card-date" dir="ltr">
                  {day.date}
                </span>
                {day.date === today && <span className="y2k-pill-tag">{ar.home.today}</span>}
              </Link>
              <DayCardActions
                onEdit={() => setEditDay(day)}
                onDelete={() => handleDelete(day.date)}
                deleting={deletingDate === day.date}
                editLabel={ar.home.editDay}
                deleteLabel={ar.home.deleteDay}
              />
            </li>
          ))}
        </ul>
      )}

      <AddDayModal open={addOpen} onClose={() => setAddOpen(false)} />
      <EditDayModal
        day={editDay}
        open={editDay !== null}
        onClose={() => setEditDay(null)}
        onSaved={handleSaved}
      />
    </>
  );
}
