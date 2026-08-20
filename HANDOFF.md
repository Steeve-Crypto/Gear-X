# Gear X Handoff

## Current state

Gear X is implemented for every repository-local requirement that can be verified on this Windows machine. The app uses Expo SDK 57.0.15, React Native 0.86.2, Expo Router, `expo-audio`, the native speech bridge, SQLite repositories, eight agents plus Router orchestration, privacy-gated provider routing, and the real-time 3D celestial gear body. Session details, diagnostics, privacy/export/delete controls, open loops, and critical UI flows have automated coverage.

The production backend is implemented but not deployed. It uses Supabase anonymous Auth, Expo SecureStore, one Edge Function, server-authoritative subscription capabilities, RevenueCat webhook synchronization, metadata-only Postgres metering, and optional server-only providers. Baseline users cannot reach hosted AI, and xAI remains undeployed and unnecessary for local Gear X. Supabase CLI authentication exists on this machine, but there is no dedicated GearX project. Existing unrelated projects were deliberately not reused.

The review server runs at `http://127.0.0.1:8088/orbit`. Runtime logs live under ignored `.runtime/` and must not be committed.

## Verified locally

- `npm run validate`: type checking, 19 domain/SQLite/static tests, 50 Jest tests, and lint pass.
- `npm run test:backend`: 23 backend auth/consent/entitlement/lifecycle/HMAC/metering/budget/security tests pass.
- `npx expo-doctor`: 21/21 checks pass.
- `npx expo install --check`: dependencies are compatible.
- Web `/orbit`: visible Orbit heading, 3D gear body, Start listening control, and no browser warning/error logs.
- Android production export: 1,766 modules and a 7.9 MB Hermes bundle; provider/store/service-secret marker scan is clean.
- Production dependency audit: 17 upstream toolchain advisories remain (8 high, 9 moderate, 0 critical). npm proposes an incompatible Expo 53 downgrade; do not force it.

## External release gates

1. Sign in to Expo/EAS and link the project, then run the existing Android, iOS device, and iOS Simulator build profiles.
2. Supply Apple Developer credentials and register a physical iOS device; use macOS/Xcode for simulator/device installation.
3. Approve internal plans, allowances, provider-cost estimates, daily/monthly budgets, store product IDs, billing periods, prices, territories, and grace policy—none are hardcoded.
4. Create Apple and Google subscription products plus a RevenueCat project/offering. Enable webhook authorization and HMAC signing, then follow `docs/BILLING_CONFIGURATION.md` for product mapping and public SDK keys.
5. Create a dedicated GearX Supabase project, enable anonymous Auth without raising its IP rate limit, apply migrations, set RevenueCat webhook secrets, and deploy the function with cloud globally disabled. Follow `docs/BACKEND_DEPLOYMENT.md`.
6. Run signed Apple sandbox and Google license-test purchase/restore/cancel/grace/expiry/refund/transfer checks. Only after those gates pass, select/configure a cloud provider, set reviewed costs/budgets, and enable `gear_x_cloud_control`; do not deploy xAI merely to complete setup.
7. Exercise recording, recorded-file speech recognition, interruption/recovery, retention cleanup, offline/local fallback, and the 3D GPU path on representative physical Android and iOS devices.
8. Prepare store metadata, privacy disclosures, screenshots, signing credentials, and submission records.
9. Monitor upstream Expo/React Native/Metro advisory fixes and upgrade only to an Expo-compatible set that passes Doctor and validation.
10. Evaluate SQLCipher or another supported at-rest encryption design before making any encryption claim.

## Next-owner workflow

Read `AGENTS.md`, `RELEASE_STATUS.md`, and `specs/release-readiness.md` first. Keep commits under five words, update specs/tasks with behavior, run focused tests after each milestone, and run `npm run validate` before handoff. Never mark physical-device, backend, EAS, store, encryption, or audit gates complete without direct evidence.
