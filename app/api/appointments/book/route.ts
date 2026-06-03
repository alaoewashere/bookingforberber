import { NextResponse } from "next/server";
import { bookAppointment } from "@/lib/appointments";
import { isValidDateParam, normalizeTimeSlot } from "@/lib/slots";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const date = typeof body.date === "string" ? body.date : "";
    const time_slot =
      typeof body.time_slot === "string" ? normalizeTimeSlot(body.time_slot) : "";
    const customer_name =
      typeof body.customer_name === "string" ? body.customer_name.trim() : "";

    if (!isValidDateParam(date) || !time_slot) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }
    if (!customer_name) {
      return NextResponse.json({ error: "اسم العميل مطلوب" }, { status: 400 });
    }

    const appointment = await bookAppointment(date, time_slot, customer_name);
    return NextResponse.json(appointment);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
