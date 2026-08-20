# Gear X Billing Configuration

## Authority and identity

RevenueCat brokers App Store and Play Billing lifecycle events; Postgres is Gear X's capability authority. The mobile SDK may initiate, restore, and manage purchases, but it never grants cloud access. After every purchase or restore, the app fetches `GET /v1/entitlements`, and every cloud request independently reserves an allowed capability in Postgres before provider work.

The RevenueCat App User ID must be the authenticated Supabase user UUID returned by `POST /v1/mobile/session`. Do not use an email, device ID, or a client-submitted UUID. If reinstall creates a replacement anonymous Supabase identity, RevenueCat restore/log-in associates the purchase with the replacement UUID and a verified `TRANSFER` event moves server entitlement authority. A future permanent-account link must preserve or explicitly migrate this UUID association; it must not replace local SQLite content.

## External setup

1. Create one RevenueCat project and connect its Apple App Store and Google Play apps.
2. In App Store Connect, create one subscription group with `gearx_max_monthly` ranked above `gearx_pro_monthly`. Configure Pro at USD $9.99/month and Max at USD $19.99/month, then complete localized names, tax, territories, review information, and grace policy.
3. In Google Play Console, create subscriptions `gearx_pro_monthly` and `gearx_max_monthly`, each with an auto-renewing monthly base plan. The backend normalizes RevenueCat's optional `:base_plan_id` suffix while retaining these approved product IDs.
4. In RevenueCat, create entitlements `gearx_pro` and `gearx_max`; attach each platform's matching product. Create the current offering `default` with custom packages `pro_monthly` and `max_monthly`. Do not create annual packages.
5. Enable RevenueCat Customer Center for the Manage subscription action.
6. Add a RevenueCat webhook with URL `https://<GEAR_X_PROJECT_REF>.supabase.co/functions/v1/gear-x/v1/billing/revenuecat/webhook`, an unguessable authorization header value, and HMAC signing enabled. Subscribe to production and sandbox lifecycle events.
7. Put that exact header value in `REVENUECAT_WEBHOOK_AUTHORIZATION` and the one-time signing secret in `REVENUECAT_WEBHOOK_SIGNING_SECRET` in Supabase Edge Function secrets. Gear X verifies the HMAC-SHA256 over the raw body, uses a constant-time comparison, and rejects signatures outside a five-minute replay window before parsing JSON.
8. Put only the platform-specific public RevenueCat SDK keys in the EAS build environment:

```text
EXPO_PUBLIC_GEAR_X_REVENUECAT_APPLE_KEY=appl_<public-sdk-key>
EXPO_PUBLIC_GEAR_X_REVENUECAT_GOOGLE_KEY=goog_<public-sdk-key>
```

Never put RevenueCat secret/API keys, store credentials, service-account JSON, webhook authorization, Supabase service-role keys, or AI-provider keys in Expo variables.

## Approved server plan configuration

Migration `20260820003000_launch_plans.sql` is the economic authority. It seeds only the approved monthly launch plans:

| Plan | Customer price | Cloud transcription | Internal input/output ceiling | Internal per-user provider ceiling |
| --- | ---: | ---: | ---: | ---: |
| `free` | $0 | 30 minutes/server UTC month | 30,000 / 15,000 | $0.25/period |
| `pro` | $9.99/month | 10 hours/verified billing period | 300,000 / 100,000 | $3.00/period |
| `max` | $19.99/month | 30 hours/verified billing period | 900,000 / 300,000 | $7.00/period |

All three retain every local feature. Cloud extraction, weaving, summarization, questioning, and answer synthesis have independent daily and period request ceilings. Free is a small trial; Max intelligence capacity is exactly three times Pro. The migration maps the same approved product IDs independently by store using `(store, product_id)` and maps RevenueCat `gearx_pro`/`gearx_max` entitlements.

Paid usage starts at verified `purchased_at_ms` and resets at the verified expiration/renewal boundary. A `PRODUCT_CHANGE` event records a pending plan only; the existing plan remains authoritative until RevenueCat sends the effective renewal or initial-purchase event. Free usage resets at a server UTC month boundary. Reinstall, device identity, or client timestamps cannot reset an allowance.

## Cost controls

Provider prices are server configuration in the plan table and must be updated through an audited migration/admin change before enabling a provider. The August 2026 launch assumptions are REST speech-to-text $0.10/hour, standard text $1.25/million input and $2.50/million output, and premium text $2.00/million input and $6.00/million output. Current reference: [xAI pricing](https://docs.x.ai/developers/pricing). Reservations use the configured model class and separate input/output estimates; provider-reported actual cost replaces the estimate when available.

At the conservative premium rate, full transcription plus full intelligence models to $0.20 Free, $2.20 Pro, and $6.60 Max, below the hard $0.25/$3/$7 per-user ceilings. Prices can change; review the assumptions and reduce allowances or update rates before provider enablement. These figures are operations data and must not appear in consumer UI.

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

Cloud is fail-closed after migration: `enabled=false` and zero global budgets are the conservative development defaults. Production daily/monthly budgets are intentionally unset until reviewed. Set `enabled=false` for an immediate provider kill switch. Individual capabilities can be disabled without an app release. Per-user duration, request, separate input/output, per-capability, size, rate, billing-period, and spend limits remain atomic even while the global switch is on.

## Lifecycle verification

Use both Apple sandbox and Google license testers. Verify initial purchase, renewal, cancellation with access through paid period, uncancellation, immediate Pro→Max upgrade, deferred Max→Pro downgrade, billing retry with and without grace, expiration, refund/customer-support revocation, restore after reinstall, identity transfer, duplicate webhook, and older webhook. Confirm a downgrade remains pending until its effective renewal, `/v1/entitlements` changes only after an authenticated signed webhook, and revoked/expired capabilities are rejected before provider access.

Free cloud is bounded by the persisted authenticated user, conservative anonymous-signup IP throttling, per-capability/rate/period limits, per-user $0.25 ceiling, and global budgets. Set the production anonymous sign-up limit to 3/hour per IP or lower after load testing. This does not claim device identity is tamper-proof; require App Attest/Play Integrity in a later release if observed abuse justifies it. Paid restore remains store-verified and is not blocked by Free anti-abuse policy.

Billing records contain only user/product/event identifiers and lifecycle metadata. Cloud usage records contain counts, duration, tokens, estimated cost, provider/capability, timestamps, and status—never receipt bodies, audio, transcripts, prompts, responses, or raw provider errors.
