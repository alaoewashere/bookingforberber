-- Keep all appointment writes behind the authenticated server API.
alter table public.appointments add column if not exists phone text;
alter table public.appointments add column if not exists service text;
alter table public.appointments add column if not exists phone_verified boolean not null default false;

alter table public.appointments drop constraint if exists appointments_customer_name_length_check;
alter table public.appointments add constraint appointments_customer_name_length_check
  check (customer_name is null or char_length(customer_name) between 1 and 50) not valid;
alter table public.appointments add constraint appointments_phone_format_check
  check (phone is null or phone ~ '^\+?[0-9]{8,15}$') not valid;
alter table public.appointments add constraint appointments_service_check
  check (service is null or service in ('hair', 'beard', 'hair_beard')) not valid;

revoke insert, update, delete on public.appointments from anon, authenticated;
revoke insert, update, delete on public.schedule_days from anon, authenticated;
revoke all on public.booking_rate_limits from anon, authenticated;

-- Public availability is served through the server API, which returns only
-- the fields needed by the booking UI. Direct Data API reads cannot expose
-- phone numbers, notes, verification flags, or arbitrary customer data.
drop policy if exists "Allow public read appointments" on public.appointments;
drop policy if exists "Allow public read schedule_days" on public.schedule_days;
revoke select on public.appointments from anon, authenticated;
revoke select on public.schedule_days from anon, authenticated;
