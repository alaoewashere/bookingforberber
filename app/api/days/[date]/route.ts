import { NextResponse } from "next/server";
import {
  deleteScheduleDay,
  updateScheduleDayDisplayName,
} from "@/lib/schedule-days";
import { isValidDateParam } from "@/lib/slots";

interface RouteContext {
  params: Promise<{ date: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { date } = await context.params;

  if (!isValidDateParam(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const body = await request.json();
  const display_name = body.display_name;

  if (typeof display_name !== "string") {
    return NextResponse.json({ error: "display_name required" }, { status: 400 });
  }

  try {
    const day = await updateScheduleDayDisplayName(date, display_name);
    return NextResponse.json(day);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { date } = await context.params;

  if (!isValidDateParam(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  try {
    await deleteScheduleDay(date);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
