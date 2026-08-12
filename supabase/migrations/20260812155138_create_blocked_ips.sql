-- Server-only IP blocklist. The existing appointments table and its rows are
-- intentionally untouched.
create table if not exists public.blocked_ips (
  id uuid primary key default gen_random_uuid(),
  ip_address inet not null unique,
  reason text,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  active boolean not null default true,
  constraint blocked_ips_reason_length check (reason is null or char_length(reason) between 1 and 500),
  constraint blocked_ips_expiry_check check (expires_at is null or expires_at > created_at)
);

create index if not exists blocked_ips_active_expiry_idx
  on public.blocked_ips (active, expires_at);

alter table public.blocked_ips enable row level security;
revoke all on table public.blocked_ips from public, anon, authenticated;
grant select, insert, update, delete on table public.blocked_ips to service_role;

-- Block the identified abusive public address for future requests. This does
-- not alter or delete the historical appointment that recorded this IP.
insert into public.blocked_ips (ip_address, reason, active)
values ('159.146.21.209'::inet, 'Abusive language during booking', true)
on conflict (ip_address) do update
set reason = excluded.reason,
    active = true;
