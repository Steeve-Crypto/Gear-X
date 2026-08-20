# Continuation Handoff

## Current state

Gear X remains local-first with eight agents, Router orchestration, SQLite FTS5, native speech, Developer-only Ollama, and the 3D celestial gear body. Expo SDK 57.0.15 and React Native 0.86.2 are installed as a compatible release set.

The production backend is implemented locally with Supabase anonymous Auth, Expo SecureStore session refresh, server-authoritative subscription capabilities, RevenueCat lifecycle synchronization, consent assertions, atomic duration/token/rate/cost controls, metadata-only accounting, structured errors, and optional server-only provider adapters. It is not deployed; xAI remains unconfigured and no live billing/provider call is claimed.

## Verified locally

- `npm run validate`: typecheck, 19 domain tests, 50 Jest tests, and lint pass.
- `npm run test:backend`: 23 tests pass.
- Expo Doctor: 21/21 checks pass.
- Android export: 1,766 modules and a 7.9 MB Hermes bundle.
- Bundle/repository scans contain no provider key or Supabase service-secret value.
- Production audit: 17 upstream Expo/Metro advisories remain (8 high, 9 moderate, 0 critical); npm proposes an incompatible Expo 53 downgrade.

## Exact next step

First approve plans, allowances, provider cost budgets, Apple/Google products, prices, territories, and grace policy. Then create the store products and RevenueCat project/offering, configure authorization plus HMAC webhooks, and follow `docs/BILLING_CONFIGURATION.md`. Create a dedicated Supabase project, apply migrations, deploy with cloud disabled, add public backend/Supabase/RevenueCat build identifiers, and run signed-store lifecycle checks. Select/configure a provider and enable reviewed cloud budgets only after those checks; xAI is not a prerequisite.

Do not reuse unrelated Supabase projects. Do not mark backend deployment, store billing, webhook synchronization, live transcription/intelligence, physical-device behavior, signed builds, store review, SQLite encryption, or remaining advisory remediation complete without direct evidence.
