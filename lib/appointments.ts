import type { Appointment, AppointmentStatus, ServiceType } from "@/lib/types";
import { generateTimeSlots, isValidDateParam, isWithinPublicBookingRange, normalizeTimeSlot } from "@/lib/slots";
import { validateCustomerName, validateEmail, validatePhone, validateService } from "@/lib/moderation/server";
import { createServerClient } from "@/lib/supabase";

const UPSERT_CONFLICT = "date,time_slot";

export function toPublicAppointment(appointment: Appointment) {
  return {
    id: appointment.id,
    date: appointment.date,
    time_slot: appointment.time_slot,
    customer_name: appointment.customer_name,
    status: appointment.status,
    created_at: appointment.created_at,
  };
}

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
    .select("id, date, time_slot, customer_name, status, created_at")
    .eq("date", date)
    .order("time_slot", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => {
    let safeName: string | null = null;
    if (typeof row.customer_name === "string") {
      try { safeName = validateCustomerName(row.customer_name); } catch { safeName = null; }
    }
    return { ...row, customer_name: safeName } as Appointment;
  });
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
  const expected = generateTimeSlots().map(normalizeTimeSlot);
  const existingSet = new Set(existing.map((a) => a.time_slot));
  const missing = expected.filter((t) => !existingSet.has(t));
  if (missing.length === 0) return existing;

  const supabase = createServerClient();
  const slots = missing.map((time_slot) => ({
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
  phone?: string;
  email?: string;
  email_verified?: boolean;
  service?: ServiceType;
  status?: AppointmentStatus;
  phone_verified?: boolean;
};

/** Upsert by (date, time_slot) — never creates duplicate slots for the same day/time */
export async function upsertAppointment(
  payload: BookingPayload
): Promise<Appointment> {
  const date = payload.date;
  const time_slot = normalizeTimeSlot(payload.time_slot);
  const status = payload.status ?? "booked";
  const customer_name = status === "booked" ? validateCustomerName(payload.customer_name) : "";
  const email = status === "booked" && payload.email ? validateEmail(payload.email) : null;
  const phone = status === "booked" && payload.phone ? validatePhone(payload.phone) : null;
  const service = status === "booked" ? validateService(payload.service ?? "hair") : "hair";

  if (!isValidDateParam(date)) {
    throw new Error("Invalid date");
  }
  if (!time_slot) {
    throw new Error("Invalid time slot");
  }
  if (!["available", "booked", "blocked"].includes(status)) throw new Error("Invalid status");

  await ensureDaySlots(date);

  const notes =
    status === "booked" && (phone || service)
      ? JSON.stringify({ phone, service })
      : null;

  const supabase = createServerClient();
  const row = {
    date,
    time_slot,
    customer_name: status === "booked" ? customer_name : null,
    email: status === "booked" ? email : null,
    email_verified: status === "booked" ? payload.email_verified ?? false : false,
    phone: status === "booked" ? phone : null,
    service: status === "booked" ? service : null,
    phone_verified: status === "booked" ? payload.phone_verified ?? true : false,
    status,
    notes,
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
  customer_name: string,
  email: string,
  phone?: string,
  service?: ServiceType,
  options: { emailVerified?: boolean } = {}
): Promise<Appointment> {
  if (!isWithinPublicBookingRange(date)) throw new Error("INVALID_BOOKING");
  const normalizedSlot = normalizeTimeSlot(time_slot);
  if (!normalizedSlot) throw new Error("INVALID_BOOKING");
  const normalizedName = validateCustomerName(customer_name);
  const normalizedEmail = validateEmail(email);
  const normalizedPhone = validatePhone(phone ?? "");
  const normalizedService = validateService(service ?? "hair");
  if (options.emailVerified !== true) throw new Error("EMAIL_NOT_VERIFIED");
  const supabase = createServerClient();
  const { data, error } = await supabase.from("appointments")
    .update({ customer_name: normalizedName, email: normalizedEmail, email_verified: true, phone: normalizedPhone, service: normalizedService, phone_verified: false, status: "booked", notes: JSON.stringify({ email: normalizedEmail, phone: normalizedPhone, service: normalizedService }) })
    .eq("date", date).eq("time_slot", normalizedSlot).eq("status", "available").select("*").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("SLOT_UNAVAILABLE");
  return data as Appointment;
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
