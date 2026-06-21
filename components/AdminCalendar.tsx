"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import { parseBookingMeta } from "@/lib/types";
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
import { ar, serviceLabelAr, statusLabelAr } from "@/lib/i18n/ar";

interface AdminCalendarProps { initialAppointments: Appointment[]; }

type Tab = "calendar" | "notifications";

export default function AdminCalendar({ initialAppointments }: AdminCalendarProps) {
  const today     = todayISO();
  const todayParts = parseDateKey(today);

  const [rows,         setRows]         = useState(initialAppointments);
  const [viewYear,     setViewYear]     = useState(todayParts.year);
  const [viewMonth,    setViewMonth]    = useState(todayParts.month);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingId,    setEditingId]    = useState<string | null>(null);
  const [editName,     setEditName]     = useState("");
  const [showAdd,      setShowAdd]      = useState(false);
  const [addDate,      setAddDate]      = useState("");
  const [addTime,      setAddTime]      = useState("12:00");
  const [addName,      setAddName]      = useState("");
  const [loading,      setLoading]      = useState(false);
  const [tab,          setTab]          = useState<Tab>("calendar");
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("notif_seen") ?? "[]") as string[];
      if (saved.length > 0) setSeenIds(new Set(saved));
    } catch { /* ignore */ }
  }, []);

  const timeOptions = generateTimeSlots();
  const monthCells  = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const datesWithBookings = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => { if (r.status === "booked") s.add(r.date); });
    return s;
  }, [rows]);

  const dayRows = useMemo(() => {
    if (!selectedDate) return [];
    return [...rows].filter((r) => r.date === selectedDate).sort((a, b) => a.time_slot.localeCompare(b.time_slot));
  }, [rows, selectedDate]);

  const bookedByDate = useMemo(() => {
    const booked = rows.filter((r) => r.status === "booked")
      .sort((a, b) => a.date.localeCompare(b.date) || a.time_slot.localeCompare(b.time_slot));
    const map = new Map<string, Appointment[]>();
    booked.forEach((r) => { const list = map.get(r.date) ?? []; list.push(r); map.set(r.date, list); });
    return map;
  }, [rows]);

  const totalBooked = useMemo(() => Array.from(bookedByDate.values()).reduce((s, a) => s + a.length, 0), [bookedByDate]);

  const newCount = useMemo(() => {
    let count = 0;
    bookedByDate.forEach((appts) => appts.forEach((a) => { if (!seenIds.has(a.id)) count++; }));
    return count;
  }, [bookedByDate, seenIds]);

  function markAllSeen() {
    const ids: string[] = [];
    bookedByDate.forEach((appts) => appts.forEach((a) => ids.push(a.id)));
    const next = new Set(ids);
    setSeenIds(next);
    localStorage.setItem("notif_seen", JSON.stringify(ids));
  }

  const refreshRow = useCallback((updated: Appointment) => {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.id === updated.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = updated; return n; }
      return [...prev, updated];
    });
  }, []);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/appointments?all=1");
        if (res.ok) { const d = await res.json(); if (Array.isArray(d)) setRows(d); }
      } catch { /* silent */ }
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  async function refreshAll() {
    setLoading(true);
    try {
      const res = await fetch("/api/appointments?all=1");
      if (res.ok) { const d = await res.json(); if (Array.isArray(d)) setRows(d); }
    } finally { setLoading(false); }
  }

  async function patchAppointment(id: string, body: Partial<{ customer_name: string | null; status: AppointmentStatus }>) {
    const res = await fetch(`/api/appointments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? ar.admin.updateFailed);
    refreshRow(json as Appointment);
  }

  async function handleSaveEdit(row: Appointment) {
    setLoading(true);
    try {
      const res = await fetch("/api/appointments/book", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: row.date, time_slot: row.time_slot, customer_name: editName.trim() }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? ar.admin.updateFailed);
      refreshRow(json as Appointment); setEditingId(null);
    } finally { setLoading(false); }
  }

  async function handleClear(id: string) {
    if (!confirm(ar.admin.clearConfirm)) return;
    setLoading(true);
    try { await patchAppointment(id, { customer_name: null, status: "available" }); }
    finally { setLoading(false); }
  }

  async function handleBlock(id: string) {
    setLoading(true);
    try { await patchAppointment(id, { customer_name: null, status: "blocked" }); }
    finally { setLoading(false); }
  }

  async function handleAddBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!addDate || !addName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: addDate, time_slot: addTime, customer_name: addName.trim(), status: "booked" }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? ar.admin.addFailed);
      refreshRow(json as Appointment); setShowAdd(false); setAddName("");
      setSelectedDate(addDate);
      const p = parseDateKey(addDate); setViewYear(p.year); setViewMonth(p.month);
    } finally { setLoading(false); }
  }

  function goMonth(delta: number) {
    const n = shiftMonth(viewYear, viewMonth, delta); setViewYear(n.year); setViewMonth(n.month);
  }

  const F = { fontFamily: "var(--font-thmanyah)" } as React.CSSProperties;

  function statusBadge(status: AppointmentStatus) {
    return (
      <span className={status === "available" ? "m-badge-available" : status === "booked" ? "m-badge-booked" : "m-badge-blocked"}>
        {statusLabelAr(status)}
      </span>
    );
  }

  function customerCell(row: Appointment) {
    if (editingId === row.id) return (
      <input value={editName} onChange={(e) => setEditName(e.target.value)} className="m-input !py-1 max-w-[160px]" style={{ fontSize: "0.82rem" }} />
    );
    if (row.status === "available") return <span style={{ ...F, color: "var(--m-green)", fontWeight: 400 }}>—</span>;
    if (row.status === "booked") return <span style={{ ...F, color: "var(--m-cream)", fontWeight: 500 }}>{row.customer_name ?? "—"}</span>;
    return <span style={{ ...F, color: "var(--m-muted)" }}>مغلق</span>;
  }

  function rowActions(row: Appointment) {
    if (editingId === row.id) return (
      <div className="flex gap-1">
        <button type="button" onClick={() => handleSaveEdit(row)} disabled={loading} className="m-btn-ghost" style={{ fontSize: "0.78rem" }}>{ar.admin.save}</button>
        <button type="button" onClick={() => setEditingId(null)} className="m-btn-ghost" style={{ fontSize: "0.78rem", color: "var(--m-muted)" }}>{ar.admin.cancel}</button>
      </div>
    );
    return (
      <div className="flex gap-1">
        {row.status === "booked" && <button type="button" onClick={() => { setEditingId(row.id); setEditName(row.customer_name ?? ""); }} className="m-btn-ghost" style={{ fontSize: "0.78rem" }}>{ar.admin.edit}</button>}
        {(row.status === "booked" || row.status === "blocked") && <button type="button" onClick={() => handleClear(row.id)} disabled={loading} className="m-btn-ghost" style={{ fontSize: "0.78rem" }}>{ar.admin.clear}</button>}
        {row.status !== "blocked" && <button type="button" onClick={() => handleBlock(row.id)} disabled={loading} className="m-btn-ghost" style={{ fontSize: "0.78rem", color: "var(--m-muted)" }}>{ar.admin.block}</button>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b pb-4" style={{ borderColor: "var(--m-border)" }}>
        <button type="button" onClick={() => setTab("calendar")} className={tab === "calendar" ? "m-btn-primary !min-h-9 !px-4 text-sm" : "m-btn-secondary !min-h-9 !px-4 text-sm"}>
          {ar.admin.calendarTitle}
        </button>
        <button type="button" onClick={() => { setTab("notifications"); markAllSeen(); }} className={tab === "notifications" ? "m-btn-primary !min-h-9 !px-4 text-sm" : "m-btn-secondary !min-h-9 !px-4 text-sm"}>
          {ar.admin.notifTitle}
          {newCount > 0 && (
            <span style={{ marginInlineStart: 6, background: tab === "notifications" ? "rgba(12,8,6,0.3)" : "var(--m-brown)", color: "var(--m-bg)", borderRadius: 100, padding: "0 6px", fontSize: "0.72rem", fontWeight: 700 }}>
              {newCount}
            </span>
          )}
        </button>
      </div>

      {tab === "notifications" ? (
        /* ── Notification center ── */
        <div className="space-y-5 m-anim-fade">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="m-section-label mb-1">{ar.admin.notifSubtitle}</p>
              <h2 style={{ ...F, fontWeight: 700, fontSize: "1.1rem", color: "var(--m-cream)" }}>{ar.admin.notifTitle}</h2>
            </div>
            <button type="button" onClick={refreshAll} disabled={loading} className="m-btn-secondary !min-h-9 !px-4 text-sm">
              {ar.admin.notifRefresh}
            </button>
          </div>

          {bookedByDate.size === 0 ? (
            <div className="m-empty"><p style={{ ...F, fontWeight: 300, color: "var(--m-muted)" }}>{ar.admin.notifEmpty}</p></div>
          ) : (
            Array.from(bookedByDate.entries()).map(([date, appts]) => (
              <div key={date} className="m-panel space-y-3">
                <p style={{ ...F, fontWeight: 700, fontSize: "0.9rem", color: "var(--m-brown-light)", letterSpacing: "0.01em" }}>
                  {formatDateLabel(date)}
                </p>
                <div className="space-y-2">
                  {appts.map((a) => {
                    const meta = parseBookingMeta(a.notes);
                    return (
                      <div key={a.id} className="m-notif-entry">
                        <span style={{ ...F, fontWeight: 500, fontSize: "0.85rem", color: "var(--m-brown-light)" }} dir="ltr">
                          {formatTimeDisplay(a.time_slot)}
                        </span>
                        <span style={{ ...F, fontWeight: 700, color: "var(--m-cream)" }}>{a.customer_name ?? "—"}</span>
                        <span style={{ ...F, fontWeight: 300, color: "var(--m-cream-2)", fontSize: "0.85rem" }} dir="ltr">
                          {meta?.phone || "—"}
                        </span>
                        <span className="m-pill">{serviceLabelAr(meta?.service)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* ── Calendar ── */
        <div className="space-y-6 m-anim-fade">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 style={{ ...F, fontWeight: 700, fontSize: "1rem", color: "var(--m-cream)" }}>{ar.admin.calendarTitle}</h2>
            <button type="button" onClick={() => setShowAdd((v) => { const n = !v; if (n && selectedDate) setAddDate(selectedDate); return n; })} className={showAdd ? "m-btn-secondary !min-h-9 !px-4 text-sm" : "m-btn-primary !min-h-9 !px-4 text-sm"}>
              {showAdd ? ar.admin.cancel : ar.admin.addBooking}
            </button>
          </div>

          {showAdd && (
            <form onSubmit={handleAddBooking} className="m-panel grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <input type="date" value={addDate} onChange={(e) => setAddDate(e.target.value)} required dir="ltr" className="m-input !py-2" />
              <select value={addTime} onChange={(e) => setAddTime(e.target.value)} dir="ltr" className="m-input !py-2">
                {timeOptions.map((t) => <option key={t} value={t}>{formatTimeDisplay(t)}</option>)}
              </select>
              <input type="text" value={addName} onChange={(e) => setAddName(e.target.value)} placeholder={ar.admin.customerName} required className="m-input !py-2 sm:col-span-2" />
              <button type="submit" disabled={loading} className="m-btn-primary sm:col-span-2 lg:col-span-4">{ar.admin.saveBooking}</button>
            </form>
          )}

          {/* Month calendar */}
          <section className="m-panel space-y-4">
            <div className="m-admin-cal-nav">
              <button type="button" onClick={() => goMonth(-1)} className="m-btn-ghost" aria-label={ar.admin.prevMonth}>→</button>
              <span className="m-admin-cal-month">{formatMonthYearAr(viewYear, viewMonth)}</span>
              <button type="button" onClick={() => goMonth(1)} className="m-btn-ghost" aria-label={ar.admin.nextMonth}>←</button>
            </div>
            <div className="m-admin-cal-grid">
              {AR_WEEKDAYS_SHORT.map((l) => <div key={l} className="m-admin-cal-weekday">{l}</div>)}
              {monthCells.map((cell, i) =>
                cell.dateKey && cell.day ? (
                  <div key={cell.dateKey} className="m-admin-cal-cell">
                    <button
                      type="button"
                      onClick={() => { setSelectedDate((p) => p === cell.dateKey ? null : cell.dateKey!); setEditingId(null); }}
                      className={[
                        "m-admin-cal-day",
                        datesWithBookings.has(cell.dateKey!) ? "m-admin-cal-day-has" : "",
                        selectedDate === cell.dateKey ? "m-admin-cal-day-selected" : "",
                        cell.dateKey === today ? "m-admin-cal-day-today" : "",
                      ].join(" ")}
                    >
                      <span>{cell.day}</span>
                      {datesWithBookings.has(cell.dateKey!) && <span className="m-admin-cal-dot" aria-hidden />}
                    </button>
                  </div>
                ) : <div key={`e-${i}`} className="m-admin-cal-cell" aria-hidden />
              )}
            </div>
          </section>

          {/* Day detail */}
          {selectedDate ? (
            <section className="m-panel space-y-4">
              <div>
                <p className="m-section-label mb-1">{ar.admin.dayAppointments}</p>
                <p style={{ ...F, fontWeight: 700, fontSize: "0.95rem", color: "var(--m-cream)" }}>{formatDateLabel(selectedDate)}</p>
              </div>
              {dayRows.length === 0 ? (
                <p style={{ ...F, fontWeight: 300, color: "var(--m-muted)", fontSize: "0.85rem" }}>{ar.admin.noDayAppointments}</p>
              ) : (
                <div className="m-table-wrap">
                  <table className="m-table min-w-[420px]">
                    <thead>
                      <tr>
                        {[ar.admin.time, ar.admin.customer, ar.admin.phone, ar.admin.service, ar.admin.status, ar.admin.actions].map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dayRows.map((row) => {
                        const meta = parseBookingMeta(row.notes);
                        return (
                          <tr key={row.id}>
                            <td style={{ ...F, fontWeight: 500, color: "var(--m-brown-light)", whiteSpace: "nowrap" }} dir="ltr">
                              {formatAdminTimeSlot(row.time_slot)}
                            </td>
                            <td>{customerCell(row)}</td>
                            <td style={{ ...F, color: "var(--m-cream-2)", fontSize: "0.82rem" }} dir="ltr">{meta?.phone || "—"}</td>
                            <td><span className="m-pill">{serviceLabelAr(meta?.service)}</span></td>
                            <td>{statusBadge(row.status)}</td>
                            <td>{rowActions(row)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : (
            <p style={{ ...F, fontWeight: 300, fontSize: "0.85rem", color: "var(--m-muted)", textAlign: "center" }}>{ar.admin.selectDayHint}</p>
          )}
        </div>
      )}
    </div>
  );
}
