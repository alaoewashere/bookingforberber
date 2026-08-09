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
    // Keep the failure visible to the server instead of rendering a misleading
    // empty dashboard when the admin data query is unavailable.
    throw new Error("Unable to load admin appointments");
  }

  return <AdminDashboard appointments={appointments} />;
}
