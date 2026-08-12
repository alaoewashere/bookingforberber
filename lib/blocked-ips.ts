import { isIP } from "node:net";
import { createServerClient } from "@/lib/supabase";

export type BlockedIp = {
  id: string;
  ip_address: string;
  reason: string | null;
  created_at: string;
  expires_at: string | null;
  active: boolean;
};

export function normalizeIp(input: unknown): string {
  if (typeof input !== "string") throw new Error("INVALID_IP");
  const value = input.trim();
  if (!isIP(value)) throw new Error("INVALID_IP");
  return value;
}

export async function isBlockedIp(ip: string | null): Promise<boolean> {
  if (!ip) return false;
  const now = new Date().toISOString();
  const { data, error } = await createServerClient()
    .from("blocked_ips")
    .select("id")
    .eq("ip_address", normalizeIp(ip))
    .eq("active", true)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .limit(1);
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function listBlockedIps(): Promise<BlockedIp[]> {
  const { data, error } = await createServerClient()
    .from("blocked_ips")
    .select("id, ip_address, reason, created_at, expires_at, active")
    .order("active", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BlockedIp[];
}
