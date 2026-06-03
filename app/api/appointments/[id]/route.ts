import { NextResponse } from "next/server";
import { clearAppointmentSlot, upsertAppointment } from "@/lib/appointments";
import { createServerClient } from "@/lib/supabase";

type RouteContext = { params: Promise<{ id: string }> };

async function getAppointmentById(id: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();

  try {
    const existing = await getAppointmentById(id);
    const date = existing.date as string;
    const time_slot = existing.time_slot as string;

    if (body.status === "available") {
      const data = await clearAppointmentSlot(date, time_slot);
      return NextResponse.json(data);
    }

    if (body.status === "blocked") {
      const data = await upsertAppointment({
        date,
        time_slot,
        customer_name: "",
        status: "blocked",
      });
      return NextResponse.json(data);
    }

    if (body.status === "booked" || body.customer_name !== undefined) {
      const name =
        typeof body.customer_name === "string"
          ? body.customer_name.trim()
          : (existing.customer_name as string) ?? "";
      if (!name) {
        return NextResponse.json(
          { error: "Customer name required for booked status" },
          { status: 400 }
        );
      }
      const data = await upsertAppointment({
        date,
        time_slot,
        customer_name: name,
        status: "booked",
      });
      return NextResponse.json(data);
    }

    return NextResponse.json(existing);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const existing = await getAppointmentById(id);
    const data = await clearAppointmentSlot(
      existing.date as string,
      existing.time_slot as string
    );
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
