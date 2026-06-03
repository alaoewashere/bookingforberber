/** 9:00 AM through 7:00 PM, every hour */
export const SLOT_START_HOUR = 9;
export const SLOT_END_HOUR = 19;

export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = SLOT_START_HOUR; hour <= SLOT_END_HOUR; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`);
  }
  return slots;
}

export function formatTimeDisplay(timeSlot: string): string {
  const [h, m] = timeSlot.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString("ar-SA", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Admin table: Saturday, June 7, 2026 */
export function formatAdminDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Admin table: keep stored slot as HH:MM (e.g. 09:00) */
export function formatAdminTimeSlot(timeSlot: string): string {
  const [h, m] = timeSlot.split(":").map(Number);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function normalizeTimeSlot(timeSlot: string): string {
  const [h, m] = timeSlot.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return timeSlot;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isValidDateParam(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date + "T12:00:00"));
}
