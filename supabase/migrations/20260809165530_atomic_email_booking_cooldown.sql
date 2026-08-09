alter table public.appointments
  add column if not exists booked_at timestamptz;

create index if not exists appointments_email_booked_at_idx
  on public.appointments (email, booked_at desc)
  where status = 'booked' and email is not null and booked_at is not null;

create or replace function public.book_appointment_with_email_cooldown(
  p_date date,
  p_time_slot text,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_service text
) returns setof public.appointments
language plpgsql
security invoker
set search_path = public
as $$
declare
  updated_appointment public.appointments;
begin
  -- Serialize bookings by normalized email so concurrent requests cannot both
  -- pass the cooldown check.
  perform pg_advisory_xact_lock(hashtextextended(lower(trim(p_email)), 0));

  if exists (
    select 1
    from public.appointments
    where lower(email) = lower(trim(p_email))
      and status = 'booked'
      and booked_at >= now() - interval '2 days'
  ) then
    raise exception 'EMAIL_COOLDOWN';
  end if;

  update public.appointments
  set customer_name = trim(p_first_name) || ' ' || trim(p_last_name),
      first_name = trim(p_first_name),
      last_name = trim(p_last_name),
      email = lower(trim(p_email)),
      email_verified = true,
      phone = p_phone,
      service = p_service,
      phone_verified = false,
      booked_at = now(),
      status = 'booked',
      notes = json_build_object('email', lower(trim(p_email)), 'phone', p_phone, 'service', p_service)::text
  where date = p_date
    and time_slot = p_time_slot
    and status = 'available'
  returning * into updated_appointment;

  if not found then
    raise exception 'SLOT_UNAVAILABLE';
  end if;

  return next updated_appointment;
end;
$$;

revoke all on function public.book_appointment_with_email_cooldown(date, text, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.book_appointment_with_email_cooldown(date, text, text, text, text, text, text)
  to service_role;
