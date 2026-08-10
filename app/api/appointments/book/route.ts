import { NextResponse } from "next/server";
import { toPublicAppointment, upsertAppointment } from "@/lib/appointments";
import { isValidDateParam, isWithinPublicBookingRange, normalizeTimeSlot } from "@/lib/slots";
import { validateCustomerNamePair, validatePhone, validateService } from "@/lib/moderation/server";
import { createServerClient } from "@/lib/supabase";
import { getBookingRateLimitKeys, getRequestIp, hasOnlyKeys, RATE_LIMIT_MAX_ATTEMPTS, RATE_LIMIT_WINDOW_SECONDS, readJsonObject } from "@/lib/request-security";
import { getOrCreateBookingDevice, setBookingDeviceCookie } from "@/lib/booking-device";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const PUBLIC_BOOKING_KEYS = ["date", "time_slot", "first_name", "last_name", "phone", "service"] as const;

export async function POST(request: Request) {
  const adminBooking = request.headers.get("x-admin-booking") === "1" && await isAdminAuthenticated();
  const device = adminBooking ? null : getOrCreateBookingDevice(request);
  const respond = (body: unknown, init: ResponseInit) => {
    const response = NextResponse.json(body, init);
    if (device) setBookingDeviceCookie(response, device);
    return response;
  };

  try {
    const body = await readJsonObject(request);
    if (!hasOnlyKeys(body, PUBLIC_BOOKING_KEYS)) {
      return respond({ error: "بيانات غير صالحة" }, { status: 400 });
    }
    const date = typeof body.date === "string" ? body.date : "";
    const time_slot =
      typeof body.time_slot === "string" ? normalizeTimeSlot(body.time_slot) : "";
    const first_name = typeof body.first_name === "string" ? body.first_name : "";
    const last_name = typeof body.last_name === "string" ? body.last_name : "";
    const phone = typeof body.phone === "string" ? body.phone : "";

    const supabase = createServerClient();
    if (!adminBooking) {
      for (const key of getBookingRateLimitKeys(request, device?.id)) {
        const { data, error } = await supabase.rpc("consume_booking_rate_limit", { p_key: key, p_window_seconds: RATE_LIMIT_WINDOW_SECONDS, p_max_attempts: RATE_LIMIT_MAX_ATTEMPTS });
        if (error) throw error;
        if (data !== true) return respond({ error: "تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة لاحقًا." }, { status: 429 });
      }
    }

    if (!isValidDateParam(date) || !isWithinPublicBookingRange(date) || !time_slot) {
      return respond({ error: "بيانات غير صالحة" }, { status: 400 });
    }

    let normalizedFirstName: string;
    let normalizedLastName: string;
    let normalizedPhone: string;
    let service: "hair" | "beard" | "hair_beard";
    try {
      const nameParts = validateCustomerNamePair(first_name, last_name);
      normalizedFirstName = nameParts.firstName;
      normalizedLastName = nameParts.lastName;
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      return respond({ error: code === "MULTIPLE_WORDS" ? "يرجى إدخال كلمة واحدة فقط." : "الرجاء إدخال اسم صحيح." }, { status: 400 });
    }
    try {
      normalizedPhone = validatePhone(phone);
      service = validateService(body.service);
    } catch {
      return respond({ error: "بيانات غير صالحة" }, { status: 400 });
    }

    const appointment = await upsertAppointment({
      date,
      time_slot,
      first_name: normalizedFirstName,
      last_name: normalizedLastName,
      phone: normalizedPhone,
      normalized_phone: normalizedPhone,
      service,
      booking_ip: getRequestIp(request),
      device_id: device?.id ?? null,
      booking_source: adminBooking ? "admin" : "public",
      email_verified: false,
      phone_verified: false,
      status: "booked",
    });
    return respond(toPublicAppointment(appointment), { status: 200 });
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    const status = code === "SLOT_UNAVAILABLE" ? 409 : code === "DAILY_BOOKING_LIMIT" ? 429 : code === "MULTIPLE_WORDS" ? 400 : code === "ABUSIVE_NAME" ? 400 : code === "INVALID_NAME" || code === "INVALID_BOOKING" || code === "REQUEST_TOO_LARGE" || code === "INVALID_JSON" ? 400 : 500;
    return respond({ error: status === 409 ? "هذا الموعد لم يعد متاحاً." : status === 429 ? "يمكنك حجز موعد واحد فقط في اليوم." : status === 400 ? (code === "MULTIPLE_WORDS" ? "يرجى إدخال كلمة واحدة فقط." : "الرجاء إدخال اسم صحيح.") : "Server error" }, { status });
  }
}
