import Link from "next/link";
import { notFound } from "next/navigation";
import DaySchedule from "@/components/DaySchedule";
import { ensureDaySlots } from "@/lib/appointments";
import { formatDateLabel, isValidDateParam } from "@/lib/slots";
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
      <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-6 text-red-300">
        <p>{ar.day.loadError}</p>
        <Link href="/" className="mt-4 inline-block text-barber-gold hover:underline">
          {ar.day.backHome}
        </Link>
      </div>
    );
  }

  const booked = appointments.filter((a) => a.status === "booked").length;
  const other = appointments.length - booked;

  return (
    <div>
      <Link
        href="/"
        className="mb-6 inline-flex text-sm text-gray-400 transition hover:text-barber-gold"
      >
        {ar.day.backDays}
      </Link>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">{formatDateLabel(date)}</h1>
        <p className="mt-2 text-gray-400">
          {ar.day.hoursRange} · {ar.day.bookedCount(booked)} ·{" "}
          {ar.day.otherCount(other)}
        </p>
      </div>
      <DaySchedule initialAppointments={appointments} date={date} />
    </div>
  );
}
