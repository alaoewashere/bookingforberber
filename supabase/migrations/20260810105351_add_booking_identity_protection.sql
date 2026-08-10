-- Store only the normalized comparison value and a random, server-signed
-- browser identifier. Existing booking rows are preserved.
alter table public.appointments
  add column if not exists normalized_phone text,
  add column if not exists device_id uuid,
  add column if not exists device_id_retired boolean not null default false,
  add column if not exists booking_source text not null default 'public';

alter table public.appointments
  drop constraint if exists appointments_booking_source_check;
alter table public.appointments
  add constraint appointments_booking_source_check
  check (booking_source in ('public', 'admin')) not valid;

-- Backfill a comparison-only value without changing the existing phone display
-- data. This folds common Turkish mobile formats to E.164.
update public.appointments
set normalized_phone = case
  when regexp_replace(phone, '[^0-9]', '', 'g') ~ '^90[5][0-9]{9}$'
    then '+' || regexp_replace(phone, '[^0-9]', '', 'g')
  when regexp_replace(phone, '[^0-9]', '', 'g') ~ '^0[5][0-9]{9}$'
    then '+90' || substring(regexp_replace(phone, '[^0-9]', '', 'g') from 2)
  when regexp_replace(phone, '[^0-9]', '', 'g') ~ '^[5][0-9]{9}$'
    then '+90' || regexp_replace(phone, '[^0-9]', '', 'g')
  else '+' || regexp_replace(phone, '[^0-9]', '', 'g')
end
where status = 'booked'
  and phone is not null
  and normalized_phone is null;

-- NOT VALID preserves older bookings that predate device IDs while requiring
-- every new public booking to include both server-normalized phone and device.
alter table public.appointments
  drop constraint if exists appointments_booked_phone_identity_check;
alter table public.appointments
  add constraint appointments_booked_phone_identity_check
  check (status <> 'booked' or normalized_phone is not null) not valid;

alter table public.appointments
  drop constraint if exists appointments_public_booking_device_check;
alter table public.appointments
  add constraint appointments_public_booking_device_check
  check (status <> 'booked' or booking_source = 'admin' or device_id is not null or device_id_retired) not valid;

-- These partial unique indexes provide the race-safe one-booking-per-day rule.
-- The device rule excludes staff-created bookings so an administrator can book
-- for several legitimate customers while phone protection still applies.
create unique index if not exists appointments_one_booked_phone_per_day_idx
  on public.appointments (date, normalized_phone)
  where status = 'booked' and normalized_phone is not null;

create unique index if not exists appointments_one_public_device_per_day_idx
  on public.appointments (date, device_id)
  where status = 'booked' and booking_source = 'public' and device_id is not null;

create index if not exists booking_rate_limits_window_started_at_idx
  on public.booking_rate_limits (window_started_at);

-- Supabase's Data API is never allowed to read or mutate these abuse signals.
revoke all on table public.appointments from anon, authenticated;

-- Removes anti-abuse identifiers after 90 days (the caller supplies the
-- cutoff). This function is reachable only by the server service role.
create or replace function public.purge_booking_abuse_identifiers(p_cutoff timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  appointments_cleared integer := 0;
  archives_cleared integer := 0;
  rate_limits_cleared integer := 0;
begin
  update public.appointments
  set booking_ip = null,
      device_id = null,
      device_id_retired = true
  where status = 'booked'
    and coalesce(booked_at, created_at) < p_cutoff
    and (booking_ip is not null or device_id is not null);
  get diagnostics appointments_cleared = row_count;

  update public.appointment_archives
  set appointment_snapshot = appointment_snapshot - 'booking_ip' - 'device_id'
  where archived_at < p_cutoff
    and (appointment_snapshot ? 'booking_ip' or appointment_snapshot ? 'device_id');
  get diagnostics archives_cleared = row_count;

  delete from public.booking_rate_limits
  where window_started_at < now() - interval '2 days';
  get diagnostics rate_limits_cleared = row_count;

  return jsonb_build_object(
    'appointments_cleared', appointments_cleared,
    'archives_cleared', archives_cleared,
    'rate_limits_cleared', rate_limits_cleared
  );
end;
$$;

revoke all on function public.purge_booking_abuse_identifiers(timestamptz) from public, anon, authenticated;
grant execute on function public.purge_booking_abuse_identifiers(timestamptz) to service_role;
