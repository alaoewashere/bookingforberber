import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  bookAppointment,
  ensureDaySlots,
  getAllAppointments,
  upsertAppointment,
} from "@/lib/appointments";
import { isValidDateParam, normalizeTimeSlot } from "@/lib/slots";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  try {
    if (date) {
      if (!isValidDateParam(date)) {
        return NextResponse.json({ error: "Invalid date" }, { status: 400 });
      }
      const appointments = await ensureDaySlots(date);
      return NextResponse.json(appointments);
    }

    const all = searchParams.get("all") === "1";
    if (all) {
      const admin = await isAdminAuthenticated();
      if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const appointments = await getAllAppointments();
      return NextResponse.json(appointments);
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

  const body = await request.json();
  const date = body.date as string;
  const time_slot =
    typeof body.time_slot === "string" ? normalizeTimeSlot(body.time_slot) : "";
  const customer_name = (body.customer_name as string)?.trim() || "";
  const status = (body.status as string) ?? "booked";

  if (!isValidDateParam(date) || !time_slot) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const appointment = await upsertAppointment({
      date,
      time_slot,
      customer_name,
      status: status as "booked" | "available" | "blocked",
    });
    return NextResponse.json(appointment);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
