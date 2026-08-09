-- Public clients may read availability only. All writes go through the server API.
drop policy if exists "Allow public insert appointments" on public.appointments;
drop policy if exists "Allow public update appointments" on public.appointments;
drop policy if exists "Allow public delete appointments" on public.appointments;
drop policy if exists "Allow public insert schedule_days" on public.schedule_days;
drop policy if exists "Allow public update schedule_days" on public.schedule_days;
drop policy if exists "Allow public delete schedule_days" on public.schedule_days;

alter table public.appointments drop constraint if exists appointments_time_slot_check;
alter table public.appointments add constraint appointments_time_slot_check
  check (time_slot ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
alter table public.appointments drop constraint if exists appointments_customer_name_length_check;
alter table public.appointments add constraint appointments_customer_name_length_check
  check (customer_name is null or char_length(customer_name) between 1 and 120);

create table if not exists public.booking_rate_limits (
  rate_key text primary key,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 0
);
alter table public.booking_rate_limits enable row level security;

create or replace function public.consume_booking_rate_limit(
  p_key text, p_window_seconds integer, p_max_attempts integer
) returns boolean language plpgsql security definer set search_path = public as $$
declare current_attempts integer;
begin
  perform pg_advisory_xact_lock(hashtext(p_key));
  insert into public.booking_rate_limits(rate_key, window_started_at, attempts)
    values (p_key, now(), 1)
    on conflict (rate_key) do update set
      window_started_at = case when now() - booking_rate_limits.window_started_at >= make_interval(secs => p_window_seconds) then now() else booking_rate_limits.window_started_at end,
      attempts = case when now() - booking_rate_limits.window_started_at >= make_interval(secs => p_window_seconds) then 1 else booking_rate_limits.attempts + 1 end;
  select attempts into current_attempts from public.booking_rate_limits where rate_key = p_key;
  return current_attempts <= p_max_attempts;
end;
$$;
revoke all on function public.consume_booking_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_booking_rate_limit(text, integer, integer) to service_role;
