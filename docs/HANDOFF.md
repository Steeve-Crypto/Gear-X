# Continuation Handoff

## Current state

Gear X remains local-first with eight agents, Router orchestration, SQLite FTS5, native speech, Developer-only Ollama, and the 3D celestial gear body. Expo SDK 57.0.15 and React Native 0.86.2 are installed as a compatible release set.

The production backend is implemented locally with approved Free/Pro/Max plans, exact store/RevenueCat mappings, verified billing-period resets, pending downgrade state, consent assertions, separate input/output and duration metering, $0.25/$3/$7 per-user cost ceilings, global controls, and optional server-only providers. It is not deployed; xAI remains unconfigured and no live billing/provider call is claimed.

## Verified locally

- `npm run validate`: typecheck, 19 domain tests, 56 Jest tests, and lint pass.
- `npm run test:backend`: 27 tests pass.
- Expo Doctor: 21/21 checks pass.
- Android export: 1,767 modules and a 7,893,991-byte Hermes bundle.
- Bundle/repository scans contain no provider key or Supabase service-secret value.
- Production audit: 17 upstream Expo/Metro advisories remain (8 high, 9 moderate, 0 critical); npm proposes an incompatible Expo 53 downgrade.

## Exact next step

Create the exact Apple/Google products and RevenueCat entitlements/offering/packages in `docs/BILLING_CONFIGURATION.md`, including authorization plus HMAC webhook signing. Create a dedicated Supabase project, apply migrations, deploy with cloud disabled, add public backend/Supabase/RevenueCat build identifiers, and run signed purchase/restore/upgrade/deferred-downgrade lifecycle checks. Review production global budgets and concrete provider models only after those checks; xAI remains separately gated.

Do not reuse unrelated Supabase projects. Do not mark backend deployment, store billing, webhook synchronization, live transcription/intelligence, physical-device behavior, signed builds, store review, SQLite encryption, or remaining advisory remediation complete without direct evidence.
