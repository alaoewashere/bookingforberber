/** Noon (12:00) through 10:00 PM, every hour */
export const SLOT_START_HOUR = 12;
export const SLOT_END_HOUR = 22;

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

const AR_WEEKDAYS = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
] as const;

const AR_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
] as const;

const EN_WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const EN_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function toArabicNumerals(value: number | string): string {
  return String(value).replace(/\d/g, (digit) => ARABIC_DIGITS[Number(digit)]);
}

function parseDateOnly(dateStr: string): Date {
  return new Date(dateStr + "T12:00:00");
}

export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = SLOT_START_HOUR; hour <= SLOT_END_HOUR; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`);
  }
  return slots;
}

/** Stable across server/client (avoids Intl punctuation differences).
 *  Arabic: ص = noon–5 PM, م = 6–10 PM. Turkish: S = noon–5 PM, G = 6–10 PM. */
export function formatTimeDisplay(timeSlot: string, lang: "ar" | "tr" = "ar"): string {
  const [h24, min] = timeSlot.split(":").map(Number);
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;

  if (lang === "tr") {
    const period = h24 < 18 ? "S" : "G";
    const minPart = min === 0 ? "" : `:${String(min).padStart(2, "0")}`;
    return `${h12}${minPart} ${period}`;
  }

  const period = h24 < 18 ? "ص" : "م";
  const hourPart = toArabicNumerals(h12);
  const minPart =
    min === 0 ? "" : `:${toArabicNumerals(String(min).padStart(2, "0"))}`;
  return `${hourPart}${minPart}${period}`;
}

/** Stable across server/client (avoids Intl punctuation differences). */
export function formatDateLabel(dateStr: string): string {
  const d = parseDateOnly(dateStr);
  const weekday = AR_WEEKDAYS[d.getDay()];
  const day = toArabicNumerals(d.getDate());
  const month = AR_MONTHS[d.getMonth()];
  const year = toArabicNumerals(d.getFullYear());
  return `${weekday}، ${day} ${month} ${year}`;
}

/** Admin table: Saturday, June 7, 2026 */
export function formatAdminDateLabel(dateStr: string): string {
  const d = parseDateOnly(dateStr);
  return `${EN_WEEKDAYS[d.getDay()]}, ${EN_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
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
