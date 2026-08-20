# Gear X Handoff

## Current state

Gear X is implemented for every repository-local requirement that can be verified on this Windows machine. The app uses Expo SDK 57.0.15, React Native 0.86.2, Expo Router, `expo-audio`, the native speech bridge, SQLite repositories, eight agents plus Router orchestration, privacy-gated provider routing, and the real-time 3D celestial gear body. Session details, diagnostics, privacy/export/delete controls, open loops, and critical UI flows have automated coverage.

The production backend is implemented but not deployed. It uses Supabase anonymous Auth, Expo SecureStore, one Edge Function, server-authoritative Free/Pro/Max capabilities, RevenueCat webhook synchronization, verified billing-period resets, metadata-only Postgres metering, and optional server-only providers. Approved economics are Free $0 with 30 cloud minutes, Pro $9.99/month with 10 hours, and Max $19.99/month with 30 hours and three times Pro intelligence capacity. xAI remains undeployed and unnecessary for local Gear X. Supabase CLI authentication exists on this machine, but there is no dedicated GearX project.

The review server runs at `http://127.0.0.1:8088/orbit`. Runtime logs live under ignored `.runtime/` and must not be committed.

## Verified locally

- `npm run validate`: type checking, 19 domain/SQLite/static tests, 56 Jest tests, and lint pass.
- `npm run test:backend`: 27 backend auth/consent/plan/mapping/lifecycle/HMAC/period/metering/budget/security tests pass.
- `npx expo-doctor`: 21/21 checks pass.
- `npx expo install --check`: dependencies are compatible.
- Web `/orbit`: visible Orbit heading, 3D gear body, Start listening control, and no browser warning/error logs.
- Android production export: 1,767 modules and a 7,893,991-byte Hermes bundle; provider/store/service-secret and operational-budget marker scan is clean.
- Production dependency audit: 17 upstream toolchain advisories remain (8 high, 9 moderate, 0 critical). npm proposes an incompatible Expo 53 downgrade; do not force it.

## External release gates

1. Sign in to Expo/EAS and link the project, then run the existing Android, iOS device, and iOS Simulator build profiles.
2. Supply Apple Developer credentials and register a physical iOS device; use macOS/Xcode for simulator/device installation.
3. Create the exact Apple/Google monthly products, prices, subscription group/base plans, territories, tax, and grace settings documented in `docs/BILLING_CONFIGURATION.md`.
4. Create RevenueCat entitlements `gearx_pro`/`gearx_max`, offering `default`, packages `pro_monthly`/`max_monthly`, Customer Center, authorization, and HMAC webhook; add its public SDK keys to EAS.
5. Create a dedicated GearX Supabase project, set anonymous Auth to 3 signups/hour/IP or lower after load testing, apply migrations, set RevenueCat secrets, and deploy with global cloud disabled. Follow `docs/BACKEND_DEPLOYMENT.md`.
6. Run signed Apple sandbox and Google license-test purchase/restore/immediate-upgrade/deferred-downgrade/cancel/grace/expiry/refund/transfer checks. Then review production global budgets and concrete provider models. Do not enable xAI without separate authorization.
7. Exercise recording, recorded-file speech recognition, interruption/recovery, retention cleanup, offline/local fallback, and the 3D GPU path on representative physical Android and iOS devices.
8. Prepare store metadata, privacy disclosures, screenshots, signing credentials, and submission records.
9. Monitor upstream Expo/React Native/Metro advisory fixes and upgrade only to an Expo-compatible set that passes Doctor and validation.
10. Evaluate SQLCipher or another supported at-rest encryption design before making any encryption claim.

## Next-owner workflow

Read `AGENTS.md`, `RELEASE_STATUS.md`, and `specs/release-readiness.md` first. Keep commits under five words, update specs/tasks with behavior, run focused tests after each milestone, and run `npm run validate` before handoff. Never mark physical-device, backend, EAS, store, encryption, or audit gates complete without direct evidence.
