create table if not exists public.gear_x_plan_definitions (
  id text primary key,
  display_name text not null,
  cloud_capabilities text[] not null default '{}',
  capability_daily_limits jsonb not null default '{}'::jsonb,
  transcription_daily_ms bigint not null default 0 check (transcription_daily_ms >= 0),
  transcription_monthly_ms bigint not null default 0 check (transcription_monthly_ms >= 0),
  transcription_daily_requests integer not null default 0 check (transcription_daily_requests >= 0),
  intelligence_daily_requests integer not null default 0 check (intelligence_daily_requests >= 0),
  intelligence_monthly_tokens bigint not null default 0 check (intelligence_monthly_tokens >= 0),
  rate_limit_per_minute integer not null default 0 check (rate_limit_per_minute >= 0),
  max_audio_duration_ms integer not null default 0 check (max_audio_duration_ms >= 0),
  max_audio_bytes integer not null default 0 check (max_audio_bytes >= 0),
  max_context_bytes integer not null default 0 check (max_context_bytes >= 0),
  model_class text not null default 'standard',
  reset_period text not null default 'calendar_month' check (reset_period in ('calendar_day', 'calendar_month')),
  effective_at timestamptz not null default now(),
  expires_at timestamptz,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.gear_x_plan_definitions (id, display_name)
values ('baseline', 'Local access')
on conflict (id) do nothing;

create table if not exists public.gear_x_billing_product_mappings (
  product_id text primary key,
  plan_id text not null references public.gear_x_plan_definitions(id),
  store text not null check (store in ('app_store', 'play_store', 'test')),
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.gear_x_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_id text not null references public.gear_x_plan_definitions(id),
  status text not null check (status in ('none', 'active', 'cancelled', 'billing_retry', 'grace', 'expired', 'revoked')),
  source text not null default 'revenuecat',
  source_customer_id text,
  source_product_id text,
  expires_at timestamptz,
  grace_expires_at timestamptz,
  cancel_at_period_end boolean not null default false,
  environment text not null default 'sandbox' check (environment in ('sandbox', 'production')),
  event_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.gear_x_billing_events (
  event_id text primary key,
  user_id uuid,
  event_type text not null,
  product_id text,
  environment text not null,
  event_at timestamptz not null,
  applied boolean not null,
  created_at timestamptz not null default now()
);

create table if not exists public.gear_x_cloud_control (
  singleton boolean primary key default true check (singleton),
  enabled boolean not null default false,
  daily_budget_micros bigint not null default 0 check (daily_budget_micros >= 0),
  monthly_budget_micros bigint not null default 0 check (monthly_budget_micros >= 0),
  disabled_capabilities text[] not null default '{}',
  updated_at timestamptz not null default now()
);

insert into public.gear_x_cloud_control (singleton, enabled)
values (true, false)
on conflict (singleton) do nothing;

create table if not exists public.gear_x_cloud_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null references public.gear_x_plan_definitions(id),
  capability text not null,
  provider text not null,
  request_bytes integer not null check (request_bytes >= 0),
  duration_ms integer not null default 0 check (duration_ms >= 0),
  reserved_tokens integer not null default 0 check (reserved_tokens >= 0),
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  estimated_cost_micros bigint not null default 0 check (estimated_cost_micros >= 0),
  status text not null check (status in ('reserved', 'completed', 'provider_failed', 'malformed_output')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists gear_x_cloud_usage_user_time
  on public.gear_x_cloud_usage (user_id, created_at desc);
create index if not exists gear_x_cloud_usage_global_time
  on public.gear_x_cloud_usage (created_at desc);

alter table public.gear_x_plan_definitions enable row level security;
alter table public.gear_x_billing_product_mappings enable row level security;
alter table public.gear_x_subscriptions enable row level security;
alter table public.gear_x_billing_events enable row level security;
alter table public.gear_x_cloud_control enable row level security;
alter table public.gear_x_cloud_usage enable row level security;
revoke all on public.gear_x_plan_definitions, public.gear_x_billing_product_mappings,
  public.gear_x_subscriptions, public.gear_x_billing_events, public.gear_x_cloud_control,
  public.gear_x_cloud_usage from anon, authenticated;

create or replace function public.reserve_gear_x_entitled_usage(
  p_user_id uuid,
  p_capability text,
  p_provider text,
  p_request_bytes integer,
  p_duration_ms integer,
  p_reserved_tokens integer,
  p_estimated_cost_micros bigint
)
returns table (allowed boolean, reason text, usage_id bigint, plan_id text, model_class text, remaining bigint)
language plpgsql security definer set search_path = public
as $$
declare
  v_plan public.gear_x_plan_definitions%rowtype;
  v_subscription public.gear_x_subscriptions%rowtype;
  v_control public.gear_x_cloud_control%rowtype;
  v_daily_transcription_requests bigint;
  v_daily_intelligence_requests bigint;
  v_daily_duration bigint;
  v_monthly_duration bigint;
  v_monthly_tokens bigint;
  v_rate bigint;
  v_daily_cost bigint;
  v_monthly_cost bigint;
  v_usage_id bigint;
  v_reason text;
  v_capability_limit integer;
  v_capability_count bigint;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 1));
  perform pg_advisory_xact_lock(94739581);

  select * into v_control from public.gear_x_cloud_control where singleton = true;
  if not found or not v_control.enabled then v_reason := 'disabled'; end if;
  if p_capability = any(coalesce(v_control.disabled_capabilities, '{}')) then v_reason := 'disabled'; end if;

  select * into v_subscription from public.gear_x_subscriptions where user_id = p_user_id;
  if not found or not (
    (v_subscription.status = 'active' and (v_subscription.expires_at is null or v_subscription.expires_at > now()))
    or (v_subscription.status = 'cancelled' and v_subscription.expires_at > now())
    or (v_subscription.status in ('grace', 'billing_retry') and v_subscription.grace_expires_at > now())
  ) then
    select * into v_plan from public.gear_x_plan_definitions where id = 'baseline';
  else
    select * into v_plan from public.gear_x_plan_definitions
      where id = v_subscription.plan_id and active = true and effective_at <= now()
        and (expires_at is null or expires_at > now());
  end if;

  if not found or not (p_capability = any(v_plan.cloud_capabilities)) then v_reason := coalesce(v_reason, 'entitlement'); end if;
  if p_request_bytes < 0 or p_duration_ms < 0 or p_reserved_tokens < 0 or p_estimated_cost_micros < 0 then v_reason := 'invalid'; end if;
  if p_capability = 'cloud_transcription' and (p_duration_ms > v_plan.max_audio_duration_ms or p_request_bytes > v_plan.max_audio_bytes) then v_reason := 'plan_limit'; end if;
  if p_capability <> 'cloud_transcription' and p_request_bytes > v_plan.max_context_bytes then v_reason := 'plan_limit'; end if;

  select count(*) into v_rate from public.gear_x_cloud_usage
    where user_id = p_user_id and created_at >= now() - interval '1 minute';
  select count(*) filter (where capability = 'cloud_transcription'),
    count(*) filter (where capability <> 'cloud_transcription'), coalesce(sum(duration_ms), 0)
    into v_daily_transcription_requests, v_daily_intelligence_requests, v_daily_duration
    from public.gear_x_cloud_usage where user_id = p_user_id
      and created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc';
  select count(*) into v_capability_count from public.gear_x_cloud_usage
    where user_id = p_user_id and capability = p_capability
      and created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc';
  v_capability_limit := nullif(v_plan.capability_daily_limits ->> p_capability, '')::integer;
  select coalesce(sum(duration_ms), 0), coalesce(sum(coalesce(input_tokens + output_tokens, reserved_tokens)), 0)
    into v_monthly_duration, v_monthly_tokens
    from public.gear_x_cloud_usage where user_id = p_user_id
      and created_at >= date_trunc('month', now() at time zone 'utc') at time zone 'utc';
  select coalesce(sum(estimated_cost_micros), 0) into v_daily_cost from public.gear_x_cloud_usage
    where created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc';
  select coalesce(sum(estimated_cost_micros), 0) into v_monthly_cost from public.gear_x_cloud_usage
    where created_at >= date_trunc('month', now() at time zone 'utc') at time zone 'utc';

  if v_reason is null and v_rate >= v_plan.rate_limit_per_minute then v_reason := 'rate'; end if;
  if v_reason is null and (v_capability_limit is null or v_capability_limit < 1
    or v_capability_count >= v_capability_limit) then v_reason := 'quota'; end if;
  if v_reason is null and p_capability = 'cloud_transcription' and (
    v_daily_duration + p_duration_ms > v_plan.transcription_daily_ms
    or v_monthly_duration + p_duration_ms > v_plan.transcription_monthly_ms
    or v_daily_transcription_requests >= v_plan.transcription_daily_requests) then v_reason := 'quota'; end if;
  if v_reason is null and p_capability <> 'cloud_transcription' and (
    v_daily_intelligence_requests >= v_plan.intelligence_daily_requests
    or v_monthly_tokens + p_reserved_tokens > v_plan.intelligence_monthly_tokens) then v_reason := 'quota'; end if;
  if v_reason is null and (v_control.daily_budget_micros <= 0 or v_control.monthly_budget_micros <= 0
    or v_daily_cost + p_estimated_cost_micros > v_control.daily_budget_micros
    or v_monthly_cost + p_estimated_cost_micros > v_control.monthly_budget_micros) then v_reason := 'budget'; end if;

  if v_reason is not null then
    return query select false, v_reason, null::bigint, coalesce(v_plan.id, 'baseline'), coalesce(v_plan.model_class, 'standard'), 0::bigint;
    return;
  end if;

  insert into public.gear_x_cloud_usage
    (user_id, plan_id, capability, provider, request_bytes, duration_ms, reserved_tokens, estimated_cost_micros, status)
  values
    (p_user_id, v_plan.id, p_capability, left(p_provider, 64), p_request_bytes, p_duration_ms, p_reserved_tokens, p_estimated_cost_micros, 'reserved')
  returning id into v_usage_id;

  return query select true, null::text, v_usage_id, v_plan.id, v_plan.model_class,
    case when p_capability = 'cloud_transcription'
      then greatest(v_plan.transcription_daily_ms - v_daily_duration - p_duration_ms, 0)
      else greatest(v_plan.intelligence_monthly_tokens - v_monthly_tokens - p_reserved_tokens, 0)
    end::bigint;
end;
$$;

create or replace function public.complete_gear_x_cloud_usage(
  p_usage_id bigint, p_status text, p_input_tokens integer, p_output_tokens integer
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('completed', 'provider_failed', 'malformed_output') then raise exception 'invalid status'; end if;
  update public.gear_x_cloud_usage set status = p_status, input_tokens = p_input_tokens,
    output_tokens = p_output_tokens, completed_at = now()
  where id = p_usage_id and status = 'reserved';
end;
$$;

create or replace function public.apply_gear_x_billing_event(
  p_event_id text, p_event_type text, p_event_at timestamptz, p_user_id uuid,
  p_product_id text, p_plan_id text, p_status text, p_expires_at timestamptz,
  p_grace_expires_at timestamptz, p_cancel_at_period_end boolean, p_environment text
)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_inserted integer;
begin
  insert into public.gear_x_billing_events
    (event_id, user_id, event_type, product_id, environment, event_at, applied)
  values (p_event_id, p_user_id, p_event_type, p_product_id, p_environment, p_event_at, false)
  on conflict (event_id) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then return false; end if;
  if p_plan_id is null then return false; end if;
  insert into public.gear_x_subscriptions
    (user_id, plan_id, status, source_customer_id, source_product_id, expires_at,
     grace_expires_at, cancel_at_period_end, environment, event_at)
  values (p_user_id, p_plan_id, p_status, p_user_id::text, p_product_id, p_expires_at,
     p_grace_expires_at, p_cancel_at_period_end, p_environment, p_event_at)
  on conflict (user_id) do update set plan_id = excluded.plan_id, status = excluded.status,
    source_product_id = excluded.source_product_id, expires_at = excluded.expires_at,
    grace_expires_at = excluded.grace_expires_at, cancel_at_period_end = excluded.cancel_at_period_end,
    environment = excluded.environment, event_at = excluded.event_at, updated_at = now()
  where gear_x_subscriptions.event_at <= excluded.event_at;
  update public.gear_x_billing_events set applied = true where event_id = p_event_id;
  return true;
end;
$$;

revoke all on function public.reserve_gear_x_entitled_usage(uuid,text,text,integer,integer,integer,bigint),
  function public.complete_gear_x_cloud_usage(bigint,text,integer,integer),
  function public.apply_gear_x_billing_event(text,text,timestamptz,uuid,text,text,text,timestamptz,timestamptz,boolean,text)
  from public, anon, authenticated;
grant execute on function public.reserve_gear_x_entitled_usage(uuid,text,text,integer,integer,integer,bigint),
  function public.complete_gear_x_cloud_usage(bigint,text,integer,integer),
  function public.apply_gear_x_billing_event(text,text,timestamptz,uuid,text,text,text,timestamptz,timestamptz,boolean,text)
  to service_role;
