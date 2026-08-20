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
In progress. See `RELEASE_STATUS.md`. Expo SDK 57.0.15 compatibility, 19 domain tests, 56 Jest tests, 27 backend tests, lint, Doctor 21/21, dependency check, Android export/secret scan, approved Free/Pro/Max economics, subscription UI, RevenueCat/server authority, billing-period metering, and global controls are complete locally. App Store/Play products, RevenueCat and Supabase production configuration, signed purchase/webhook/provider verification, EAS linkage, physical Android/iOS checks, unresolved upstream advisories, and store submission remain external gates.
