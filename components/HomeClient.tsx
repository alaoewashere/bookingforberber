"use client";

import { useState, useEffect, useCallback } from "react";
import type { Appointment, ServiceType } from "@/lib/types";
import { formatTimeDisplay } from "@/lib/slots";
import { useLang } from "@/lib/lang-context";
import BookingModal from "@/components/BookingModal";

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function getWeekMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? 1 : 1 - day));
  return d;
}

interface WeekDay {
  date: string; jsDate: Date;
  dayName: string;
  dayNum: number; isSunday: boolean;
}

function buildWeekDays(monday: Date, weekdays: string[]): WeekDay[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const jsDay = d.getDay();
    return {
      date: toISO(d), jsDate: d,
      dayName: weekdays[jsDay],
      dayNum: d.getDate(), isSunday: jsDay === 0,
    };
  });
}

function formatWeekRange(monday: Date, months: string[]): string {
  const sat = new Date(monday); sat.setDate(monday.getDate() + 5);
  const sameMonth = monday.getMonth() === sat.getMonth();
  return sameMonth
    ? `${monday.getDate()}–${sat.getDate()} ${months[monday.getMonth()]}`
    : `${monday.getDate()} ${months[monday.getMonth()]} – ${sat.getDate()} ${months[sat.getMonth()]}`;
}

const F: React.CSSProperties = { fontFamily: "var(--font-thmanyah)" };

export default function HomeClient() {
  const { t, lang } = useLang();

  const [weekMonday,   setWeekMonday]   = useState<Date>(() => getWeekMonday(new Date()));
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [slots,        setSlots]        = useState<Appointment[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Appointment | null>(null);

  const weekDays    = buildWeekDays(weekMonday, t.weekdays);
  const displayDays = weekDays.filter((d) => !d.isSunday);
  const todayStr    = toISO(new Date());

  useEffect(() => {
    const inWeek = displayDays.find((d) => d.date === todayStr);
    setSelectedDate(inWeek ? todayStr : displayDays[0]?.date ?? "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekMonday]);

  const fetchSlots = useCallback((date: string) => {
    if (!date) return;
    setLoading(true);
    fetch(`/api/appointments?date=${date}`)
      .then((r) => r.json())
      .then((d) => setSlots(Array.isArray(d)
        ? d.filter((s) => { const h = parseInt(s.time_slot, 10); return h >= 12 && h <= 22; })
        : []))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (selectedDate) fetchSlots(selectedDate); }, [selectedDate, fetchSlots]);

  function goWeek(delta: number) {
    setWeekMonday((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta * 7);
      return d;
    });
  }

  async function handleBook(name: string, phone: string, service: ServiceType) {
    if (!selectedSlot) return;
    const res = await fetch("/api/appointments/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: selectedSlot.date, time_slot: selectedSlot.time_slot,
        customer_name: name, phone, service,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? t.booking.saveFailed);
    const saved = json as Appointment;
    setSlots((prev) =>
      prev.map((s) => s.date === saved.date && s.time_slot === saved.time_slot ? saved : s)
    );
  }

  const selectedDay = displayDays.find((d) => d.date === selectedDate);

  return (
    <div dir={t.dir} className="m-anim-fade">

      {/* Page header */}
      <div className="mb-7 sm:mb-10">
        <p className="m-section-label mb-1.5">
          {t.dir === "rtl" ? "مرحباً بك" : "Hoş Geldiniz"}
        </p>
        <h1 className="m-heading">{t.home.title}</h1>
        <p className="m-subtitle">{t.home.subtitle}</p>
      </div>

      {/* Week navigation */}
      <div className="mb-3 flex items-center gap-2 sm:gap-4">
        <button
          type="button" onClick={() => goWeek(t.dir === "rtl" ? -1 : 1)}
          className="m-btn-secondary shrink-0"
          style={{ minHeight: "2.2rem", padding: "0.3rem 0.75rem", fontSize: "0.9rem" }}
          aria-label={t.home.prevWeek}
        >{t.dir === "rtl" ? "←" : "→"}</button>

        <span
          className="min-w-0 flex-1 text-center"
          style={{ ...F, fontWeight: 300, fontSize: "clamp(0.7rem, 3vw, 0.85rem)", color: "var(--m-muted)", letterSpacing: "0.03em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {formatWeekRange(weekMonday, t.months)}
        </span>

        <button
          type="button" onClick={() => goWeek(t.dir === "rtl" ? 1 : -1)}
          className="m-btn-secondary shrink-0"
          style={{ minHeight: "2.2rem", padding: "0.3rem 0.75rem", fontSize: "0.9rem" }}
          aria-label={t.home.nextWeek}
        >{t.dir === "rtl" ? "→" : "←"}</button>
      </div>

      {/* Day tabs — Mon to Sat */}
      <div
        className="mb-6"
        style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "clamp(3px, 1vw, 8px)" }}
      >
        {displayDays.map((day) => {
          const isSelected = day.date === selectedDate;
          const isToday    = day.date === todayStr;
          return (
            <button
              key={day.date}
              type="button"
              onClick={() => setSelectedDate(day.date)}
              className={`m-day-tab ${isSelected ? "m-day-tab-active" : ""}`}
            >
              <span style={{
                ...F, fontWeight: 300,
                fontSize: "clamp(0.42rem, 1.5vw, 0.6rem)",
                letterSpacing: "-0.01em",
                color: isSelected ? "rgba(12,8,6,0.6)" : "var(--m-muted)",
                lineHeight: 1,
                wordBreak: "keep-all",
              }}>
                {day.dayName}
              </span>
              <span style={{
                ...F, fontWeight: 700,
                fontSize: "clamp(0.9rem, 3.5vw, 1.15rem)",
                color: isSelected ? "var(--m-bg)" : "var(--m-cream)",
                lineHeight: 1.1,
              }}>
                {day.dayNum}
              </span>
              {isToday && (
                <span style={{
                  width: 3, height: 3, borderRadius: "50%",
                  background: isSelected ? "rgba(12,8,6,0.4)" : "var(--m-brown-light)",
                  flexShrink: 0,
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day label */}
      {selectedDay && (
        <div className="mb-4 m-anim-up">
          <p style={{ ...F, fontWeight: 700, fontSize: "clamp(0.95rem, 4vw, 1.1rem)", color: "var(--m-cream)", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
            {selectedDay.dayName}
            {selectedDay.date === todayStr && <span className="m-pill">{t.home.today}</span>}
          </p>
          <p style={{ ...F, fontWeight: 300, fontSize: "0.78rem", color: "var(--m-muted)", marginTop: 3 }}>
            {selectedDay.jsDate.toLocaleDateString(t.locale, { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      )}

      {/* Slots */}
      {loading ? (
        <div className="m-empty">
          <p style={{ ...F, fontWeight: 300, color: "var(--m-muted)", animation: "pulse 1.5s ease infinite" }}>
            {t.home.loading}
          </p>
        </div>
      ) : slots.length === 0 ? (
        <div className="m-empty">
          <p style={{ ...F, fontWeight: 300, color: "var(--m-muted)" }}>{t.home.noSlots}</p>
        </div>
      ) : (
        <div
          className="m-anim-up"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 16rem), 1fr))",
            gap: "clamp(6px, 2vw, 10px)",
          }}
        >
          {slots.map((slot) => {
            const avail  = slot.status === "available";
            const booked = slot.status === "booked";
            return (
              <button
                key={`${slot.date}-${slot.time_slot}`}
                type="button"
                disabled={!avail}
                onClick={() => { if (avail) { setSelectedSlot(slot); setModalOpen(true); } }}
                className={avail ? "m-slot-available" : booked ? "m-slot-booked" : "m-slot-blocked"}
              >
                <span className="m-slot-time" dir="ltr">
                  {formatTimeDisplay(slot.time_slot, lang)}
                </span>
                <span className={avail ? "m-badge-available" : booked ? "m-badge-booked" : "m-badge-blocked"}>
                  {avail ? t.slot.available : booked ? t.slot.booked : t.slot.blocked}
                </span>
                {avail && (
                  <span style={{
                    marginInlineStart: "auto",
                    width: "clamp(22px, 6vw, 28px)", height: "clamp(22px, 6vw, 28px)",
                    borderRadius: "50%",
                    background: "var(--m-elevated2)",
                    border: "1px solid var(--m-border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1rem", color: "var(--m-brown-light)", flexShrink: 0,
                  }} aria-hidden>+</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <BookingModal
        appointment={selectedSlot}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedSlot(null); }}
        onBook={handleBook}
      />
    </div>
  );
}
