import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listBlockedIps, normalizeIp } from "@/lib/blocked-ips";
import { createServerClient } from "@/lib/supabase";
import { hasOnlyKeys, readJsonObject } from "@/lib/request-security";

async function requireAdmin() {
  return isAdminAuthenticated();
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await listBlockedIps(), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await readJsonObject(request);
  if (!hasOnlyKeys(body, ["ip_address", "reason", "expires_at", "active"])) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  try {
    const ip_address = normalizeIp(body.ip_address);
    const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) || null : null;
    const expires_at = body.expires_at === null || body.expires_at === undefined || body.expires_at === ""
      ? null
      : new Date(String(body.expires_at)).toISOString();
    if (expires_at && new Date(expires_at).getTime() <= Date.now()) throw new Error("INVALID_EXPIRY");
    const active = body.active === undefined ? true : body.active === true;
    const { data, error } = await createServerClient()
      .from("blocked_ips")
      .upsert({ ip_address, reason, expires_at, active }, { onConflict: "ip_address" })
      .select("id, ip_address, reason, created_at, expires_at, active")
      .single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    return NextResponse.json({ error: code === "INVALID_IP" ? "Invalid IP address" : "Invalid input" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await readJsonObject(request);
  if (!hasOnlyKeys(body, ["id", "active", "reason", "expires_at"]) || typeof body.id !== "string") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const updates: Record<string, unknown> = {};
  if (typeof body.active === "boolean") updates.active = body.active;
  if (typeof body.reason === "string") updates.reason = body.reason.trim().slice(0, 500) || null;
  if (body.expires_at === null || body.expires_at === "") updates.expires_at = null;
  else if (body.expires_at !== undefined) {
    const expiry = new Date(String(body.expires_at));
    if (Number.isNaN(expiry.getTime()) || expiry.getTime() <= Date.now()) return NextResponse.json({ error: "Invalid expiry" }, { status: 400 });
    updates.expires_at = expiry.toISOString();
  }
  const { data, error } = await createServerClient()
    .from("blocked_ips")
    .update(updates)
    .eq("id", body.id)
    .select("id, ip_address, reason, created_at, expires_at, active")
    .single();
  if (error) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await readJsonObject(request);
  if (!hasOnlyKeys(body, ["id"]) || typeof body.id !== "string") return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { error } = await createServerClient().from("blocked_ips").delete().eq("id", body.id);
  if (error) return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
