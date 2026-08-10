-- Keep a server-observed address for abuse investigation. The public Data API
-- has no appointment privileges; this column is returned only to an admin via
-- the authenticated server route.
alter table public.appointments
  add column if not exists booking_ip inet;

create index if not exists appointments_booking_ip_booked_at_idx
  on public.appointments (booking_ip, booked_at desc)
  where status = 'booked' and booking_ip is not null;

revoke select (booking_ip) on public.appointments from anon, authenticated;
