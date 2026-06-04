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
      className={
        status === "available"
          ? "y2k-badge-admin-available"
          : status === "booked"
            ? "y2k-badge-admin-booked"
            : "y2k-badge-admin-blocked"
      }
    >
      {adminStatusEn[status]}
    </span>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-black text-y2k-white">
          <span className="font-display text-y2k-gold" aria-hidden>
            ★{" "}
          </span>
          {ar.admin.allAppointments}
        </h2>
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className="y2k-btn-primary w-full sm:w-auto"
        >
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
            className="y2k-input !py-2 sm:col-span-2 lg:col-span-2"
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
          <ul className="space-y-3 md:hidden">
            {rows.map((row) => (
              <li
                key={row.id}
                className="y2k-admin-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-black text-y2k-white">
                      {formatAdminDateLabel(row.date)}
                    </p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-y2k-gold" dir="ltr">
                      {formatAdminTimeSlot(row.time_slot)}
                    </p>
                  </div>
                  {statusBadge(row.status)}
                </div>
                <div className="mt-3">
                  <p className="text-xs font-bold text-y2k-muted">{ar.admin.customer}</p>
                  {editingId === row.id ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="y2k-input mt-1 !py-2"
                    />
                  ) : (
                    <p className="mt-0.5 font-bold text-y2k-white">
                      {row.customer_name ?? ar.admin.dash}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-3 border-t-2 border-y2k-gold/20 pt-3">
                  {editingId === row.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(row)}
                        disabled={loading}
                        className="y2k-btn-ghost"
                      >
                        {ar.admin.save}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="y2k-btn-ghost text-y2k-muted"
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
                          className="y2k-btn-ghost"
                        >
                          {ar.admin.edit}
                        </button>
                      )}
                      {(row.status === "booked" || row.status === "blocked") && (
                        <button
                          type="button"
                          onClick={() => handleClear(row.id)}
                          disabled={loading}
                          className="y2k-btn-ghost"
                        >
                          {ar.admin.clear}
                        </button>
                      )}
                      {row.status !== "blocked" && (
                        <button
                          type="button"
                          onClick={() => handleBlock(row.id)}
                          disabled={loading}
                          className="y2k-btn-ghost text-y2k-electric"
                        >
                          {ar.admin.block}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="y2k-table-wrap">
            <table className="y2k-table">
              <thead>
                <tr>
                  <th>{ar.admin.date}</th>
                  <th>{ar.admin.time}</th>
                  <th>{ar.admin.customer}</th>
                  <th>{ar.admin.status}</th>
                  <th>{ar.admin.actions}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="whitespace-nowrap">
                      {formatAdminDateLabel(row.date)}
                    </td>
                    <td className="font-mono font-bold text-y2k-gold" dir="ltr">
                      {formatAdminTimeSlot(row.time_slot)}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === row.id ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="y2k-input max-w-[180px] !py-1"
                        />
                      ) : (
                        row.customer_name ?? ar.admin.dash
                      )}
                    </td>
                    <td>{statusBadge(row.status)}</td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        {editingId === row.id ? (
                          <>
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
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
