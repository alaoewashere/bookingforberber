-- Run in Supabase SQL Editor if you created the table before the named constraint existed.
-- Safe to run: skips if the constraint is already present.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'unique_date_time'
      and conrelid = 'public.appointments'::regclass
  ) then
    alter table public.appointments
      add constraint unique_date_time unique (date, time_slot);
  end if;
end $$;
