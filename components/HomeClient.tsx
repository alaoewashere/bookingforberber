"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDateLabel, todayISO } from "@/lib/slots";
import { ar } from "@/lib/i18n/ar";
import AddDayModal from "@/components/AddDayModal";

interface HomeClientProps {
  dates: string[];
}

export default function HomeClient({ dates }: HomeClientProps) {
  const [addOpen, setAddOpen] = useState(false);
  const today = todayISO();

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{ar.home.title}</h1>
          <p className="mt-2 text-gray-400">{ar.home.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/day/${today}`}
            className="rounded-lg bg-barber-gold px-5 py-2.5 text-sm font-semibold text-barber-bg transition hover:bg-barber-gold-light"
          >
            {ar.home.openToday}
          </Link>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="rounded-lg border border-barber-gold px-5 py-2.5 text-sm font-semibold text-barber-gold transition hover:bg-barber-gold/10"
          >
            {ar.home.addDay}
          </button>
        </div>
      </div>

      {dates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-barber-border bg-barber-surface/50 p-12 text-center">
          <p className="text-gray-400">{ar.home.noDays}</p>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="mt-4 text-barber-gold hover:underline"
          >
            {ar.home.addFirstDay}
          </button>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {dates.map((date) => (
            <li key={date}>
              <Link
                href={`/day/${date}`}
                className="block rounded-xl border border-barber-border bg-barber-surface p-5 transition hover:border-barber-gold/50 hover:shadow-lg hover:shadow-barber-gold/5"
              >
                <span className="text-lg font-semibold text-white">
                  {formatDateLabel(date)}
                </span>
                <span className="mt-1 block font-mono text-sm text-gray-500" dir="ltr">
                  {date}
                </span>
                {date === today && (
                  <span className="mt-2 inline-block rounded bg-barber-gold/20 px-2 py-0.5 text-xs text-barber-gold">
                    {ar.home.today}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <AddDayModal open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}
