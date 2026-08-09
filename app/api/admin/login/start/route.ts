import { NextResponse } from "next/server";
import { isAllowedAdminEmail, verifyAdminPassword } from "@/lib/admin-auth";
import { sendEmailOtp } from "@/lib/email-otp";
import { createServerClient } from "@/lib/supabase";
import { getAdminRateLimitKeys, hasOnlyKeys, RATE_LIMIT_MAX_ATTEMPTS, RATE_LIMIT_WINDOW_SECONDS, readJsonObject } from "@/lib/request-security";

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!hasOnlyKeys(body, ["email", "password"])) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  // Use one generic response so this route never reveals the protected email.
  if (!verifyAdminPassword(password) || !isAllowedAdminEmail(email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await sendEmailOtp(email.trim().toLowerCase());
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to send code" }, { status: 503 });
  }
}
