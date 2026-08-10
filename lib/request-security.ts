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

function isPublicIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    const [first, second] = ip.split(".").map(Number);
    return first !== 0 && first !== 10 && first !== 127
      && !(first === 169 && second === 254)
      && !(first === 172 && second >= 16 && second <= 31)
      && !(first === 192 && second === 168);
  }
  if (version === 6) {
    const normalized = ip.toLowerCase();
    if (normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:")) return false;
    const mappedV4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/u)?.[1];
    return mappedV4 ? isPublicIp(mappedV4) : true;
  }
  return false;
}

/**
 * Gets the network address supplied by the hosting proxy, never from JSON.
 * Vercel supplies x-vercel-forwarded-for; local development falls back to the
 * conventional proxy headers. Private/local and invalid values are ignored.
 */
export function getRequestIp(request: Request): string | null {
  const candidates = [
    request.headers.get("x-vercel-forwarded-for"),
    request.headers.get("x-forwarded-for"),
    request.headers.get("x-real-ip"),
  ];

  for (const header of candidates) {
    const ip = header?.split(",")[0]?.trim() ?? "";
    if (isPublicIp(ip)) return ip;
  }
  return null;
}

export function getBookingRateLimitKeys(request: Request, deviceId?: string): string[] {
  const ip = getRequestIp(request) ?? "unknown";
  const keys = [`ip:${ip}`];
  if (deviceId) keys.push(`device:${deviceId}`);
  return Array.from(new Set(keys.map(digest)));
}

/** Keep administrator password attempts separate from customer booking limits. */
export function getAdminRateLimitKeys(request: Request): string[] {
  const ip = getRequestIp(request) ?? "unknown";
  return [digest(`admin-ip:${ip}`)];
}

function positiveEnvInt(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

export const RATE_LIMIT_WINDOW_SECONDS = positiveEnvInt("BOOKING_IP_RATE_LIMIT_WINDOW_SECONDS", 60 * 60);
export const RATE_LIMIT_MAX_ATTEMPTS = positiveEnvInt("BOOKING_IP_RATE_LIMIT_MAX", 8);
