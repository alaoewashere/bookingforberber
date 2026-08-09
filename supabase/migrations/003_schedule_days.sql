-- Optional custom labels for schedule days (date key matches appointments.date)

create table if not exists public.schedule_days (
  date date primary key,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.schedule_days enable row level security;

create policy "Allow public read schedule_days"
  on public.schedule_days for select
  to anon, authenticated
  using (true);
