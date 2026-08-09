-- Store validated customer name parts for new public bookings.
-- Existing customer_name values are preserved for backwards compatibility.
alter table public.appointments
  add column if not exists first_name text,
  add column if not exists last_name text;

alter table public.appointments drop constraint if exists appointments_first_name_length_check;
alter table public.appointments add constraint appointments_first_name_length_check
  check (first_name is null or char_length(first_name) between 2 and 30) not valid;

alter table public.appointments drop constraint if exists appointments_last_name_length_check;
alter table public.appointments add constraint appointments_last_name_length_check
  check (last_name is null or char_length(last_name) between 2 and 30) not valid;

alter table public.appointments drop constraint if exists appointments_name_parts_together_check;
alter table public.appointments add constraint appointments_name_parts_together_check
  check ((first_name is null and last_name is null) or (first_name is not null and last_name is not null)) not valid;

create index if not exists appointments_email_cooldown_idx
  on public.appointments (email, created_at desc)
  where status = 'booked' and email is not null;

-- Public clients continue to have no direct access to appointment data or writes.
revoke select (first_name, last_name) on public.appointments from anon, authenticated;
revoke insert, update, delete on public.appointments from anon, authenticated;
