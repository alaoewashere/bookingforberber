"use client";

import { useCallback, useMemo, useState } from "react";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import {
  AR_WEEKDAYS_SHORT,
  buildMonthGrid,
  formatMonthYearAr,
  parseDateKey,
  shiftMonth,
} from "@/lib/admin-calendar";
import {
  formatAdminTimeSlot,
  formatDateLabel,
  formatTimeDisplay,
  generateTimeSlots,
  todayISO,
} from "@/lib/slots";
import { ar, statusLabelAr } from "@/lib/i18n/ar";

interface AdminCalendarProps {
  initialAppointments: Appointment[];
}

export default function AdminCalendar({ initialAppointments }: AdminCalendarProps) {
  const today = todayISO();
  const todayParts = parseDateKey(today);

  const [rows, setRows] = useState(initialAppointments);
  const [viewYear, setViewYear] = useState(todayParts.year);
  const [viewMonth, setViewMonth] = useState(todayParts.month);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [addDate, setAddDate] = useState("");
  const [addTime, setAddTime] = useState("09:00");
  const [addName, setAddName] = useState("");
  const [loading, setLoading] = useState(false);

  const timeOptions = generateTimeSlots();
  const monthCells = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const datesWithAppointments = useMemo(() => {
    const set = new Set<string>();
    for (const row of rows) set.add(row.date);
    return set;
  }, [rows]);

  const dayRows = useMemo(() => {
    if (!selectedDate) return [];
    return rows
      .filter((r) => r.date === selectedDate)
      .sort((a, b) => a.time_slot.localeCompare(b.time_slot));
  }, [rows, selectedDate]);

  const refreshRow = useCallback((updated: Appointment) => {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.id === updated.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [...prev, updated];
    });
  }, []);

  async function patchAppointment(
    id: string,
    body: Partial<{ customer_name: string | null; status: AppointmentStatus }>
  ) {
    const res = await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? ar.admin.updateFailed);
    refreshRow(json as Appointment);
  }

  async function handleSaveEdit(row: Appointment) {
    setLoading(true);
    try {
      const res = await fetch("/api/appointments/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: row.date,
          time_slot: row.time_slot,
          customer_name: editName.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? ar.admin.updateFailed);
      refreshRow(json as Appointment);
      setEditingId(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleClear(id: string) {
    if (!confirm(ar.admin.clearConfirm)) return;
    setLoading(true);
    try {
      await patchAppointment(id, { customer_name: null, status: "available" });
    } finally {
      setLoading(false);
    }
  }

  async function handleBlock(id: string) {
    setLoading(true);
    try {
      await patchAppointment(id, { customer_name: null, status: "blocked" });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!addDate || !addName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: addDate,
          time_slot: addTime,
          customer_name: addName.trim(),
          status: "booked",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? ar.admin.addFailed);
      refreshRow(json as Appointment);
      setShowAdd(false);
      setAddName("");
      setSelectedDate(addDate);
      const parts = parseDateKey(addDate);
      setViewYear(parts.year);
      setViewMonth(parts.month);
    } finally {
      setLoading(false);
    }
  }

  function handleDayClick(dateKey: string) {
    setSelectedDate((prev) => (prev === dateKey ? null : dateKey));
    setEditingId(null);
  }

  function goMonth(delta: number) {
    const next = shiftMonth(viewYear, viewMonth, delta);
    setViewYear(next.year);
    setViewMonth(next.month);
  }

  function openAddForm() {
    setShowAdd((v) => {
      const next = !v;
      if (next && selectedDate) setAddDate(selectedDate);
      return next;
    });
  }

  function customerCell(row: Appointment) {
    if (editingId === row.id) {
      return (
        <input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="y2k-input max-w-[200px] !py-1"
        />
      );
    }
    if (row.status === "available") {
      return <span className="font-black text-green-400">{ar.slot.available}</span>;
    }
    if (row.status === "booked") {
      return row.customer_name ?? ar.admin.dash;
    }
    return <span className="text-y2k-muted">{ar.slot.unavailable}</span>;
  }

  function statusBadge(status: AppointmentStatus) {
    const cls =
      status === "available"
        ? "y2k-badge-admin-available"
        : status === "booked"
          ? "y2k-badge-admin-booked"
          : "y2k-badge-admin-blocked";
    return <span className={cls}>{statusLabelAr(status)}</span>;
  }

  function rowActions(row: Appointment) {
    if (editingId === row.id) {
      return (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleSaveEdit(row)}
            disabled={loading}
            className="y2k-btn-ghost !min-h-8 text-xs"
          >
            {ar.admin.save}
          </button>
          <button
            type="button"
            onClick={() => setEditingId(null)}
            className="y2k-btn-ghost !min-h-8 text-xs text-y2k-muted"
          >
            {ar.admin.cancel}
          </button>
        </div>
      );
    }
    return (
      <div className="flex flex-wrap gap-2">
        {row.status === "booked" && (
          <button
            type="button"
            onClick={() => {
              setEditingId(row.id);
              setEditName(row.customer_name ?? "");
            }}
            className="y2k-btn-ghost !min-h-8 text-xs"
          >
            {ar.admin.edit}
          </button>
        )}
        {(row.status === "booked" || row.status === "blocked") && (
          <button
            type="button"
            onClick={() => handleClear(row.id)}
            disabled={loading}
            className="y2k-btn-ghost !min-h-8 text-xs"
          >
            {ar.admin.clear}
          </button>
        )}
        {row.status !== "blocked" && (
          <button
            type="button"
            onClick={() => handleBlock(row.id)}
            disabled={loading}
            className="y2k-btn-ghost !min-h-8 text-xs text-y2k-electric"
          >
            {ar.admin.block}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-black text-y2k-white">
          <span className="font-display text-y2k-gold" aria-hidden>
            ★{" "}
          </span>
          {ar.admin.calendarTitle}
        </h2>
        <button type="button" onClick={openAddForm} className="y2k-btn-primary w-full sm:w-auto">
          {showAdd ? ar.admin.cancel : ar.admin.addBooking}
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAddBooking}
          className="y2k-panel grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <input
            type="date"
            value={addDate}
            onChange={(e) => setAddDate(e.target.value)}
            required
            dir="ltr"
            className="y2k-input !py-2"
          />
          <select
            value={addTime}
            onChange={(e) => setAddTime(e.target.value)}
            dir="ltr"
            className="y2k-input !py-2"
          >
            {timeOptions.map((t) => (
              <option key={t} value={t}>
                {formatTimeDisplay(t)}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            placeholder={ar.admin.customerName}
            required
            className="y2k-input !py-2 sm:col-span-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="y2k-btn-primary sm:col-span-2 lg:col-span-4"
          >
            {ar.admin.saveBooking}
          </button>
        </form>
      )}

      {rows.length === 0 ? (
        <p className="y2k-empty y2k-empty-text">{ar.admin.empty}</p>
      ) : (
        <>
          <section className="y2k-admin-cal" aria-label={ar.admin.calendarTitle}>
            <div className="y2k-admin-cal-nav">
              <button
                type="button"
                onClick={() => goMonth(-1)}
                className="y2k-btn-secondary !min-h-10 !px-4 !py-2 text-xs"
                aria-label={ar.admin.prevMonth}
              >
                →
              </button>
              <p className="y2k-admin-cal-month">{formatMonthYearAr(viewYear, viewMonth)}</p>
              <button
                type="button"
                onClick={() => goMonth(1)}
                className="y2k-btn-secondary !min-h-10 !px-4 !py-2 text-xs"
                aria-label={ar.admin.nextMonth}
              >
                ←
              </button>
            </div>
            <div className="y2k-admin-cal-grid">
              {AR_WEEKDAYS_SHORT.map((label) => (
                <div key={label} className="y2k-admin-cal-weekday">
                  {label}
                </div>
              ))}
              {monthCells.map((cell, i) =>
                cell.dateKey && cell.day ? (
                  <div key={cell.dateKey} className="y2k-admin-cal-cell">
                    <button
                      type="button"
                      onClick={() => handleDayClick(cell.dateKey!)}
                      className={`y2k-admin-cal-day ${
                        datesWithAppointments.has(cell.dateKey)
                          ? "y2k-admin-cal-day-has"
                          : ""
                      } ${selectedDate === cell.dateKey ? "y2k-admin-cal-day-selected" : ""} ${
                        cell.dateKey === today ? "y2k-admin-cal-day-today" : ""
                      }`}
                    >
                      <span>{cell.day}</span>
                      {datesWithAppointments.has(cell.dateKey) && (
                        <span className="y2k-admin-cal-dot" aria-hidden />
                      )}
                    </button>
                  </div>
                ) : (
                  <div key={`empty-${i}`} className="y2k-admin-cal-cell" aria-hidden />
                )
              )}
            </div>
          </section>

          {selectedDate ? (
            <section className="y2k-admin-day-panel">
              <h3 className="text-lg font-black text-y2k-white">
                {ar.admin.dayAppointments}
                <span className="mt-1 block text-base text-y2k-gold">
                  {formatDateLabel(selectedDate)}
                </span>
                <span className="mt-0.5 block font-mono text-xs text-y2k-muted" dir="ltr">
                  {selectedDate}
                </span>
              </h3>

              {dayRows.length === 0 ? (
                <p className="font-bold text-y2k-muted">{ar.admin.noDayAppointments}</p>
              ) : (
                <div className="y2k-day-table-wrap">
                  <table className="y2k-table min-w-[320px]">
                    <thead>
                      <tr>
                        <th>{ar.admin.time}</th>
                        <th>{ar.admin.customer}</th>
                        <th>{ar.admin.status}</th>
                        <th>{ar.admin.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dayRows.map((row) => (
                        <tr
                          key={row.id}
                          className={
                            row.status === "booked"
                              ? "y2k-admin-row-booked"
                              : row.status === "available"
                                ? "y2k-admin-row-available"
                                : ""
                          }
                        >
                          <td className="whitespace-nowrap font-mono font-bold text-y2k-gold" dir="ltr">
                            {formatAdminTimeSlot(row.time_slot)}
                          </td>
                          <td>{customerCell(row)}</td>
                          <td>{statusBadge(row.status)}</td>
                          <td>{rowActions(row)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : (
            <p className="text-center text-sm font-bold text-y2k-muted">{ar.admin.selectDayHint}</p>
          )}
        </>
      )}
    </div>
  );
}
