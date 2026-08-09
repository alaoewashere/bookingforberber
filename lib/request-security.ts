import { createHash } from "node:crypto";

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

export function getBookingRateLimitKeys(request: Request, phone?: string): string[] {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const ip = forwarded || realIp || "unknown";
  const userAgent = request.headers.get("user-agent")?.slice(0, 256) ?? "unknown";
  const cookieSession = request.headers.get("cookie")?.match(/(?:^|;\s*)booking_session=([^;]+)/u)?.[1] ?? "";
  const session = (request.headers.get("x-booking-session")?.slice(0, 128) || cookieSession.slice(0, 128));
  const keys = [`ip:${ip}`, `fingerprint:${ip}:${userAgent}`];
  if (session) keys.push(`session:${session}`);
  if (phone) keys.push(`phone:${phone}`);
  return Array.from(new Set(keys.map(digest)));
}

export const RATE_LIMIT_WINDOW_SECONDS = 3600;
export const RATE_LIMIT_MAX_ATTEMPTS = 8;
