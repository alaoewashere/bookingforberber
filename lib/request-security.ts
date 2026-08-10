import { createHash } from "node:crypto";
import { isIP } from "node:net";

const MAX_JSON_BYTES = 16_000;

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_JSON_BYTES) throw new Error("REQUEST_TOO_LARGE");
  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_JSON_BYTES) throw new Error("REQUEST_TOO_LARGE");
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("INVALID_JSON");
  return parsed as Record<string, unknown>;
}

export function hasOnlyKeys(body: Record<string, unknown>, allowed: readonly string[]): boolean {
  const allowedSet = new Set(allowed);
  return Object.keys(body).every((key) => allowedSet.has(key));
}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Gets the network address supplied by the hosting proxy, never from JSON.
 * Vercel supplies x-vercel-forwarded-for; local development falls back to the
 * conventional proxy headers. Invalid/spoofed values are deliberately ignored.
 */
export function getRequestIp(request: Request): string | null {
  const candidates = [
    request.headers.get("x-vercel-forwarded-for"),
    request.headers.get("x-forwarded-for"),
    request.headers.get("x-real-ip"),
  ];

  for (const header of candidates) {
    const ip = header?.split(",")[0]?.trim() ?? "";
    if (isIP(ip)) return ip;
  }
  return null;
}

export function getBookingRateLimitKeys(request: Request): string[] {
  const ip = getRequestIp(request) ?? "unknown";
  const userAgent = request.headers.get("user-agent")?.slice(0, 256) ?? "unknown";
  const cookieSession = request.headers.get("cookie")?.match(/(?:^|;\s*)booking_session=([^;]+)/u)?.[1] ?? "";
  const session = (request.headers.get("x-booking-session")?.slice(0, 128) || cookieSession.slice(0, 128));
  const keys = [`ip:${ip}`, `fingerprint:${ip}:${userAgent}`];
  if (session) keys.push(`session:${session}`);
  return Array.from(new Set(keys.map(digest)));
}

/** A phone stays rate-limited even when its IP address changes. */
export function getPhoneDailyRateLimitKey(phone: string): string {
  return digest(`phone-daily:${phone}`);
}

/** Keep administrator password attempts separate from customer booking limits. */
export function getAdminRateLimitKeys(request: Request): string[] {
  const ip = getRequestIp(request) ?? "unknown";
  const userAgent = request.headers.get("user-agent")?.slice(0, 256) ?? "unknown";
  return Array.from(new Set([`admin-ip:${ip}`, `admin-fingerprint:${ip}:${userAgent}`].map(digest)));
}

export const RATE_LIMIT_WINDOW_SECONDS = 3600;
export const RATE_LIMIT_MAX_ATTEMPTS = 8;
