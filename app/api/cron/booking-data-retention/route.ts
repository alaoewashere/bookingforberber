import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const RETENTION_DAYS = Math.max(1, Number(process.env.BOOKING_ABUSE_RETENTION_DAYS) || 90);

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await createServerClient().rpc("purge_booking_abuse_identifiers", { p_cutoff: cutoff });
  if (error) return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  return NextResponse.json({ ok: true, retention_days: RETENTION_DAYS, result: data });
}
