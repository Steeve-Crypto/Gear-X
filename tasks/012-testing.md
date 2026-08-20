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
Complete for automated scope: 19 Node domain/SQLite/static tests and 56 Jest React Native/provider/auth/billing/runtime/pipeline tests are invoked by validation, including capability selection, recording, native speech, fallback, consent, anonymous sessions, privacy, launch-plan rendering, purchase/restore, and cross-mode cloud denial. Twenty-seven backend tests cover authenticated routing, Free/Pro/Max mappings and economics, verified billing periods, pending downgrades, duration/input/output/cost metering, HMAC lifecycle events, quotas/budgets/rates, spoofing, and secret exposure. Live stores/providers and physical devices remain release gates in task 014.
