-- Barber Appointment Scheduler — appointments table
-- Run this in Supabase Dashboard → SQL Editor → New query → Run

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  time_slot text not null,
  customer_name text,
  status text not null default 'available'
    check (status in ('available', 'booked', 'blocked')),
  notes text,
  created_at timestamptz not null default now(),
  constraint unique_date_time unique (date, time_slot)
);

create index if not exists appointments_date_idx on public.appointments (date);
create index if not exists appointments_status_idx on public.appointments (status);

alter table public.appointments enable row level security;

-- Allow anon read/write for this internal barber tool (tighten in production)
create policy "Allow public read appointments"
  on public.appointments for select
  to anon, authenticated
  using (true);

create policy "Allow public insert appointments"
  on public.appointments for insert
  to anon, authenticated
  with check (true);

create policy "Allow public update appointments"
  on public.appointments for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "Allow public delete appointments"
  on public.appointments for delete
  to anon, authenticated
  using (true);
