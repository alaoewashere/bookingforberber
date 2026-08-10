import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { NextResponse } from "next/server";

export const BOOKING_DEVICE_COOKIE = "booking_device";
export const BOOKING_DEVICE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

type BookingDevice = {
  id: string;
  cookieValue: string;
  isNew: boolean;
};

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function signingSecret(): string {
  // BOOKING_DEVICE_SECRET allows independent rotation. The service-role key is
  // a server-only fallback so existing deployments keep working until it is set.
  const secret = process.env.BOOKING_DEVICE_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("DEVICE_COOKIE_SECRET_MISSING");
  return secret;
}

function sign(id: string): string {
  return createHmac("sha256", signingSecret())
    .update(`booking-device:v1:${id}`)
    .digest("base64url");
}

function readCookie(request: Request, name: string): string | null {
  const match = request.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`, "u"));
  return match?.[1] ?? null;
}

function verifiedId(token: string | null): string | null {
  if (!token) return null;
  const [id, signature, extra] = token.split(".");
  if (!id || !signature || extra || !UUID_V4.test(id)) return null;
  const expected = sign(id);
  const actualBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  if (actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) return null;
  return id.toLowerCase();
}

/** Read only a signed, HttpOnly, first-party random UUID—not request JSON. */
export function getOrCreateBookingDevice(request: Request): BookingDevice {
  const existing = verifiedId(readCookie(request, BOOKING_DEVICE_COOKIE));
  if (existing) return { id: existing, cookieValue: `${existing}.${sign(existing)}`, isNew: false };

  const id = randomUUID();
  return { id, cookieValue: `${id}.${sign(id)}`, isNew: true };
}

export function setBookingDeviceCookie(response: NextResponse, device: BookingDevice): void {
  if (!device.isNew) return;
  response.cookies.set(BOOKING_DEVICE_COOKIE, device.cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: BOOKING_DEVICE_MAX_AGE_SECONDS,
    path: "/",
  });
}
