import { NextResponse } from "next/server";
import { clearAppointmentSlot, upsertAppointment } from "@/lib/appointments";
import { parseBookingMeta } from "@/lib/types";
import { createServerClient } from "@/lib/supabase";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { readJsonObject } from "@/lib/request-security";
import { validateService } from "@/lib/moderation/server";

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

    if (body.status === "booked" || body.customer_name !== undefined) {
      if (existing.status !== "booked") {
        return NextResponse.json({ error: "Email verification is required for new bookings" }, { status: 403 });
      }
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
      const existingMeta = parseBookingMeta(existing.notes as string | null);
      const phone = typeof body.phone === "string" ? body.phone.trim() : (existingMeta?.phone ?? "");
      const service = body.service === undefined ? existingMeta?.service : validateService(body.service);
      const data = await upsertAppointment({
        date,
        time_slot,
        customer_name: name,
        first_name: typeof body.first_name === "string" ? body.first_name : undefined,
        last_name: typeof body.last_name === "string" ? body.last_name : undefined,
        email: typeof existing.email === "string" ? existing.email : undefined,
        email_verified: existing.email_verified === true,
        status: "booked",
        phone,
        service,
        booked_at: typeof existing.booked_at === "string" ? existing.booked_at : null,
      });
      return NextResponse.json(data);
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
