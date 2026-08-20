# Release Readiness

## Purpose
Track objective beta release gates and limitations.
## Scope
Builds, checks, routes, data, privacy, providers, performance, diagnostics, documentation, and devices.
## Non-goals
Declaring production-ready based on simulator-only validation.
## User stories
- Release owners can distinguish automated success from outstanding device work.
## Functional requirements
Clean install, typecheck, lint, tests, Expo launch, route smoke, persistence restart, consent, deletion/export, unreachable-provider behavior, and secret scan.
## Technical requirements
No broken imports/routes, unresolved migrations, committed secrets, or production simulated transcripts. Native verification uses explicit EAS profiles for an internal Android APK, an ad hoc iOS device build, and an iOS Simulator development build.
## Failure states
Any critical data-loss, consent bypass, crash, migration failure, or inaccessible primary action blocks release.
## Privacy implications
Store disclosures match actual plaintext local storage and optional remote behavior.
## Acceptance criteria
Automated gates pass and Android physical plus iOS simulator/device matrix is completed before beta distribution.
## Dependencies
Testing, privacy, product, all tasks.
## Open implementation decisions
EAS account/project linkage and Android signing credentials, store metadata, production backend/authentication, optional offline speech pack, and crash reporting with redaction.
## Verification method
Release checklist with command output and device evidence.

Current status: validation passes on Expo SDK 57.0.15 with React Native 0.86.2: 19 domain/SQLite/static tests, 50 Jest UI/provider/auth/billing/runtime/pipeline tests, lint, and all 21 Expo Doctor checks pass. Twenty-three backend tests pass for authentication, consent, entitlement/lifecycle enforcement, webhook HMAC/replay protection, duration/token metering, budget/rate limits, and secret exposure. Android production export produces a 7.9 MB Hermes bundle from 1,766 modules with a clean provider/store/service-secret marker scan. The production dependency audit reports 17 upstream Expo/Metro toolchain advisories (8 high, 9 moderate, 0 critical); npm proposes an incompatible Expo 53 downgrade. The subscription-aware backend is implemented locally but is not deployed; RevenueCat/store products, plan economics, a dedicated Supabase project, and any optional provider remain unconfigured. No live purchase, webhook, provider, EAS build, or physical-device result is claimed. Apple/Google credentials, store metadata, device verification, and application-level SQLite encryption remain external or future gates.
