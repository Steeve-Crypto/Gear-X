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

Current status: validation passes on Expo SDK 57.0.15 with React Native 0.86.2: 19 domain/SQLite/static tests, 56 Jest UI/provider/auth/billing/runtime/pipeline tests, lint, dependency compatibility, and all 21 Expo Doctor checks pass. Twenty-seven backend tests pass for authentication, consent, Free/Pro/Max economics, cross-store mapping, lifecycle/pending downgrade, webhook HMAC/replay protection, billing-period duration/input/output/cost metering, budgets/rates, spoofing, and secret exposure. Android production export produces a 7,893,991-byte Hermes bundle from 1,767 modules with a clean provider/store/service-secret/operational-budget marker scan. The production dependency audit remains 17 upstream Expo/Metro advisories (8 high, 9 moderate, 0 critical); npm proposes an incompatible Expo 53 downgrade. The backend is not deployed; store products, RevenueCat production configuration, dedicated Supabase, signed purchase tests, global production budgets, and concrete provider enablement remain external. No live purchase, webhook, provider, EAS build, or physical-device result is claimed.
