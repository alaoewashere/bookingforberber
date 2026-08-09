-- Preserve a private, immutable snapshot whenever a booked slot is released,
-- blocked, or deleted. The live appointment row can then become available
-- again without losing the customer record.
create table if not exists public.appointment_archives (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null,
  archived_at timestamptz not null default now(),
  archived_reason text not null check (archived_reason in ('released', 'blocked', 'deleted')),
  appointment_snapshot jsonb not null
);

create index if not exists appointment_archives_appointment_id_archived_at_idx
  on public.appointment_archives (appointment_id, archived_at desc);

alter table public.appointment_archives enable row level security;
revoke all on public.appointment_archives from anon, authenticated;

create or replace function public.archive_booked_appointment()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'DELETE' and old.status = 'booked' then
    insert into public.appointment_archives (appointment_id, archived_reason, appointment_snapshot)
    values (old.id, 'deleted', to_jsonb(old));
    return old;
  end if;

  if tg_op = 'UPDATE' and old.status = 'booked' and new.status is distinct from old.status then
    insert into public.appointment_archives (appointment_id, archived_reason, appointment_snapshot)
    values (old.id, case when new.status = 'blocked' then 'blocked' else 'released' end, to_jsonb(old));
  end if;

  return new;
end;
$$;

revoke all on function public.archive_booked_appointment() from public, anon, authenticated;

drop trigger if exists archive_booked_appointment_before_status_change on public.appointments;
create trigger archive_booked_appointment_before_status_change
before update of status on public.appointments
for each row
when (old.status = 'booked' and new.status is distinct from old.status)
execute function public.archive_booked_appointment();

drop trigger if exists archive_booked_appointment_before_delete on public.appointments;
create trigger archive_booked_appointment_before_delete
before delete on public.appointments
for each row
when (old.status = 'booked')
execute function public.archive_booked_appointment();
