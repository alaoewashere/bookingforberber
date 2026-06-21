import Link from "next/link";
import { notFound } from "next/navigation";
import DaySchedule from "@/components/DaySchedule";
import { ensureDaySlots } from "@/lib/appointments";
import { isValidDateParam } from "@/lib/slots";
import { getDayLabel } from "@/lib/day-label";
import { getScheduleDay } from "@/lib/schedule-days";
import { ar } from "@/lib/i18n/ar";

export const dynamic = "force-dynamic";

interface DayPageProps { params: Promise<{ date: string }>; }

export default async function DayPage({ params }: DayPageProps) {
  const { date } = await params;
  if (!isValidDateParam(date)) notFound();

  let appointments;
  try {
    appointments = await ensureDaySlots(date);
  } catch {
    return (
      <div className="m-error">
        <p>{ar.day.loadError}</p>
        <Link href="/" className="m-link-back mt-4 inline-flex">{ar.day.backHome}</Link>
      </div>
    );
  }

  const booked = appointments.filter((a) => a.status === "booked").length;
  const other  = appointments.length - booked;

  let dayLabel = date;
  try {
    const meta = await getScheduleDay(date);
    dayLabel = getDayLabel(date, meta?.display_name);
  } catch {
    dayLabel = getDayLabel(date, null);
  }

  return (
    <div dir="rtl" className="m-anim-fade">
      <Link href="/" className="m-link-back">← {ar.day.backDays}</Link>
      <div className="mb-8">
        <p className="m-section-label mb-2">{ar.day.hoursRange}</p>
        <h1 className="m-heading">{dayLabel}</h1>
        <p className="m-subtitle">
          {ar.day.bookedCount(booked)} · {ar.day.otherCount(other)}
        </p>
      </div>
      <DaySchedule initialAppointments={appointments} date={date} />
    </div>
  );
}
