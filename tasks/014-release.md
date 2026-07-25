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
In progress: lockfile-clean install, 33-test validation, SDK compatibility, Expo config, and a 1,338-module Android Hermes export pass. The 2026-07-25 production audit completed with 31 transitive findings (29 high, 2 moderate) whose offered fixes require an Expo/React Native major upgrade. Physical Android/iOS checks and that coordinated upgrade remain release blockers.
