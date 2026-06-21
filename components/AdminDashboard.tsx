"use client";

import { useRouter } from "next/navigation";
import type { Appointment } from "@/lib/types";
import { ar } from "@/lib/i18n/ar";
import AdminCalendar from "@/components/AdminCalendar";

interface AdminDashboardProps { appointments: Appointment[]; }

export default function AdminDashboard({ appointments }: AdminDashboardProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <div dir="rtl" className="m-anim-fade">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="m-section-label mb-2">لوحة التحكم</p>
          <h1 className="m-heading" style={{ fontSize: "1.8rem" }}>{ar.admin.title}</h1>
          <p className="m-subtitle">{ar.admin.subtitle}</p>
        </div>
        <button type="button" onClick={handleLogout} className="m-btn-secondary">
          {ar.admin.logout}
        </button>
      </div>
      <AdminCalendar initialAppointments={appointments} />
    </div>
  );
}
