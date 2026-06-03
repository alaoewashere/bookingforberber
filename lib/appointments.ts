import type { Appointment, AppointmentStatus } from "@/lib/types";
import { generateTimeSlots, isValidDateParam, normalizeTimeSlot } from "@/lib/slots";
import { createServerClient } from "@/lib/supabase";

const UPSERT_CONFLICT = "date,time_slot";

export async function getDistinctDates(): Promise<string[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("date")
    .order("date", { ascending: false });

  if (error) throw error;
  const unique = Array.from(new Set((data ?? []).map((r) => r.date as string)));
  return unique;
}

export async function getAppointmentsByDate(date: string): Promise<Appointment[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("date", date)
    .order("time_slot", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Appointment[];
}

export async function getAllAppointments(): Promise<Appointment[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .order("date", { ascending: false })
    .order("time_slot", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Appointment[];
}

export async function getAppointmentsByCustomer(
  customerName: string
): Promise<Appointment[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("customer_name", customerName.trim())
    .order("date", { ascending: true })
    .order("time_slot", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Appointment[];
}

export async function ensureDaySlots(date: string): Promise<Appointment[]> {
  if (!isValidDateParam(date)) {
    throw new Error("Invalid date");
  }

  const existing = await getAppointmentsByDate(date);
  if (existing.length > 0) return existing;

  const supabase = createServerClient();
  const slots = generateTimeSlots().map((time_slot) => ({
    date,
    time_slot: normalizeTimeSlot(time_slot),
    customer_name: null,
    status: "available" as const,
    notes: null,
  }));

  const { data, error } = await supabase
    .from("appointments")
    .upsert(slots, { onConflict: UPSERT_CONFLICT, ignoreDuplicates: true })
    .select("*");

  if (error) throw error;

  const created = (data ?? []) as Appointment[];
  if (created.length > 0) {
    return created.sort((a, b) => a.time_slot.localeCompare(b.time_slot));
  }

  return getAppointmentsByDate(date);
}

export type BookingPayload = {
  date: string;
  time_slot: string;
  customer_name: string;
  status?: AppointmentStatus;
};

/** Upsert by (date, time_slot) — never creates duplicate slots for the same day/time */
export async function upsertAppointment(
  payload: BookingPayload
): Promise<Appointment> {
  const date = payload.date;
  const time_slot = normalizeTimeSlot(payload.time_slot);
  const customer_name = payload.customer_name.trim();
  const status = payload.status ?? "booked";

  if (!isValidDateParam(date)) {
    throw new Error("Invalid date");
  }
  if (!time_slot) {
    throw new Error("Invalid time slot");
  }
  if (status === "booked" && !customer_name) {
    throw new Error("Customer name required");
  }

  await ensureDaySlots(date);

  const supabase = createServerClient();
  const row = {
    date,
    time_slot,
    customer_name: status === "booked" ? customer_name : null,
    status,
  };

  const { data, error } = await supabase
    .from("appointments")
    .upsert(row, { onConflict: UPSERT_CONFLICT })
    .select("*")
    .single();

  if (error) throw error;
  return data as Appointment;
}

export async function bookAppointment(
  date: string,
  time_slot: string,
  customer_name: string
): Promise<Appointment> {
  return upsertAppointment({
    date,
    time_slot,
    customer_name,
    status: "booked",
  });
}

export async function clearAppointmentSlot(
  date: string,
  time_slot: string
): Promise<Appointment> {
  return upsertAppointment({
    date,
    time_slot,
    customer_name: "",
    status: "available",
  });
}
