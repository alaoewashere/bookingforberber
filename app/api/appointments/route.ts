import { NextResponse } from "next/server";
import type { ServiceType } from "@/lib/types";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  ensureDaySlots,
  getAllAppointments,
  upsertAppointment,
} from "@/lib/appointments";
import { isValidDateParam, isWithinPublicBookingRange, normalizeTimeSlot } from "@/lib/slots";
import { readJsonObject } from "@/lib/request-security";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  try {
    if (date) {
      if (!isValidDateParam(date) || !isWithinPublicBookingRange(date)) {
        return NextResponse.json({ error: "Invalid date" }, { status: 400 });
      }
      const appointments = await ensureDaySlots(date);
      return NextResponse.json(appointments, {
        headers: { "Cache-Control": "no-store, max-age=0" },
      });
    }

    const all = searchParams.get("all") === "1";
    if (all) {
      const admin = await isAdminAuthenticated();
      if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const appointments = await getAllAppointments();
      return NextResponse.json(appointments, {
        headers: { "Cache-Control": "no-store, max-age=0" },
      });
    }

    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const admin = await isAdminAuthenticated();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await readJsonObject(request);
  const date = body.date as string;
  const time_slot =
    typeof body.time_slot === "string" ? normalizeTimeSlot(body.time_slot) : "";
  const first_name = typeof body.first_name === "string" ? body.first_name : undefined;
  const last_name = typeof body.last_name === "string" ? body.last_name : undefined;
  const status = (body.status as string) ?? "booked";

  if (!isValidDateParam(date) || !time_slot) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  // Public bookings must use /book and email OTP. This route is available only
  // to the signed-in admin and still runs the same server-side name, email,
  // phone, service, slot, and duplicate-booking validation.
  if (status === "booked") {
    try {
      const appointment = await upsertAppointment({
        date,
        time_slot,
        first_name,
        last_name,
        email: typeof body.email === "string" ? body.email : undefined,
        phone: typeof body.phone === "string" ? body.phone : undefined,
        service: typeof body.service === "string" ? body.service as ServiceType : undefined,
        email_verified: false,
        phone_verified: false,
        status: "booked",
      });
      return NextResponse.json(appointment);
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      return NextResponse.json({ error: code === "ABUSIVE_NAME" || code === "INVALID_NAME" || code === "MULTIPLE_WORDS" ? "الرجاء إدخال اسم صحيح." : "Invalid input" }, { status: 400 });
    }
  }
  if (status !== "available" && status !== "blocked") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const appointment = await upsertAppointment({
      date,
      time_slot,
      customer_name: "",
      status: status as "booked" | "available" | "blocked",
    });
    return NextResponse.json(appointment);
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    return NextResponse.json({ error: code === "ABUSIVE_NAME" || code === "INVALID_NAME" ? "الرجاء إدخال اسم صحيح." : "Invalid input" }, { status: 400 });
  }
}
