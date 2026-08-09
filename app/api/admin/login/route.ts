import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  createAdminSession,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import { createServerClient } from "@/lib/supabase";
import { getAdminRateLimitKeys, RATE_LIMIT_MAX_ATTEMPTS, RATE_LIMIT_WINDOW_SECONDS, readJsonObject } from "@/lib/request-security";

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  const password = typeof body.password === "string" ? body.password : "";

  try {
    const supabase = createServerClient();
    for (const key of getAdminRateLimitKeys(request)) {
      const { data, error } = await supabase.rpc("consume_booking_rate_limit", {
        p_key: key,
        p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
        p_max_attempts: RATE_LIMIT_MAX_ATTEMPTS,
      });
      if (error) throw error;
      if (data !== true) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }
  } catch {
    return NextResponse.json({ error: "Unable to sign in" }, { status: 503 });
  }

  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createAdminSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return response;
}
