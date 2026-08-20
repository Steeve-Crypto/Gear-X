create table if not exists public.gear_x_backend_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  operation text not null check (operation in ('transcription', 'intelligence')),
  capability text,
  request_bytes integer not null check (request_bytes >= 0),
  status text not null check (status in ('reserved', 'quota_rejected', 'rate_rejected')),
  created_at timestamptz not null default now()
);

create index if not exists gear_x_backend_usage_user_time
  on public.gear_x_backend_usage (user_id, created_at desc);

alter table public.gear_x_backend_usage enable row level security;
revoke all on public.gear_x_backend_usage from anon, authenticated;

create or replace function public.reserve_gear_x_backend_usage(
  p_user_id uuid,
  p_operation text,
  p_capability text,
  p_request_bytes integer,
  p_daily_limit integer,
  p_rate_limit integer
)
returns table (allowed boolean, reason text, remaining integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_daily_count integer;
  v_minute_count integer;
  v_status text;
begin
  if p_operation not in ('transcription', 'intelligence')
     or p_request_bytes < 0
     or p_daily_limit < 1
     or p_rate_limit < 1 then
    raise exception 'invalid usage reservation';
  end if;

  -- Serialize reservations for this user so concurrent calls cannot overrun a limit.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  select count(*)::integer into v_daily_count
  from public.gear_x_backend_usage
  where user_id = p_user_id
    and operation = p_operation
    and status = 'reserved'
    and created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc';

  select count(*)::integer into v_minute_count
  from public.gear_x_backend_usage
  where user_id = p_user_id
    and status = 'reserved'
    and created_at >= now() - interval '1 minute';

  if v_minute_count >= p_rate_limit then
    v_status := 'rate_rejected';
  elsif v_daily_count >= p_daily_limit then
    v_status := 'quota_rejected';
  else
    v_status := 'reserved';
  end if;

  insert into public.gear_x_backend_usage
    (user_id, operation, capability, request_bytes, status)
  values
    (p_user_id, p_operation, left(p_capability, 64), p_request_bytes, v_status);

  return query select
    v_status = 'reserved',
    case
      when v_status = 'rate_rejected' then 'rate'
      when v_status = 'quota_rejected' then 'quota'
      else null
    end,
    greatest(p_daily_limit - v_daily_count - case when v_status = 'reserved' then 1 else 0 end, 0);
end;
$$;

revoke all on function public.reserve_gear_x_backend_usage(uuid, text, text, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.reserve_gear_x_backend_usage(uuid, text, text, integer, integer, integer)
  to service_role;

create or replace function public.delete_expired_gear_x_backend_usage()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted bigint;
begin
  delete from public.gear_x_backend_usage where created_at < now() - interval '35 days';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.delete_expired_gear_x_backend_usage() from public, anon, authenticated;
grant execute on function public.delete_expired_gear_x_backend_usage() to service_role;
