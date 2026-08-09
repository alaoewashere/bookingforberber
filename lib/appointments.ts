import type { Appointment, AppointmentStatus, ServiceType } from "@/lib/types";
import { generateTimeSlots, isValidDateParam, isWithinPublicBookingRange, normalizeTimeSlot } from "@/lib/slots";
import { validateCustomerName, validateCustomerNameField, validateCustomerNamePair, validateEmail, validatePhone, validateService } from "@/lib/moderation/server";
import { createServerClient } from "@/lib/supabase";

const UPSERT_CONFLICT = "date,time_slot";
const ADMIN_APPOINTMENT_COLUMNS = "id, date, time_slot, customer_name, first_name, last_name, email, email_verified, phone, phone_verified, service, status, notes, created_at, booked_at";
const ADMIN_PAGE_SIZE = 1000;

export function toPublicAppointment(appointment: Appointment) {
  return {
    id: appointment.id,
    date: appointment.date,
    time_slot: appointment.time_slot,
    customer_name: null,
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
  const appointments: Appointment[] = [];

  // Supabase Data API responses are limited to 1,000 rows by default. The
  // admin view must also receive older bookings when the table contains many
  // future availability rows, so load the complete result in stable pages.
  for (let offset = 0; ; offset += ADMIN_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("appointments")
      .select(ADMIN_APPOINTMENT_COLUMNS)
      .order("date", { ascending: false })
      .order("time_slot", { ascending: true })
      .range(offset, offset + ADMIN_PAGE_SIZE - 1);

    if (error) throw error;
    const page = (data ?? []) as Appointment[];
    appointments.push(...page);
    if (page.length < ADMIN_PAGE_SIZE) break;
  }

  // Older rows can predate the moderation layer. Never render unsafe historic
  // customer-controlled text in the administrator dashboard.
  return appointments.map((appointment) => {
    let first_name: string | null = null;
    let last_name: string | null = null;
    let customer_name: string | null = null;
    try {
      if (appointment.first_name) first_name = validateCustomerNameField(appointment.first_name);
      if (appointment.last_name) last_name = validateCustomerNameField(appointment.last_name);
    } catch {
      first_name = null;
      last_name = null;
    }
    try {
      if (appointment.customer_name) customer_name = validateCustomerName(appointment.customer_name);
    } catch {
      customer_name = null;
    }
    return { ...appointment, first_name, last_name, customer_name };
  });
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

  const { error } = await supabase
    .from("appointments")
    .upsert(slots, { onConflict: UPSERT_CONFLICT, ignoreDuplicates: true });

  if (error) throw error;

  return getAppointmentsByDate(date);
}

export type BookingPayload = {
  date: string;
  time_slot: string;
  customer_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  email_verified?: boolean;
  service?: ServiceType;
  status?: AppointmentStatus;
  phone_verified?: boolean;
  booked_at?: string | null;
};

/** Upsert by (date, time_slot) — never creates duplicate slots for the same day/time */
export async function upsertAppointment(
  payload: BookingPayload
): Promise<Appointment> {
  const date = payload.date;
  const time_slot = normalizeTimeSlot(payload.time_slot);
  const status = payload.status ?? "booked";
  const nameParts = status === "booked" ? validateCustomerNamePair(payload.first_name ?? "", payload.last_name ?? "") : null;
  const first_name = nameParts?.firstName ?? null;
  const last_name = nameParts?.lastName ?? null;
  const customer_name = status === "booked"
    ? `${first_name} ${last_name}`
    : "";
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
    first_name: status === "booked" ? first_name : null,
    last_name: status === "booked" ? last_name : null,
    email: status === "booked" ? email : null,
    email_verified: status === "booked" ? payload.email_verified ?? false : false,
    phone: status === "booked" ? phone : null,
    service: status === "booked" ? service : null,
    phone_verified: status === "booked" ? payload.phone_verified ?? true : false,
    booked_at: status === "booked" ? payload.booked_at ?? new Date().toISOString() : null,
    status,
    notes,
  };

  // Staff-created bookings do not require customer OTP, but they must never
  // overwrite an existing booking. The status predicate makes this atomic.
  if (status === "booked") {
    const { data, error } = await supabase
      .from("appointments")
      .update(row)
      .eq("date", date)
      .eq("time_slot", time_slot)
      .eq("status", "available")
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("SLOT_UNAVAILABLE");
    return data as Appointment;
  }

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
  first_name: string,
  last_name: string,
  email: string,
  phone?: string,
  service?: ServiceType,
  options: { emailVerified?: boolean } = {}
): Promise<Appointment> {
  if (!isWithinPublicBookingRange(date)) throw new Error("INVALID_BOOKING");
  const normalizedSlot = normalizeTimeSlot(time_slot);
  if (!normalizedSlot) throw new Error("INVALID_BOOKING");
  const { firstName: normalizedFirstName, lastName: normalizedLastName } = validateCustomerNamePair(first_name, last_name);
  const normalizedEmail = validateEmail(email);
  const normalizedPhone = validatePhone(phone ?? "");
  const normalizedService = validateService(service ?? "hair");
  if (options.emailVerified !== true) throw new Error("EMAIL_NOT_VERIFIED");
  const supabase = createServerClient();
  const { data, error } = await supabase.rpc("book_appointment_with_email_cooldown", {
    p_date: date,
    p_time_slot: normalizedSlot,
    p_first_name: normalizedFirstName,
    p_last_name: normalizedLastName,
    p_email: normalizedEmail,
    p_phone: normalizedPhone,
    p_service: normalizedService,
  });
  if (error) throw error;
  const appointment = Array.isArray(data) ? data[0] : data;
  if (!appointment) throw new Error("SLOT_UNAVAILABLE");
  return appointment as Appointment;
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
