"use client";

import { useCallback, useState } from "react";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import {
  formatAdminDateLabel,
  formatAdminTimeSlot,
  formatTimeDisplay,
  generateTimeSlots,
} from "@/lib/slots";
import { ar } from "@/lib/i18n/ar";

const adminStatusEn: Record<AppointmentStatus, string> = {
  available: "Available",
  booked: "Booked",
  blocked: "Blocked",
};

interface AdminTableProps {
  initialAppointments: Appointment[];
}

export default function AdminTable({ initialAppointments }: AdminTableProps) {
  const [rows, setRows] = useState(initialAppointments);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [addDate, setAddDate] = useState("");
  const [addTime, setAddTime] = useState("09:00");
  const [addName, setAddName] = useState("");
  const [loading, setLoading] = useState(false);
  const timeOptions = generateTimeSlots();

  const refreshRow = useCallback((updated: Appointment) => {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.id === updated.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next.sort((a, b) => {
          if (a.date !== b.date) return b.date.localeCompare(a.date);
          return a.time_slot.localeCompare(b.time_slot);
        });
      }
      return [...prev, updated].sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return a.time_slot.localeCompare(b.time_slot);
      });
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
    } finally {
      setLoading(false);
    }
  }

  const statusBadge = (status: AppointmentStatus) => (
    <span
      className={`rounded px-2 py-0.5 text-xs ${
        status === "available"
          ? "bg-emerald-900/50 text-emerald-300"
          : status === "booked"
            ? "bg-red-900/50 text-red-300"
            : "bg-amber-900/50 text-amber-300"
      }`}
    >
      {adminStatusEn[status]}
    </span>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-barber-gold">
          {ar.admin.allAppointments}
        </h2>
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className="rounded-lg bg-barber-gold px-4 py-2 text-sm font-semibold text-barber-bg"
        >
          {showAdd ? ar.admin.cancel : ar.admin.addBooking}
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAddBooking}
          className="grid gap-4 rounded-lg border border-barber-border bg-barber-surface p-4 sm:grid-cols-4"
        >
          <input
            type="date"
            value={addDate}
            onChange={(e) => setAddDate(e.target.value)}
            required
            dir="ltr"
            className="rounded-lg border border-barber-border bg-barber-bg px-3 py-2 text-white"
          />
          <select
            value={addTime}
            onChange={(e) => setAddTime(e.target.value)}
            dir="ltr"
            className="rounded-lg border border-barber-border bg-barber-bg px-3 py-2 text-white"
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
            className="rounded-lg border border-barber-border bg-barber-bg px-3 py-2 text-white sm:col-span-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-barber-gold py-2 font-semibold text-barber-bg sm:col-span-4"
          >
            {ar.admin.saveBooking}
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-barber-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-barber-surface text-gray-400">
            <tr>
              <th className="px-4 py-3 text-start font-medium">{ar.admin.date}</th>
              <th className="px-4 py-3 text-start font-medium">{ar.admin.time}</th>
              <th className="px-4 py-3 text-start font-medium">{ar.admin.customer}</th>
              <th className="px-4 py-3 text-start font-medium">{ar.admin.status}</th>
              <th className="px-4 py-3 text-start font-medium">{ar.admin.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-barber-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  {ar.admin.empty}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-barber-surface/50">
                  <td className="whitespace-nowrap px-4 py-3">
                    {formatAdminDateLabel(row.date)}
                  </td>
                  <td className="px-4 py-3 font-mono text-barber-gold" dir="ltr">
                    {formatAdminTimeSlot(row.time_slot)}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === row.id ? (
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full max-w-[180px] rounded border border-barber-border bg-barber-bg px-2 py-1 text-white"
                      />
                    ) : (
                      row.customer_name ?? ar.admin.dash
                    )}
                  </td>
                  <td className="px-4 py-3">{statusBadge(row.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {editingId === row.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(row)}
                            disabled={loading}
                            className="text-xs text-barber-gold hover:underline"
                          >
                            {ar.admin.save}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="text-xs text-gray-400 hover:underline"
                          >
                            {ar.admin.cancel}
                          </button>
                        </>
                      ) : (
                        <>
                          {row.status === "booked" && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(row.id);
                                setEditName(row.customer_name ?? "");
                              }}
                              className="text-xs text-barber-gold hover:underline"
                            >
                              {ar.admin.edit}
                            </button>
                          )}
                          {(row.status === "booked" || row.status === "blocked") && (
                            <button
                              type="button"
                              onClick={() => handleClear(row.id)}
                              disabled={loading}
                              className="text-xs text-gray-300 hover:underline"
                            >
                              {ar.admin.clear}
                            </button>
                          )}
                          {row.status !== "blocked" && (
                            <button
                              type="button"
                              onClick={() => handleBlock(row.id)}
                              disabled={loading}
                              className="text-xs text-amber-400 hover:underline"
                            >
                              {ar.admin.block}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
