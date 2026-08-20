# 014 Release
## Objective
Verify and document a production-beta candidate.
## Files involved
README, docs, env example, app config, release readiness.
## Required changes
Setup, architecture, privacy, troubleshooting, clean install, validation, Expo/device checks.
## Constraints
Do not call the app production-ready without device evidence.
## Acceptance criteria
All automated gates pass and remaining limitations/steps are exact.
## Tests
Clean install, validate, Expo launch, route/storage/provider/privacy/device matrix.
## Rollback considerations
Release tags only after all blocking gates pass.
## Completion status
In progress. See `RELEASE_STATUS.md`. Automated AI runtime validation, the Expo SDK 57 upgrade, dependency compatibility, native plugin config, development-client dependency, audit evidence, and explicit Android/iOS device/iOS Simulator profiles are complete. The Supabase backend, anonymous mobile authentication, secure token storage, consent assertion, xAI adapters, atomic quotas, and focused local tests are implemented. Supabase deployment/live-provider verification, EAS login/project linkage, Apple signing/device registration, physical Android/iOS checks, unresolved upstream advisories, and store metadata/credentials remain tracked separately.
