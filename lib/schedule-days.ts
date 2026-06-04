import { isValidDateParam } from "@/lib/slots";
import { createServerClient } from "@/lib/supabase";
import { getDistinctDates } from "@/lib/appointments";
import type { ScheduleDay } from "@/lib/types";

export type { ScheduleDay } from "@/lib/types";

export async function getScheduleDays(): Promise<ScheduleDay[]> {
  const dates = await getDistinctDates();
  if (dates.length === 0) return [];

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("schedule_days")
    .select("date, display_name")
    .in("date", dates);

  if (error) throw error;

  const nameByDate = new Map(
    (data ?? []).map((row) => [row.date as string, (row.display_name as string | null) ?? null])
  );

  return dates.map((date) => ({
    date,
    display_name: nameByDate.get(date) ?? null,
  }));
}

export async function getScheduleDay(date: string): Promise<ScheduleDay | null> {
  if (!isValidDateParam(date)) return null;

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("schedule_days")
    .select("date, display_name")
    .eq("date", date)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { date, display_name: null };
  return {
    date: data.date as string,
    display_name: (data.display_name as string | null) ?? null,
  };
}

export async function ensureScheduleDay(date: string): Promise<void> {
  if (!isValidDateParam(date)) {
    throw new Error("Invalid date");
  }

  const supabase = createServerClient();
  const { error } = await supabase.from("schedule_days").upsert(
    { date, display_name: null, updated_at: new Date().toISOString() },
    { onConflict: "date", ignoreDuplicates: true }
  );

  if (error) throw error;
}

export async function updateScheduleDayDisplayName(
  date: string,
  displayName: string
): Promise<ScheduleDay> {
  if (!isValidDateParam(date)) {
    throw new Error("Invalid date");
  }

  const trimmed = displayName.trim();
  const display_name = trimmed.length > 0 ? trimmed : null;

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("schedule_days")
    .upsert(
      { date, display_name, updated_at: new Date().toISOString() },
      { onConflict: "date" }
    )
    .select("date, display_name")
    .single();

  if (error) throw error;
  return {
    date: data.date as string,
    display_name: (data.display_name as string | null) ?? null,
  };
}

export async function deleteScheduleDay(date: string): Promise<void> {
  if (!isValidDateParam(date)) {
    throw new Error("Invalid date");
  }

  const supabase = createServerClient();

  const { error: appointmentsError } = await supabase
    .from("appointments")
    .delete()
    .eq("date", date);

  if (appointmentsError) throw appointmentsError;

  const { error: dayError } = await supabase.from("schedule_days").delete().eq("date", date);

  if (dayError) throw dayError;
}
