"use client";

import { useRouter } from "next/navigation";
import type { Appointment } from "@/lib/types";
import { ar } from "@/lib/i18n/ar";
import AdminTable from "@/components/AdminTable";

interface AdminDashboardProps {
  appointments: Appointment[];
}

export default function AdminDashboard({ appointments }: AdminDashboardProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="y2k-heading">{ar.admin.title}</h1>
          <p className="y2k-subtitle">{ar.admin.subtitle}</p>
        </div>
        <button type="button" onClick={handleLogout} className="y2k-btn-secondary w-full sm:w-auto">
          {ar.admin.logout}
        </button>
      </div>
      <AdminTable initialAppointments={appointments} />
    </div>
  );
}
