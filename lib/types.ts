export type ScheduleDay = {
  date: string;
  display_name: string | null;
};

export type AppointmentStatus = "available" | "booked" | "blocked";

export interface Appointment {
  id: string;
  date: string;
  time_slot: string;
  customer_name: string | null;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
}
