import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAllAppointments } from "@/lib/appointments";
import type { Appointment } from "@/lib/types";
import AdminDashboard from "@/components/AdminDashboard";
import AdminGate from "@/components/AdminGate";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return <AdminGate />;
  }

  let appointments: Appointment[] = [];
  try {
    appointments = await getAllAppointments();
  } catch {
    appointments = [];
  }

  return <AdminDashboard appointments={appointments} />;
}
