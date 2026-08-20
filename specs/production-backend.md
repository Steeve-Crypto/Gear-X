# Production Backend

## Purpose
Provide the smallest secure cloud boundary for consented Gear X transcription and knowledge intelligence without moving the local-first vault or provider credentials into the mobile client.

## Scope
Supabase anonymous authentication, one Supabase Edge Function, xAI speech-to-text and structured text inference, server-authoritative usage controls, normalized errors, metadata-only usage persistence, deployment configuration, and mobile session refresh.

## Non-goals
Cloud vault storage, uploading a complete vault, paid subscription logic, Ollama proxying, account recovery, social login, background jobs, analytics, or replacing local deterministic agents.

## User stories
- I can opt into remote processing and use cloud transcription or intelligence without a provider key on my phone.
- I receive a readable error when authentication expires, consent is absent, a quota is exhausted, or a provider is unavailable.
- I can begin with a private anonymous account and retain a path to link a permanent identity later.
- I can continue using local Gear X behavior when the production backend is unavailable.

## Functional requirements
- The app creates a Supabase anonymous user, keeps refresh material in the platform secure store, refreshes expiring sessions, and sends the user JWT to the Gear X function.
- Every sensitive endpoint validates the Supabase JWT and derives the usage owner from its `sub`; no client user identifier is trusted.
- Transcription accepts multipart audio only, validates MIME type and size, bounds provider execution time, and returns the existing `TranscriptionResult` shape.
- Intelligence accepts only one supported capability plus bounded system/prompt context and returns a non-empty validated text result compatible with existing agent schemas.
- Cloud endpoints require the persisted mobile consent gate and an explicit `X-Gear-X-Remote-Consent: granted` request assertion.
- Atomic database accounting enforces configurable per-user daily transcription/intelligence quotas and a rolling per-minute request limit before provider work begins.
- Errors use stable codes: `UNAUTHORIZED`, `CONSENT_REQUIRED`, `QUOTA_EXCEEDED`, `INVALID_REQUEST`, `PAYLOAD_TOO_LARGE`, `PROVIDER_UNAVAILABLE`, `PROVIDER_TIMEOUT`, `MALFORMED_PROVIDER_OUTPUT`, and `INTERNAL_ERROR`.

## Technical requirements
- Supabase Auth supplies short-lived access tokens and refresh tokens; anonymous sign-ins must be enabled with CAPTCHA/abuse controls configured before production exposure.
- The Edge Function performs explicit JWT verification with Supabase Auth before handling every route, including health, so authentication failures retain the stable Gear X error shape.
- Server secrets contain `XAI_API_KEY`; the Expo public configuration contains only the function URL, Supabase URL, and Supabase publishable key.
- `XAI_CHAT_MODEL`, request limits, timeouts, and maximum payload sizes are server configuration, not product pricing logic.
- Usage rows contain user ID, operation, capability, byte count, status, and timestamps only. They never contain audio, transcript, prompts, responses, tokens, or provider errors.
- The backend does not persist user content. Request bodies live only for the request lifetime and provider retention is governed by the configured provider account.
- Logs contain request IDs, route, status, latency, and normalized error code only.

## Failure states
Missing/expired/invalid authentication, anonymous sign-up disabled, missing consent, malformed JSON or multipart data, unsupported MIME, oversized audio or context, quota or rate exhaustion, provider timeout, provider rejection, malformed provider output, database accounting failure, and network loss.

## Privacy implications
Private mode makes no backend call. Balanced and Quality calls transmit only the selected audio or task-scoped context after consent. Supabase retains authentication records until the user is deleted; a Postgres cron job deletes metadata-only usage rows after 35 days. xAI processes request content transiently according to the production xAI account settings; Gear X does not store provider content.

## Acceptance criteria
- Unauthenticated protected requests return structured `UNAUTHORIZED` errors.
- Authenticated requests cannot change the accounting identity with request content.
- Consent denial occurs before usage reservation or provider transmission.
- Valid audio and intelligence requests match existing mobile contracts.
- Invalid audio, oversized audio/context, quota exhaustion, rate limiting, timeout, provider failure, and malformed output are covered by backend tests.
- Secret scans show no provider or service-role credential in Expo configuration, mobile source, logs, or committed files.
- Deployment and live-provider status are documented truthfully.

## Dependencies
Supabase Auth, Postgres, Edge Functions, platform secure storage, xAI APIs, existing transcription/inference adapters, provider routing, privacy settings, and release configuration.

## Open implementation decisions
Production Supabase project/region, CAPTCHA provider and thresholds, permanent account-linking UX, paid entitlement source, operational alerting destination, provider data-processing settings, and whether future attestation is required beyond authenticated anonymous users and rate limits.

## Verification
Run `npm run test:backend`, mobile provider tests, secret/config scans, `npm run validate`, and Expo Doctor. After project credentials exist, apply migrations, set function secrets, deploy with JWT verification, enable protected anonymous sign-in, and exercise authenticated session, transcription, intelligence, malformed input, quota, timeout/failure, and bundle-secret checks against the real URL. Never mark deployment or live provider verification complete from local mocks.

## Rollback implications
Remove the production public backend variables to return clients to local-only behavior. Do not drop usage tables while deployed function versions depend on them; roll back the function first. Anonymous Auth users and metadata rows require an explicit retention/deletion decision before project removal.
