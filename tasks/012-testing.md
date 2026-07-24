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
In progress: deterministic domain tests pass; SQLite and native UI/device suites remain.
