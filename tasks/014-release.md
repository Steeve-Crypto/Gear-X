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
In progress: lockfile-clean install, automated validation, SDK compatibility, Expo config, rendered Metro web preview with SQLite WASM and hardware WebGL support, HTTP-200 offline Metro launch, and Android Hermes exports pass. The real 3D gear build bundles 1,248 modules into 6.25 MB. The dependency audit must be refreshed after the 3D dependency addition; physical Android/iOS capture/GPU checks and the coordinated SDK upgrade remain release blockers.
