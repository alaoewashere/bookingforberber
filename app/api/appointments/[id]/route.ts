import { NextResponse } from "next/server";
import { clearAppointmentSlot, upsertAppointment } from "@/lib/appointments";
import { createServerClient } from "@/lib/supabase";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { readJsonObject } from "@/lib/request-security";

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
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const body = await readJsonObject(request);

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

    // This route controls slots only. Customer-controlled text can enter a
    // booking exclusively through the secure /book route.
    if (body.status === "booked" || body.customer_name !== undefined || body.first_name !== undefined || body.last_name !== undefined || body.phone !== undefined || body.service !== undefined) {
      return NextResponse.json({ error: "Booking changes are not allowed" }, { status: 403 });
    }

    return NextResponse.json(existing);
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    return NextResponse.json({ error: code === "ABUSIVE_NAME" || code === "INVALID_NAME" ? "الرجاء إدخال اسم صحيح." : "Invalid input" }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

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
