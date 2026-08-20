# Gear X Backend Deployment

## Preconditions

- A dedicated Supabase project named GearX. Do not reuse another product's database.
- Anonymous sign-ins enabled in Supabase Auth.
- Supabase's anonymous-signup IP rate limit retained at 30/hour or lower. Do not raise it for launch.
- An xAI production API key with access to chat completions and batch speech-to-text.
- The production web origin, if web access is enabled. Native apps do not require an origin allow-list entry.

## Deploy

Use the current Supabase CLI and replace only the bracketed project reference:

```powershell
npx supabase login
npx supabase link --project-ref <GEAR_X_PROJECT_REF>
npx supabase db push
npx supabase functions deploy gear-x --project-ref <GEAR_X_PROJECT_REF> --no-verify-jwt --use-api
```

`--no-verify-jwt` is intentional: the function verifies every bearer token with Supabase Auth itself so it can return the stable Gear X error contract. There are no public function routes.

Set these in Supabase Dashboard → Edge Functions → Secrets. Never put them in an Expo environment:

```text
XAI_API_KEY=<production xAI key>
XAI_CHAT_MODEL=grok-4.5
GEAR_X_ALLOWED_ORIGINS=https://<production-web-origin>
GEAR_X_TRANSCRIPTION_DAILY_LIMIT=20
GEAR_X_INTELLIGENCE_DAILY_LIMIT=50
GEAR_X_REQUESTS_PER_MINUTE=10
GEAR_X_MAX_AUDIO_BYTES=10485760
GEAR_X_MAX_AUDIO_DURATION_MS=900000
GEAR_X_MAX_GENERATE_BYTES=24000
GEAR_X_PROVIDER_TIMEOUT_MS=25000
```

The Supabase URL, publishable key, and function URL are intentionally public routing/auth-bootstrap values. Configure the Expo production environment with:

```text
EXPO_PUBLIC_GEAR_X_BACKEND_URL=https://<GEAR_X_PROJECT_REF>.supabase.co/functions/v1/gear-x
EXPO_PUBLIC_GEAR_X_SUPABASE_URL=https://<GEAR_X_PROJECT_REF>.supabase.co
EXPO_PUBLIC_GEAR_X_SUPABASE_PUBLISHABLE_KEY=<Supabase publishable key>
```

## Authentication and abuse controls

In Supabase Dashboard:

1. Open Authentication → Sign In / Providers and enable Anonymous Sign-Ins.
2. Keep the anonymous Auth sign-up IP rate limit at 30/hour or lower. The backend additionally enforces an atomic per-user rolling-minute limit and separate daily operation quotas.
3. Do not enable CAPTCHA until the mobile app has a challenge/token UX; enabling it now would intentionally block anonymous signup. Add that UX before increasing exposure or signup limits.
4. Do not grant `anon` or `authenticated` access to `gear_x_backend_usage`. The migration enables RLS and grants the reservation function only to `service_role`.

Anonymous users receive the `authenticated` role and can later be linked to a permanent account. Their refresh token is stored with Expo SecureStore. Backend identity always comes from the verified JWT, never a submitted user ID.

## Live verification

Use a real development/production mobile build after configuring the public variables. Do not paste access tokens, audio, transcripts, prompts, or provider responses into logs.

Verify in this order:

1. Confirm `GET /health` without a bearer token returns `401` and `UNAUTHORIZED`.
2. Complete anonymous sign-in and confirm `POST /v1/mobile/session` returns the validated short-lived token.
3. Confirm the authenticated health request returns `{ "status": "ok" }`.
4. Upload a short consented M4A recording and confirm a real xAI transcription returns the existing mobile segment shape.
5. Run Extractor, Summarizer, Questioner, and Retriever synthesis with task-scoped context and confirm schema validation.
6. Remove the consent assertion and confirm `CONSENT_REQUIRED` occurs before a usage row is reserved.
7. Temporarily lower limits, verify quota and rolling-minute rejection, then restore production limits.
8. Submit invalid MIME, duration, JSON, and oversized requests and verify structured errors.
9. Temporarily use an invalid model/key in a controlled window to verify redacted provider failure, then restore it.
10. Export the production bundle and scan it for `XAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `sb_secret_`, and the real provider key. Only the publishable key and URLs may appear.

## Retention and rollback

The backend never stores request content. The `gear-x-usage-retention` Postgres cron job deletes metadata-only usage rows after 35 days and deletes inactive anonymous identities older than 35 days when they have no usage in that window. Active Auth users remain until account deletion. xAI audio/content retention follows the production provider-account settings; confirm those settings before launch.

To disable cloud processing without changing local behavior, remove the three `EXPO_PUBLIC_GEAR_X_*` values from the production build environment. Roll back the Edge Function before dropping database functions/tables. Do not delete the Supabase project until Auth-user and usage-metadata deletion obligations are satisfied.
