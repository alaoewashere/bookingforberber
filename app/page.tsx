import { getDistinctDates } from "@/lib/appointments";
import HomeClient from "@/components/HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let dates: string[] = [];
  try {
    dates = await getDistinctDates();
  } catch {
    dates = [];
  }

  return <HomeClient dates={dates} />;
}
