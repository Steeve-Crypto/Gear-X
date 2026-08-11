# 012 Testing
## Objective
Create meaningful unit, integration, and UI regression coverage.
## Files involved
`tests`, test configuration, fixtures, package scripts.
## Required changes
Cover critical agent, provider, database, privacy, pipeline, and screen flows.
## Constraints
Synthetic fixtures only; no fake pass claims.
## Acceptance criteria
Automated suite is deterministic and validation invokes it.
## Tests
This task owns the full suite and manual matrix.
## Rollback considerations
Test tooling must not affect production bundles.
## Completion status
Complete for automated scope: 19 Node domain/SQLite/static tests and 39 Jest React Native/provider/runtime/pipeline tests are invoked by validation, including capability selection, audio recorder lifecycle, Orbit start/stop wiring, native speech events, fallback, timeout, consent, malformed output, actual multipart upload, session detail states, privacy confirmation/export, loop resolution, legacy mode migration, and cloud budget behavior. The physical-device matrix remains a release gate in task 014.
