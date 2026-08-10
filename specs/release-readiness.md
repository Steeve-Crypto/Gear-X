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

Current status: validation passes with 19 domain/SQLite/static tests and 32 Jest UI/provider/runtime/pipeline tests. The incremental upgrade through Expo SDK 56 passes Expo Doctor, dependency compatibility, public config/native speech plugin resolution, and the full validation suite; recording uses maintained `expo-audio`, the splash screen uses its config plugin, and Expo Router has no conflicting direct React Navigation dependency. Upgrading through the current SDK and repeating the audit remain open. `expo-dev-client` and explicit Android, iOS device, and iOS Simulator profiles are configured. EAS submission is blocked because this machine is not signed into an Expo account and the app is not linked to an EAS project. Physical iOS installation additionally requires Apple Developer membership and device registration; Simulator installation requires macOS/Xcode. Native recorded-file transcription, capture, and GPU behavior still require physical Android/iOS verification; a production backend/auth boundary is not deployed. No device verification has been claimed.
