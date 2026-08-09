import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { validateEmail } from "@/lib/moderation/server";

export const ADMIN_COOKIE = "barber_admin_session";
// The admin email OTP is a device-verification step, not a per-page-view step.
// Password changes still invalidate this signed cookie immediately.
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "";
}

export function isAllowedAdminEmail(email: string): boolean {
  try {
    const expected = validateEmail(process.env.ADMIN_EMAIL ?? "");
    const provided = validateEmail(email);
    if (provided.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function verifyAdminPassword(password: string): boolean {
  const expected = getAdminPassword();
  if (expected.length < 20 || password.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(password), Buffer.from(expected));
}

/** A signed value prevents anyone from forging the admin cookie in DevTools. */
export function createAdminSession(): string {
  const password = getAdminPassword();
  if (password.length < 20) throw new Error("ADMIN_PASSWORD must be at least 20 characters");
  return createHmac("sha256", password).update("barber-admin-session-v1").digest("base64url");
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const expected = getAdminPassword();
  if (expected.length < 20) return false;
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!session) return false;
  const signedSession = createAdminSession();
  if (session.length !== signedSession.length) return false;
  return timingSafeEqual(Buffer.from(session), Buffer.from(signedSession));
}
