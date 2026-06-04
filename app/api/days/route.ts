import { NextResponse } from "next/server";
import { getDistinctDates, ensureDaySlots } from "@/lib/appointments";
import { ensureScheduleDay, getScheduleDays } from "@/lib/schedule-days";
import { isValidDateParam } from "@/lib/slots";

export async function GET() {
  try {
    const days = await getScheduleDays();
    return NextResponse.json(days);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const date = body.date as string;

  if (!isValidDateParam(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  try {
    await ensureScheduleDay(date);
    const appointments = await ensureDaySlots(date);
    return NextResponse.json({ date, appointments });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
