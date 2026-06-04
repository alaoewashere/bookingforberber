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

      {dates.length === 0 ? (
        <div className="y2k-empty">
          <p className="y2k-empty-text">{ar.home.noDays}</p>
          <button type="button" onClick={() => setAddOpen(true)} className="y2k-btn-ghost mt-4">
            {ar.home.addFirstDay}
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {dates.map((date) => (
            <li key={date}>
              <Link href={`/day/${date}`} className="y2k-card-interactive">
                <span className="y2k-card-title">{formatDateLabel(date)}</span>
                <span className="y2k-card-date" dir="ltr">
                  {date}
                </span>
                {date === today && <span className="y2k-pill-tag">{ar.home.today}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <AddDayModal open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}
