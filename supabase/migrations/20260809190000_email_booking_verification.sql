-- Email OTP is the public booking verification factor.
alter table public.appointments add column if not exists email text;
alter table public.appointments add column if not exists email_verified boolean not null default false;

alter table public.appointments drop constraint if exists appointments_email_length_check;
alter table public.appointments add constraint appointments_email_length_check
  check (email is null or char_length(email) between 3 and 254) not valid;

-- Keep email and verification state private; public availability is served by the API.
revoke select (email, email_verified) on public.appointments from anon, authenticated;
