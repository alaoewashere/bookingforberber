import { formatDateLabel } from "@/lib/slots";

/** Client-safe — no Supabase imports */
export function getDayLabel(
  date: string,
  displayName: string | null | undefined
): string {
  const trimmed = displayName?.trim();
  return trimmed ? trimmed : formatDateLabel(date);
}
