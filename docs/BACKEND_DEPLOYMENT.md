# Gear X Backend Deployment

## Preconditions

- A dedicated Supabase project named GearX. Do not reuse another product's database.
- Anonymous sign-ins enabled in Supabase Auth.
- Supabase's anonymous-signup IP rate limit configured at 3/hour per IP or lower after load testing.
- Free/Pro/Max allowances and per-user ceilings are approved and migrated. Production global daily/monthly budgets still require an explicit operational review; xAI remains disabled.
- A RevenueCat project, configured store products, product-to-plan mappings, and a random webhook authorization value. See `docs/BILLING_CONFIGURATION.md`.
- The production web origin, if web access is enabled. Native apps do not require an origin allow-list entry.

## Deploy

Use the current Supabase CLI and replace only the bracketed project reference:

```powershell
npx supabase login
npx supabase link --project-ref <GEAR_X_PROJECT_REF>
npx supabase db push
npx supabase functions deploy gear-x --project-ref <GEAR_X_PROJECT_REF> --no-verify-jwt --use-api
```

`--no-verify-jwt` is intentional: the function verifies mobile bearer tokens itself so it can return the stable Gear X error contract. The RevenueCat webhook is externally reachable but requires both its configured authorization value and raw-body HMAC signature.

Set these in Supabase Dashboard → Edge Functions → Secrets. Never put them in an Expo environment:

```text
REVENUECAT_WEBHOOK_AUTHORIZATION=<random webhook authorization value>
REVENUECAT_WEBHOOK_SIGNING_SECRET=<RevenueCat HMAC signing secret>
# Leave all xAI values unset until final provider enablement is separately approved.
# XAI_API_KEY=<production xAI key>
# XAI_CHAT_MODEL_STANDARD=<approved routine model>
# XAI_CHAT_MODEL_PREMIUM=<approved higher-quality model>
GEAR_X_ALLOWED_ORIGINS=https://<production-web-origin>
GEAR_X_TRANSCRIPTION_DAILY_LIMIT=20
GEAR_X_INTELLIGENCE_DAILY_LIMIT=50
GEAR_X_REQUESTS_PER_MINUTE=10
GEAR_X_MAX_AUDIO_BYTES=41943040
GEAR_X_MAX_AUDIO_DURATION_MS=7200000
GEAR_X_MAX_GENERATE_BYTES=24000
GEAR_X_PROVIDER_TIMEOUT_MS=25000
```

The Supabase URL, publishable key, and function URL are intentionally public routing/auth-bootstrap values. Configure the Expo production environment with:

```text
EXPO_PUBLIC_GEAR_X_BACKEND_URL=https://<GEAR_X_PROJECT_REF>.supabase.co/functions/v1/gear-x
EXPO_PUBLIC_GEAR_X_SUPABASE_URL=https://<GEAR_X_PROJECT_REF>.supabase.co
EXPO_PUBLIC_GEAR_X_SUPABASE_PUBLISHABLE_KEY=<Supabase publishable key>
EXPO_PUBLIC_GEAR_X_REVENUECAT_APPLE_KEY=<public Apple SDK key>
EXPO_PUBLIC_GEAR_X_REVENUECAT_GOOGLE_KEY=<public Google SDK key>
```

## Authentication and abuse controls

In Supabase Dashboard:

1. Open Authentication → Sign In / Providers and enable Anonymous Sign-Ins.
2. Set anonymous Auth sign-up IP rate to 3/hour per IP or lower after legitimate install/load testing. The backend additionally enforces atomic plan capability, duration, request, separate input/output, size, rolling-rate, per-user spend, and global cost limits.
3. Do not enable CAPTCHA until the mobile app has a challenge/token UX; enabling it now would intentionally block anonymous signup. Add that UX before increasing exposure or signup limits.
4. Do not grant `anon` or `authenticated` direct access to backend usage, plan, subscription, billing-event, product-mapping, or cloud-control tables. Their migrations enable RLS and reserve service-role access.

Anonymous users receive the `authenticated` role and can later be linked to a permanent account. Their refresh token is stored with Expo SecureStore. Backend identity always comes from the verified JWT, never a submitted user ID.

## Live verification

Use a real development/production mobile build after configuring the public variables. Do not paste access tokens, audio, transcripts, prompts, or provider responses into logs.

Verify in this order:

1. Confirm `GET /health` without a bearer token returns `401` and `UNAUTHORIZED`.
2. Complete anonymous sign-in and confirm `POST /v1/mobile/session` returns the validated short-lived token.
3. Confirm the authenticated health request returns `{ "status": "ok" }`.
4. Confirm a new user resolves to `free`, with 30 monthly transcription minutes and bounded trial intelligence; attempts above each Free capability/period/spend limit must make no provider request.
5. Apply a sandbox subscription through a verified RevenueCat webhook and confirm only its mapped capabilities appear at `GET /v1/entitlements`.
6. Upload a short consented M4A recording and confirm a real configured-provider transcription returns the existing mobile segment shape.
7. Run entitled agent capabilities with task-scoped context and confirm schema validation and provider-reported token completion.
8. Remove consent and confirm `CONSENT_REQUIRED` occurs before a usage row is reserved.
9. Verify plan quota, rolling-rate, capability disablement, daily/monthly budget, and global kill-switch rejection, then restore reviewed settings.
10. Submit invalid MIME, duration, JSON, and oversized requests and verify structured errors.
11. Temporarily use an invalid provider configuration in a controlled window to verify redacted failure, then restore it.
12. Exercise purchase/restore/cancel/grace/expiry/refund/transfer fixtures from `docs/BILLING_CONFIGURATION.md`.
13. Export the production bundle and scan it for service/provider/store secrets. Only public SDK keys, the Supabase publishable key, and URLs may appear.

## Retention and rollback

The backend never stores request content. The `gear-x-usage-retention` Postgres cron job deletes legacy metadata-only usage rows after 35 days. Subscription-capable Auth identities are not automatically deleted; identity/account deletion requires coordinated billing reconciliation and an explicit user lifecycle. Provider audio/content retention follows the selected production provider-account settings and must be confirmed before launch.

To disable cloud processing without changing local behavior, set `gear_x_cloud_control.enabled=false`; removing the public backend variables in a later build is a second containment option. Roll back the Edge Function before dropping database functions/tables. Retain billing and usage history until store reconciliation, refund, tax, support, and retention obligations are satisfied.
