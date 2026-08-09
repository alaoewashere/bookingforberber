import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSession,
  isAllowedAdminEmail,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import { getAuthenticatedEmail } from "@/lib/supabase";
import { hasOnlyKeys, readJsonObject } from "@/lib/request-security";

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  const password = typeof body.password === "string" ? body.password : "";
  const email = typeof body.email === "string" ? body.email : "";
  const accessToken = typeof body.access_token === "string" ? body.access_token : "";
  if (!hasOnlyKeys(body, ["password", "email", "access_token"]) || !verifyAdminPassword(password) || !isAllowedAdminEmail(email)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  const authenticatedEmail = accessToken ? await getAuthenticatedEmail(accessToken) : null;
  if (!authenticatedEmail || !isAllowedAdminEmail(authenticatedEmail) || authenticatedEmail !== email.trim().toLowerCase()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createAdminSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
