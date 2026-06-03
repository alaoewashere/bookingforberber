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
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-barber-gold">{ar.admin.title}</h1>
          <p className="mt-1 text-gray-400">{ar.admin.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-barber-border px-4 py-2 text-sm text-gray-300 hover:bg-barber-surface"
        >
          {ar.admin.logout}
        </button>
      </div>
      <AdminTable initialAppointments={appointments} />
    </div>
  );
}
