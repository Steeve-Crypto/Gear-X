alter table public.gear_x_plan_definitions
  add column capability_monthly_limits jsonb not null default '{}'::jsonb,
  add column capability_model_classes jsonb not null default '{}'::jsonb,
  add column intelligence_monthly_input_tokens bigint not null default 0 check (intelligence_monthly_input_tokens >= 0),
  add column intelligence_monthly_output_tokens bigint not null default 0 check (intelligence_monthly_output_tokens >= 0),
  add column monthly_provider_budget_micros bigint not null default 0 check (monthly_provider_budget_micros >= 0),
  add column stt_micros_per_hour bigint not null default 0 check (stt_micros_per_hour >= 0),
  add column standard_input_micros_per_million bigint not null default 0 check (standard_input_micros_per_million >= 0),
  add column standard_output_micros_per_million bigint not null default 0 check (standard_output_micros_per_million >= 0),
  add column premium_input_micros_per_million bigint not null default 0 check (premium_input_micros_per_million >= 0),
  add column premium_output_micros_per_million bigint not null default 0 check (premium_output_micros_per_million >= 0),
  add column monthly_price_cents integer not null default 0 check (monthly_price_cents >= 0);

alter table public.gear_x_plan_definitions drop constraint gear_x_plan_definitions_reset_period_check;
alter table public.gear_x_plan_definitions add constraint gear_x_plan_definitions_reset_period_check
  check (reset_period in ('calendar_day', 'calendar_month', 'billing_period'));

alter table public.gear_x_billing_product_mappings
  add column revenuecat_entitlement_id text;
alter table public.gear_x_billing_product_mappings
  drop constraint gear_x_billing_product_mappings_pkey;
alter table public.gear_x_billing_product_mappings
  add constraint gear_x_billing_product_mappings_pkey primary key (store, product_id);

alter table public.gear_x_subscriptions
  add column current_period_started_at timestamptz,
  add column pending_plan_id text references public.gear_x_plan_definitions(id),
  add column pending_effective_at timestamptz,
  add column pending_event_at timestamptz;
alter table public.gear_x_billing_events
  add column store text,
  add column revenuecat_entitlement_id text;
alter table public.gear_x_cloud_usage
  add column reserved_input_tokens integer not null default 0 check (reserved_input_tokens >= 0),
  add column reserved_output_tokens integer not null default 0 check (reserved_output_tokens >= 0),
  add column actual_cost_micros bigint check (actual_cost_micros is null or actual_cost_micros >= 0);

update public.gear_x_plan_definitions set active = false, updated_at = now() where id = 'baseline';

insert into public.gear_x_plan_definitions (
  id, display_name, cloud_capabilities, capability_daily_limits, capability_monthly_limits,
  capability_model_classes, transcription_daily_ms, transcription_monthly_ms,
  transcription_daily_requests, intelligence_daily_requests,
  intelligence_monthly_input_tokens, intelligence_monthly_output_tokens,
  rate_limit_per_minute, max_audio_duration_ms, max_audio_bytes, max_context_bytes,
  model_class, reset_period, monthly_provider_budget_micros, stt_micros_per_hour,
  standard_input_micros_per_million, standard_output_micros_per_million,
  premium_input_micros_per_million, premium_output_micros_per_million, monthly_price_cents
) values
  ('free', 'GearX Free',
   array['cloud_transcription','cloud_extraction','cloud_weaving','cloud_summarization','cloud_questioning','cloud_answer_synthesis'],
   '{"cloud_transcription":10,"cloud_extraction":2,"cloud_weaving":1,"cloud_summarization":2,"cloud_questioning":2,"cloud_answer_synthesis":1}',
   '{"cloud_transcription":30,"cloud_extraction":10,"cloud_weaving":3,"cloud_summarization":5,"cloud_questioning":5,"cloud_answer_synthesis":3}',
   '{}', 1800000, 1800000, 10, 3, 30000, 15000, 3, 900000, 10485760, 24000,
   'standard', 'calendar_month', 250000, 100000, 1250000, 2500000, 2000000, 6000000, 0),
  ('pro', 'GearX Pro',
   array['cloud_transcription','cloud_extraction','cloud_weaving','cloud_summarization','cloud_questioning','cloud_answer_synthesis'],
   '{"cloud_transcription":100,"cloud_extraction":30,"cloud_weaving":15,"cloud_summarization":15,"cloud_questioning":15,"cloud_answer_synthesis":15}',
   '{"cloud_transcription":1000,"cloud_extraction":300,"cloud_weaving":100,"cloud_summarization":100,"cloud_questioning":100,"cloud_answer_synthesis":100}',
   '{"cloud_weaving":"premium","cloud_answer_synthesis":"premium"}',
   36000000, 36000000, 100, 50, 300000, 100000, 10, 3600000, 26214400, 24000,
   'standard', 'billing_period', 3000000, 100000, 1250000, 2500000, 2000000, 6000000, 999),
  ('max', 'GearX Max',
   array['cloud_transcription','cloud_extraction','cloud_weaving','cloud_summarization','cloud_questioning','cloud_answer_synthesis'],
   '{"cloud_transcription":300,"cloud_extraction":90,"cloud_weaving":45,"cloud_summarization":45,"cloud_questioning":45,"cloud_answer_synthesis":45}',
   '{"cloud_transcription":3000,"cloud_extraction":900,"cloud_weaving":300,"cloud_summarization":300,"cloud_questioning":300,"cloud_answer_synthesis":300}',
   '{"cloud_weaving":"premium","cloud_answer_synthesis":"premium"}',
   108000000, 108000000, 300, 150, 900000, 300000, 15, 7200000, 41943040, 24000,
   'standard', 'billing_period', 7000000, 100000, 1250000, 2500000, 2000000, 6000000, 1999)
on conflict (id) do update set
  display_name = excluded.display_name, cloud_capabilities = excluded.cloud_capabilities,
  capability_daily_limits = excluded.capability_daily_limits,
  capability_monthly_limits = excluded.capability_monthly_limits,
  capability_model_classes = excluded.capability_model_classes,
  transcription_daily_ms = excluded.transcription_daily_ms,
  transcription_monthly_ms = excluded.transcription_monthly_ms,
  transcription_daily_requests = excluded.transcription_daily_requests,
  intelligence_daily_requests = excluded.intelligence_daily_requests,
  intelligence_monthly_input_tokens = excluded.intelligence_monthly_input_tokens,
  intelligence_monthly_output_tokens = excluded.intelligence_monthly_output_tokens,
  rate_limit_per_minute = excluded.rate_limit_per_minute,
  max_audio_duration_ms = excluded.max_audio_duration_ms, max_audio_bytes = excluded.max_audio_bytes,
  max_context_bytes = excluded.max_context_bytes, model_class = excluded.model_class,
  reset_period = excluded.reset_period, monthly_provider_budget_micros = excluded.monthly_provider_budget_micros,
  stt_micros_per_hour = excluded.stt_micros_per_hour,
  standard_input_micros_per_million = excluded.standard_input_micros_per_million,
  standard_output_micros_per_million = excluded.standard_output_micros_per_million,
  premium_input_micros_per_million = excluded.premium_input_micros_per_million,
  premium_output_micros_per_million = excluded.premium_output_micros_per_million,
  monthly_price_cents = excluded.monthly_price_cents, active = true, updated_at = now();

insert into public.gear_x_billing_product_mappings
  (store, product_id, plan_id, revenuecat_entitlement_id)
values
  ('app_store', 'gearx_pro_monthly', 'pro', 'gearx_pro'),
  ('play_store', 'gearx_pro_monthly', 'pro', 'gearx_pro'),
  ('app_store', 'gearx_max_monthly', 'max', 'gearx_max'),
  ('play_store', 'gearx_max_monthly', 'max', 'gearx_max')
on conflict (store, product_id) do update set plan_id = excluded.plan_id,
  revenuecat_entitlement_id = excluded.revenuecat_entitlement_id, active = true, updated_at = now();

drop function if exists public.reserve_gear_x_entitled_usage(uuid,text,text,integer,integer,integer,bigint);
create function public.reserve_gear_x_entitled_usage(
  p_user_id uuid, p_capability text, p_provider text, p_request_bytes integer,
  p_duration_ms integer, p_reserved_input_tokens integer, p_reserved_output_tokens integer
)
returns table (allowed boolean, reason text, usage_id bigint, plan_id text, model_class text, remaining bigint)
language plpgsql security definer set search_path = public
as $$
declare
  v_plan public.gear_x_plan_definitions%rowtype;
  v_subscription public.gear_x_subscriptions%rowtype;
  v_control public.gear_x_cloud_control%rowtype;
  v_period_start timestamptz := date_trunc('month', now() at time zone 'utc') at time zone 'utc';
  v_daily_transcription_requests bigint;
  v_daily_intelligence_requests bigint;
  v_daily_duration bigint;
  v_period_duration bigint;
  v_period_input_tokens bigint;
  v_period_output_tokens bigint;
  v_period_user_cost bigint;
  v_rate bigint;
  v_daily_global_cost bigint;
  v_monthly_global_cost bigint;
  v_usage_id bigint;
  v_reason text;
  v_daily_capability_limit integer;
  v_monthly_capability_limit integer;
  v_daily_capability_count bigint;
  v_period_capability_count bigint;
  v_model_class text;
  v_estimated_cost_micros bigint;
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
    select * into v_plan from public.gear_x_plan_definitions where id = 'free' and active = true;
  else
    select * into v_plan from public.gear_x_plan_definitions
      where id = v_subscription.plan_id and active = true and effective_at <= now()
        and (expires_at is null or expires_at > now());
    if found and v_plan.reset_period = 'billing_period' then
      if v_subscription.current_period_started_at is null then
        v_reason := coalesce(v_reason, 'entitlement');
      else
        v_period_start := v_subscription.current_period_started_at;
      end if;
    end if;
  end if;

  if not found or not (p_capability = any(v_plan.cloud_capabilities)) then v_reason := coalesce(v_reason, 'entitlement'); end if;
  if p_request_bytes < 0 or p_duration_ms < 0 or p_reserved_input_tokens < 0 or p_reserved_output_tokens < 0 then v_reason := 'invalid'; end if;
  if p_capability = 'cloud_transcription' and (p_duration_ms > v_plan.max_audio_duration_ms or p_request_bytes > v_plan.max_audio_bytes) then v_reason := 'plan_limit'; end if;
  if p_capability <> 'cloud_transcription' and p_request_bytes > v_plan.max_context_bytes then v_reason := 'plan_limit'; end if;

  v_model_class := coalesce(v_plan.capability_model_classes ->> p_capability, v_plan.model_class, 'standard');
  if p_capability = 'cloud_transcription' then
    v_estimated_cost_micros := ceil((p_duration_ms::numeric / 3600000) * v_plan.stt_micros_per_hour)::bigint;
  elsif v_model_class = 'premium' then
    v_estimated_cost_micros := ceil((p_reserved_input_tokens::numeric / 1000000) * v_plan.premium_input_micros_per_million
      + (p_reserved_output_tokens::numeric / 1000000) * v_plan.premium_output_micros_per_million)::bigint;
  else
    v_estimated_cost_micros := ceil((p_reserved_input_tokens::numeric / 1000000) * v_plan.standard_input_micros_per_million
      + (p_reserved_output_tokens::numeric / 1000000) * v_plan.standard_output_micros_per_million)::bigint;
  end if;

  select count(*) into v_rate from public.gear_x_cloud_usage
    where user_id = p_user_id and created_at >= now() - interval '1 minute';
  select count(*) filter (where capability = 'cloud_transcription'),
    count(*) filter (where capability <> 'cloud_transcription'), coalesce(sum(duration_ms), 0)
    into v_daily_transcription_requests, v_daily_intelligence_requests, v_daily_duration
    from public.gear_x_cloud_usage where user_id = p_user_id
      and created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc';
  select count(*) into v_daily_capability_count from public.gear_x_cloud_usage
    where user_id = p_user_id and capability = p_capability
      and created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc';
  select count(*), coalesce(sum(duration_ms), 0),
    coalesce(sum(coalesce(input_tokens, reserved_input_tokens)), 0),
    coalesce(sum(coalesce(output_tokens, reserved_output_tokens)), 0),
    coalesce(sum(coalesce(actual_cost_micros, estimated_cost_micros)), 0)
    into v_period_capability_count, v_period_duration, v_period_input_tokens,
      v_period_output_tokens, v_period_user_cost
    from public.gear_x_cloud_usage where user_id = p_user_id
      and capability = p_capability and created_at >= v_period_start;
  if p_capability <> 'cloud_transcription' then
    select coalesce(sum(coalesce(input_tokens, reserved_input_tokens)), 0),
      coalesce(sum(coalesce(output_tokens, reserved_output_tokens)), 0),
      coalesce(sum(coalesce(actual_cost_micros, estimated_cost_micros)), 0)
      into v_period_input_tokens, v_period_output_tokens, v_period_user_cost
      from public.gear_x_cloud_usage where user_id = p_user_id and created_at >= v_period_start;
  else
    select coalesce(sum(duration_ms), 0), coalesce(sum(coalesce(actual_cost_micros, estimated_cost_micros)), 0)
      into v_period_duration, v_period_user_cost
      from public.gear_x_cloud_usage where user_id = p_user_id and created_at >= v_period_start;
  end if;
  v_daily_capability_limit := nullif(v_plan.capability_daily_limits ->> p_capability, '')::integer;
  v_monthly_capability_limit := nullif(v_plan.capability_monthly_limits ->> p_capability, '')::integer;
  select coalesce(sum(coalesce(actual_cost_micros, estimated_cost_micros)), 0) into v_daily_global_cost
    from public.gear_x_cloud_usage where created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc';
  select coalesce(sum(coalesce(actual_cost_micros, estimated_cost_micros)), 0) into v_monthly_global_cost
    from public.gear_x_cloud_usage where created_at >= date_trunc('month', now() at time zone 'utc') at time zone 'utc';

  if v_reason is null and v_rate >= v_plan.rate_limit_per_minute then v_reason := 'rate'; end if;
  if v_reason is null and (v_daily_capability_limit is null or v_daily_capability_limit < 1
    or v_daily_capability_count >= v_daily_capability_limit
    or v_monthly_capability_limit is null or v_monthly_capability_limit < 1
    or v_period_capability_count >= v_monthly_capability_limit) then v_reason := 'quota'; end if;
  if v_reason is null and p_capability = 'cloud_transcription' and (
    v_daily_duration + p_duration_ms > v_plan.transcription_daily_ms
    or v_period_duration + p_duration_ms > v_plan.transcription_monthly_ms
    or v_daily_transcription_requests >= v_plan.transcription_daily_requests) then v_reason := 'quota'; end if;
  if v_reason is null and p_capability <> 'cloud_transcription' and (
    v_daily_intelligence_requests >= v_plan.intelligence_daily_requests
    or v_period_input_tokens + p_reserved_input_tokens > v_plan.intelligence_monthly_input_tokens
    or v_period_output_tokens + p_reserved_output_tokens > v_plan.intelligence_monthly_output_tokens) then v_reason := 'quota'; end if;
  if v_reason is null and (v_plan.monthly_provider_budget_micros <= 0
    or v_period_user_cost + v_estimated_cost_micros > v_plan.monthly_provider_budget_micros) then v_reason := 'quota'; end if;
  if v_reason is null and (v_control.daily_budget_micros <= 0 or v_control.monthly_budget_micros <= 0
    or v_daily_global_cost + v_estimated_cost_micros > v_control.daily_budget_micros
    or v_monthly_global_cost + v_estimated_cost_micros > v_control.monthly_budget_micros) then v_reason := 'budget'; end if;

  if v_reason is not null then
    return query select false, v_reason, null::bigint, coalesce(v_plan.id, 'free'), coalesce(v_model_class, 'standard'), 0::bigint;
    return;
  end if;

  insert into public.gear_x_cloud_usage
    (user_id, plan_id, capability, provider, request_bytes, duration_ms, reserved_tokens,
     reserved_input_tokens, reserved_output_tokens, estimated_cost_micros, status)
  values
    (p_user_id, v_plan.id, p_capability, left(p_provider, 64), p_request_bytes, p_duration_ms,
     p_reserved_input_tokens + p_reserved_output_tokens, p_reserved_input_tokens,
     p_reserved_output_tokens, v_estimated_cost_micros, 'reserved')
  returning id into v_usage_id;

  return query select true, null::text, v_usage_id, v_plan.id, v_model_class,
    case when p_capability = 'cloud_transcription'
      then greatest(v_plan.transcription_monthly_ms - v_period_duration - p_duration_ms, 0)
      else least(
        greatest(v_plan.intelligence_monthly_input_tokens - v_period_input_tokens - p_reserved_input_tokens, 0),
        greatest(v_plan.intelligence_monthly_output_tokens - v_period_output_tokens - p_reserved_output_tokens, 0)
      )
    end::bigint;
end;
$$;

drop function if exists public.complete_gear_x_cloud_usage(bigint,text,integer,integer);
create function public.complete_gear_x_cloud_usage(
  p_usage_id bigint, p_status text, p_input_tokens integer, p_output_tokens integer,
  p_actual_cost_micros bigint
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('completed', 'provider_failed', 'malformed_output') then raise exception 'invalid status'; end if;
  update public.gear_x_cloud_usage set status = p_status, input_tokens = p_input_tokens,
    output_tokens = p_output_tokens, actual_cost_micros = p_actual_cost_micros, completed_at = now()
  where id = p_usage_id and status = 'reserved';
end;
$$;

drop function if exists public.apply_gear_x_billing_event(text,text,timestamptz,uuid,text,text,text,timestamptz,timestamptz,boolean,text);
create function public.apply_gear_x_billing_event(
  p_event_id text, p_event_type text, p_event_at timestamptz, p_user_id uuid,
  p_product_id text, p_plan_id text, p_status text, p_period_started_at timestamptz,
  p_expires_at timestamptz, p_grace_expires_at timestamptz, p_cancel_at_period_end boolean,
  p_environment text, p_store text, p_revenuecat_entitlement_id text, p_pending_change boolean
)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_inserted integer;
begin
  insert into public.gear_x_billing_events
    (event_id, user_id, event_type, product_id, environment, event_at, applied, store, revenuecat_entitlement_id)
  values (p_event_id, p_user_id, p_event_type, p_product_id, p_environment, p_event_at, false, p_store, p_revenuecat_entitlement_id)
  on conflict (event_id) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then return false; end if;
  if p_plan_id is null then return false; end if;
  if p_pending_change then
    update public.gear_x_subscriptions set pending_plan_id = p_plan_id,
      pending_effective_at = p_expires_at, pending_event_at = p_event_at, updated_at = now()
    where user_id = p_user_id and (pending_event_at is null or pending_event_at <= p_event_at);
    update public.gear_x_billing_events set applied = true where event_id = p_event_id;
    return true;
  end if;
  insert into public.gear_x_subscriptions
    (user_id, plan_id, status, source_customer_id, source_product_id, current_period_started_at,
     expires_at, grace_expires_at, cancel_at_period_end, environment, event_at)
  values (p_user_id, p_plan_id, p_status, p_user_id::text, p_product_id, p_period_started_at,
     p_expires_at, p_grace_expires_at, p_cancel_at_period_end, p_environment, p_event_at)
  on conflict (user_id) do update set plan_id = excluded.plan_id, status = excluded.status,
    source_product_id = excluded.source_product_id,
    current_period_started_at = coalesce(excluded.current_period_started_at, gear_x_subscriptions.current_period_started_at),
    expires_at = excluded.expires_at, grace_expires_at = excluded.grace_expires_at,
    cancel_at_period_end = excluded.cancel_at_period_end, environment = excluded.environment,
    event_at = excluded.event_at,
    pending_plan_id = case when p_event_type in ('INITIAL_PURCHASE','RENEWAL') then null else gear_x_subscriptions.pending_plan_id end,
    pending_effective_at = case when p_event_type in ('INITIAL_PURCHASE','RENEWAL') then null else gear_x_subscriptions.pending_effective_at end,
    pending_event_at = case when p_event_type in ('INITIAL_PURCHASE','RENEWAL') then null else gear_x_subscriptions.pending_event_at end,
    updated_at = now()
  where gear_x_subscriptions.event_at <= excluded.event_at;
  update public.gear_x_billing_events set applied = true where event_id = p_event_id;
  return true;
end;
$$;

revoke all on function public.reserve_gear_x_entitled_usage(uuid,text,text,integer,integer,integer,integer),
  function public.complete_gear_x_cloud_usage(bigint,text,integer,integer,bigint),
  function public.apply_gear_x_billing_event(text,text,timestamptz,uuid,text,text,text,timestamptz,timestamptz,timestamptz,boolean,text,text,text,boolean)
  from public, anon, authenticated;
grant execute on function public.reserve_gear_x_entitled_usage(uuid,text,text,integer,integer,integer,integer),
  function public.complete_gear_x_cloud_usage(bigint,text,integer,integer,bigint),
  function public.apply_gear_x_billing_event(text,text,timestamptz,uuid,text,text,text,timestamptz,timestamptz,timestamptz,boolean,text,text,text,boolean)
  to service_role;
