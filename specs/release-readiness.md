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
No broken imports/routes, unresolved migrations, committed secrets, or production simulated transcripts.
## Failure states
Any critical data-loss, consent bypass, crash, migration failure, or inaccessible primary action blocks release.
## Privacy implications
Store disclosures match actual plaintext local storage and optional remote behavior.
## Acceptance criteria
Automated gates pass and Android physical plus iOS simulator/device matrix is completed before beta distribution.
## Dependencies
Testing, privacy, product, all tasks.
## Open implementation decisions
EAS project credentials, store metadata, native transcription module, crash reporting with redaction.
## Verification method
Release checklist with command output and device evidence.

Current status: lockfile-clean validation passes with 18 domain/SQLite/static tests and 15 Jest UI/provider/runtime/pipeline tests. Expo SDK dependency compatibility, public config, a rendered Metro web preview with SQLite WASM support, an HTTP-200 offline Metro launch, and a 1,338-module Android Metro/Hermes export pass. The production audit reports 31 findings (29 high, 2 moderate) in the Expo 53/React Native 0.79 toolchain; npm offers only coordinated major-version fixes. Physical Android/iOS verification, the SDK upgrade, and native transcription selection remain open. No device verification has been claimed.
