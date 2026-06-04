import { getScheduleDays } from "@/lib/schedule-days";
import type { ScheduleDay } from "@/lib/types";
import HomeClient from "@/components/HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let days: ScheduleDay[] = [];
  try {
    days = await getScheduleDays();
  } catch {
    days = [];
  }

  return <HomeClient initialDays={days} />;
}
