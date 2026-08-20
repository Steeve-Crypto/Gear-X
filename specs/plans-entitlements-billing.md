# Plans, Entitlements, Billing, and Cloud Economics

## Purpose
Keep Gear X's complete local experience independent of any cloud provider while granting paid cloud enhancements only from verified, server-authoritative subscription entitlements.

## Scope
Cloud capability entitlements, plan configuration, subscription lifecycle, RevenueCat abstraction and webhook synchronization, anonymous/store identity association, processing-mode interaction, duration/token metering, provider budgets, restore/manage/upgrade UI, and local fallback.

## Non-goals
Final marketing plan names, prices, paywall copy, web billing, implementing future local model adapters, moving local knowledge to a server, or treating xAI as required infrastructure.

## User stories
- Without a subscription I can record, retain sessions, search the Vault, use deterministic agents, manage Threads and Open Loops, export/delete data, and use supported device transcription.
- With an eligible subscription and consent I can use only the cloud capabilities and allowances granted to me.
- When cloud access, billing, quota, network, or a provider fails, my work remains local and Gear X uses an eligible local path.
- I can inspect cloud access, restore purchases, open a remotely configured upgrade surface, and manage an existing subscription.
- Cancelling at period end does not remove access early; expiration, refund, or revocation removes cloud access without deleting local data.

## Functional requirements
- Stable cloud capabilities are `cloud_transcription`, `cloud_extraction`, `cloud_weaving`, `cloud_summarization`, `cloud_questioning`, and `cloud_answer_synthesis`.
- Server-configurable plan definitions independently specify capabilities, transcription duration/count allowances, intelligence request/token allowances, rolling rate limits, model class, payload/audio limits, reset period, and effective dates.
- The no-subscription baseline grants no Gear X-hosted cloud capability and never limits local/device features.
- The authenticated Supabase identity resolves to a server subscription and effective plan. Client plan, user ID, quota, or billing claims are ignored.
- Effective lifecycle states cover none, active, cancelled-at-period-end, billing-retry, grace, expired, revoked/refunded, upgrade, downgrade, renewal, restore, and transfer.
- RevenueCat is behind a mobile `BillingProvider` interface and a server webhook synchronizer. Its public platform SDK keys are distinct from server webhook/API secrets.
- The RevenueCat App User ID is the authenticated Supabase UUID. Store restore may associate a replacement anonymous UUID after reinstall; verified transfer/purchase events update the server mapping. Later account linking preserves the UUID/subscription association and never overwrites local SQLite data.
- Private excludes cloud regardless of entitlement. Balanced prefers device/local and falls back to entitled cloud. Quality may prefer entitled cloud and falls back locally. Developer keeps Ollama/custom tools and receives no implicit Gear X-hosted cloud grant.
- A subscription screen shows plan state, consumer-readable remaining allowances, local fallback state, and restore/upgrade/manage actions without provider or token terminology.

## Technical requirements
- Entitlement checks and atomic usage reservations occur before provider invocation and re-resolve plan state inside Postgres.
- Transcription usage records duration, request count, capability, provider, timestamp, and non-content status; intelligence records provider-reported input/output tokens when available and conservative reservations otherwise.
- Usage rows never contain audio, transcript, prompt, response, receipt, or raw provider error content.
- Global cloud control includes a kill switch plus configurable daily/monthly provider-cost ceilings. Cost rates and ceilings are server configuration, not mobile logic.
- Capability disablement, plan allowances, model class, and limits can change server-side without an app release.
- Webhook events require a configured authorization secret, are idempotent, tolerate out-of-order timestamps, and map only configured store products to internal plan IDs.
- The client entitlement snapshot is display/routing guidance only; backend enforcement remains authoritative.

## Failure states
No subscription, disabled capability, future/expired plan, cancellation period ended, billing retry without grace, refund/revocation, unknown product, invalid/replayed/older webhook, restore pending synchronization, missing billing SDK/configuration, offline store, quota exhausted, global kill switch, daily/monthly cost ceiling, provider timeout/failure, and malformed provider usage/output.

## Privacy implications
Billing records contain Supabase user ID, RevenueCat customer/product/event identifiers, lifecycle dates, environment, and entitlement metadata—not local knowledge. RevenueCat and stores process purchase identity under their policies. Remote content still requires separate persisted consent after entitlement succeeds. Local data is never deleted or uploaded due to billing changes.

## Acceptance criteria
- Baseline, spoofed, expired, revoked, and non-capability users cannot reach a cloud provider.
- Active/grace/cancelled-before-expiry users receive only configured capabilities and limits.
- Restore/renewal/upgrade/downgrade fixtures update server state; duplicate/older webhooks do not regress it.
- Duration/request/token accounting and global cost limits are atomic under concurrent database reservations.
- Private never calls cloud; Balanced/Quality fall back locally; Developer/Ollama never grants hosted-cloud access.
- Consumer UI exposes plan, allowance, fallback, restore, upgrade, and management states without infrastructure language.
- Store/provider secrets are absent from the client and generated bundles.

## Dependencies
Supabase Auth/Postgres/Edge Functions, RevenueCat iOS/Android SDK and verified webhooks, Apple App Store Connect, Google Play Console, existing provider routers, consent settings, local deterministic agents, and SQLite.

## Open implementation decisions
Free/Pro/Max names, $0/$9.99/$19.99 monthly prices, monthly product IDs, RevenueCat entitlement/package IDs, transcription and intelligence allowances, per-user spend ceilings, and capability model classes are approved in `specs/launch-plans-pricing.md`. Remaining decisions are production global budgets, provider enablement, store grace/territory/tax configuration, mobile CAPTCHA or attestation UX, later account linking, and future annual products.

## Verification
Run domain lifecycle tests, backend route/entitlement/metering/webhook/security tests, mobile billing/provider/fallback/UI tests, `npm run validate`, Expo Doctor, Android bundle export, and secret scans. Live purchase, restore, webhook, App Store, Play Billing, Supabase, and provider checks remain external until projects, products, credentials, signed builds, and sandbox accounts exist.

## Rollback implications
Use the global kill switch or remove cloud public URLs to disable hosted processing while preserving all local behavior. Roll back the function before entitlement migrations. Never drop billing/usage history until store reconciliation, refund, tax, support, and retention obligations are satisfied.

## Gap analysis at implementation start
- Local-first core, capability routing, Developer-only Ollama, consent, local retrieval, local SQLite durability, native speech, and future provider interfaces were already aligned.
- Missing: subscription authority, capability-specific entitlements, billing lifecycle/store abstraction, restore/identity mapping, duration/token metering, global provider budgets/kill switch, entitlement-aware status UI, and tests against client spoofing and billing lifecycle.
- Drift: every authenticated backend user could consume xAI and quotas were generic request counts supplied from environment configuration rather than a resolved commercial entitlement.
