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

/** Week grid starts Saturday (typical ar-SA layout) */
export const AR_WEEKDAYS_SHORT = [
  "سب",
  "أحد",
  "ن",
  "ث",
  "أر",
  "خ",
  "ج",
] as const;

export type CalendarCell = {
  dateKey: string | null;
  day: number | null;
};

export function toDateKey(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

export function parseDateKey(dateKey: string): { year: number; month: number; day: number } {
  const [y, m, d] = dateKey.split("-").map(Number);
  return { year: y, month: m - 1, day: d };
}

export function formatMonthYearAr(year: number, month: number): string {
  return `${AR_MONTHS[month]} ${year}`;
}

/** Saturday-first month grid cells */
export function buildMonthGrid(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (first.getDay() + 1) % 7;

  const cells: CalendarCell[] = [];
  for (let i = 0; i < startOffset; i++) {
    cells.push({ dateKey: null, day: null });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ dateKey: toDateKey(year, month, day), day });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ dateKey: null, day: null });
  }
  return cells;
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}
