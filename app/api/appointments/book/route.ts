import { NextResponse } from "next/server";
import { bookAppointment, toPublicAppointment } from "@/lib/appointments";
import { isValidDateParam, isWithinPublicBookingRange, normalizeTimeSlot } from "@/lib/slots";
import { validateCustomerName, validatePhone, validateService } from "@/lib/moderation/server";
import { createServerClient } from "@/lib/supabase";
import { getBookingRateLimitKeys, hasOnlyKeys, RATE_LIMIT_MAX_ATTEMPTS, RATE_LIMIT_WINDOW_SECONDS, readJsonObject } from "@/lib/request-security";
import { randomBytes } from "node:crypto";

const PUBLIC_BOOKING_KEYS = ["date", "time_slot", "customer_name", "phone", "service"] as const;

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    if (!hasOnlyKeys(body, PUBLIC_BOOKING_KEYS)) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }
    const date = typeof body.date === "string" ? body.date : "";
    const time_slot =
      typeof body.time_slot === "string" ? normalizeTimeSlot(body.time_slot) : "";
    const customer_name = typeof body.customer_name === "string" ? body.customer_name : "";
    const phone = typeof body.phone === "string" ? body.phone : "";

    if (!isValidDateParam(date) || !isWithinPublicBookingRange(date) || !time_slot) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }

    let normalizedPhone: string;
    let service: "hair" | "beard" | "hair_beard";
    try {
      normalizedPhone = validatePhone(phone);
      service = validateService(body.service);
    } catch {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }

    const supabase = createServerClient();
    for (const key of getBookingRateLimitKeys(request, normalizedPhone)) {
      const { data, error } = await supabase.rpc("consume_booking_rate_limit", { p_key: key, p_window_seconds: RATE_LIMIT_WINDOW_SECONDS, p_max_attempts: RATE_LIMIT_MAX_ATTEMPTS });
      if (error) throw error;
      if (data !== true) return NextResponse.json({ error: "المحاولات كثيرة، حاول لاحقاً." }, { status: 429 });
    }

    let normalizedName: string;
    try { normalizedName = validateCustomerName(customer_name); }
    catch { return NextResponse.json({ error: "الرجاء إدخال اسم صحيح." }, { status: 400 }); }

    const appointment = await bookAppointment(date, time_slot, normalizedName, normalizedPhone, service);
    const response = NextResponse.json(toPublicAppointment(appointment));
    if (!request.headers.get("cookie")?.includes("booking_session=")) {
      response.cookies.set("booking_session", randomBytes(18).toString("hex"), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    }
    return response;
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    const status = code === "SLOT_UNAVAILABLE" ? 409 : code === "PHONE_NOT_VERIFIED" ? 403 : code === "INVALID_BOOKING" || code === "REQUEST_TOO_LARGE" || code === "INVALID_JSON" ? 400 : 500;
    return NextResponse.json({ error: status === 409 ? "هذا الموعد لم يعد متاحاً." : status === 400 ? "بيانات غير صالحة" : status === 403 ? "يجب تأكيد رقم الهاتف أولاً." : "Server error" }, { status });
  }
}
