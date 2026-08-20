# Gear X Billing Configuration

## Authority and identity

RevenueCat brokers App Store and Play Billing lifecycle events; Postgres is Gear X's capability authority. The mobile SDK may initiate, restore, and manage purchases, but it never grants cloud access. After every purchase or restore, the app fetches `GET /v1/entitlements`, and every cloud request independently reserves an allowed capability in Postgres before provider work.

The RevenueCat App User ID must be the authenticated Supabase user UUID returned by `POST /v1/mobile/session`. Do not use an email, device ID, or a client-submitted UUID. If reinstall creates a replacement anonymous Supabase identity, RevenueCat restore/log-in associates the purchase with the replacement UUID and a verified `TRANSFER` event moves server entitlement authority. A future permanent-account link must preserve or explicitly migrate this UUID association; it must not replace local SQLite content.

## External setup

1. Create one RevenueCat project and connect its Apple App Store and Google Play apps.
2. Create the Apple and Google subscription products after final names, billing periods, prices, tax, territories, and grace policy are approved. Do not reuse the SQL example identifiers below as marketing commitments.
3. Import both stores' products into RevenueCat. Create one current offering and attach packages. The client paywall reads the remotely configured offering.
4. Enable RevenueCat Customer Center if the Manage subscription action will be shipped.
5. Add a RevenueCat webhook with URL `https://<GEAR_X_PROJECT_REF>.supabase.co/functions/v1/gear-x/v1/billing/revenuecat/webhook`, an unguessable authorization header value, and HMAC signing enabled. Subscribe to production and sandbox lifecycle events.
6. Put that exact header value in `REVENUECAT_WEBHOOK_AUTHORIZATION` and the one-time signing secret in `REVENUECAT_WEBHOOK_SIGNING_SECRET` in Supabase Edge Function secrets. Gear X verifies the HMAC-SHA256 over the raw body, uses a constant-time comparison, and rejects signatures outside a five-minute replay window before parsing JSON.
7. Put only the platform-specific public RevenueCat SDK keys in the EAS build environment:

```text
EXPO_PUBLIC_GEAR_X_REVENUECAT_APPLE_KEY=appl_<public-sdk-key>
EXPO_PUBLIC_GEAR_X_REVENUECAT_GOOGLE_KEY=goog_<public-sdk-key>
```

Never put RevenueCat secret/API keys, store credentials, service-account JSON, webhook authorization, Supabase service-role keys, or AI-provider keys in Expo variables.

## Server plan configuration

The migration creates only `baseline`, with no hosted-cloud access. Insert launch plans and product mappings through an audited service-role/admin migration after commercial values are approved. This deliberately incomplete example shows the fields, not a launch plan:

```sql
insert into public.gear_x_plan_definitions (
  id, display_name, cloud_capabilities, capability_daily_limits,
  transcription_daily_ms, transcription_monthly_ms,
  transcription_daily_requests, intelligence_daily_requests,
  intelligence_monthly_tokens, rate_limit_per_minute,
  max_audio_duration_ms, max_audio_bytes, max_context_bytes, model_class
) values (
  '<INTERNAL_PLAN_ID>', '<CONSUMER_DISPLAY_NAME>',
  array['cloud_transcription', 'cloud_summarization'],
  '{"cloud_transcription": <DAILY_REQUEST_LIMIT>}'::jsonb,
  <DAILY_DURATION_MS>, <MONTHLY_DURATION_MS>,
  <DAILY_TRANSCRIPTION_REQUESTS>, <DAILY_INTELLIGENCE_REQUESTS>,
  <MONTHLY_INTELLIGENCE_TOKENS>, <ROLLING_REQUESTS_PER_MINUTE>,
  <MAX_AUDIO_DURATION_MS>, <MAX_AUDIO_BYTES>, <MAX_CONTEXT_BYTES>, 'standard'
);

insert into public.gear_x_billing_product_mappings (product_id, plan_id, store)
values
  ('<APPLE_PRODUCT_ID>', '<INTERNAL_PLAN_ID>', 'app_store'),
  ('<GOOGLE_PRODUCT_ID>', '<INTERNAL_PLAN_ID>', 'play_store');
```

Capabilities are independent of tiers: `cloud_transcription`, `cloud_extraction`, `cloud_weaving`, `cloud_summarization`, `cloud_questioning`, and `cloud_answer_synthesis`. Adding a product mapping does not enable cloud globally.

## Cost controls

Provider prices are server configuration. Set conservative reservation rates in Supabase secrets:

```text
GEAR_X_STT_MICROS_PER_HOUR=<estimated provider cost in millionths of currency per audio hour>
GEAR_X_INTELLIGENCE_MICROS_PER_MILLION_RESERVED=<estimated cost in millionths per million reserved tokens>
```

Then set non-zero reviewed budgets and explicitly enable cloud:

```sql
update public.gear_x_cloud_control
set enabled = true,
    daily_budget_micros = <REVIEWED_DAILY_BUDGET>,
    monthly_budget_micros = <REVIEWED_MONTHLY_BUDGET>,
    disabled_capabilities = '{}',
    updated_at = now()
where singleton = true;
```

Cloud is fail-closed after migration: `enabled=false` and zero budgets. Set `enabled=false` for an immediate provider kill switch. Individual capabilities can be disabled without an app release. Per-user duration, request, token, size, capability, and rolling-rate limits remain enforced atomically even while the global switch is on.

## Lifecycle verification

Use both Apple sandbox and Google license testers. Verify initial purchase, renewal, cancellation with access through paid period, uncancellation, upgrade, downgrade/product change, billing retry with and without grace, expiration, refund/customer-support revocation, restore after reinstall, identity transfer, duplicate webhook, and older webhook. Confirm `/v1/entitlements` changes only after the authenticated webhook is accepted, and confirm every revoked/expired capability is rejected before any provider call.

Billing records contain only user/product/event identifiers and lifecycle metadata. Cloud usage records contain counts, duration, tokens, estimated cost, provider/capability, timestamps, and status—never receipt bodies, audio, transcripts, prompts, responses, or raw provider errors.
