import Link from "next/link";
import { notFound } from "next/navigation";
import DaySchedule from "@/components/DaySchedule";
import { ensureDaySlots } from "@/lib/appointments";
import { isValidDateParam } from "@/lib/slots";
import { getDayLabel } from "@/lib/day-label";
import { getScheduleDay } from "@/lib/schedule-days";
import { ar } from "@/lib/i18n/ar";

export const dynamic = "force-dynamic";

interface DayPageProps {
  params: Promise<{ date: string }>;
}

export default async function DayPage({ params }: DayPageProps) {
  const { date } = await params;

  if (!isValidDateParam(date)) {
    notFound();
  }

  let appointments;
  try {
    appointments = await ensureDaySlots(date);
  } catch {
    return (
      <div className="y2k-error">
        <p>{ar.day.loadError}</p>
        <Link href="/" className="y2k-error-link">
          {ar.day.backHome}
        </Link>
      </div>
    );
  }

  const booked = appointments.filter((a) => a.status === "booked").length;
  const other = appointments.length - booked;

  let dayLabel = date;
  try {
    const meta = await getScheduleDay(date);
    dayLabel = getDayLabel(date, meta?.display_name);
  } catch {
    dayLabel = getDayLabel(date, null);
  }

  return (
    <div>
      <Link href="/" className="y2k-link-back">
        {ar.day.backDays}
      </Link>
      <div className="mb-6 sm:mb-8">
        <h1 className="y2k-heading y2k-heading-compact">{dayLabel}</h1>
        <p className="mt-2 flex flex-wrap gap-x-2 gap-y-1 y2k-meta">
          <span>{ar.day.hoursRange}</span>
          <span className="hidden text-y2k-gold/40 sm:inline" aria-hidden>
            ·
          </span>
          <span>{ar.day.bookedCount(booked)}</span>
          <span className="hidden text-y2k-gold/40 sm:inline" aria-hidden>
            ·
          </span>
          <span>{ar.day.otherCount(other)}</span>
        </p>
      </div>
      <DaySchedule initialAppointments={appointments} date={date} />
    </div>
  );
}
