export type ScheduleDay = {
  date: string;
  display_name: string | null;
};

export type AppointmentStatus = "available" | "booked" | "blocked";

export type ServiceType = "hair" | "beard" | "hair_beard";

export interface Appointment {
  id: string;
  date: string;
  time_slot: string;
  customer_name: string | null;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
}

export interface BookingMeta {
  phone: string;
  service: ServiceType;
}

export function parseBookingMeta(notes: string | null): BookingMeta | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes);
    if (typeof parsed === "object" && parsed !== null) {
      return {
        phone: typeof parsed.phone === "string" ? parsed.phone : "",
        service: (["hair", "beard", "hair_beard"] as ServiceType[]).includes(parsed.service)
          ? (parsed.service as ServiceType)
          : "hair",
      };
    }
    return null;
  } catch {
    return null;
  }
}
