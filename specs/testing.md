# Testing Specification

## Purpose
Define evidence required for production-beta confidence.
## Scope
Unit, integration, UI, static validation, performance, and manual device verification.
## Non-goals
Fake snapshots, mocked tests that assert nothing, or claims about unrun platforms.
## User stories
- Maintainers can change routing, persistence, or privacy with fast regression feedback.
- Release owners can see exactly what remains device-dependent.
## Functional requirements
Cover Router, agents, parsing, ranking, validation, repositories, migrations, state selectors, privacy, session pipeline, deletion, export, and primary UI states.
## Technical requirements
Deterministic clocks/IDs/providers; isolated databases; no network in unit tests; validation runs typecheck, tests, and lint.
## Failure states
Flaky timing, leaked database state, network-dependent unit tests, and skipped critical privacy tests block release.
## Privacy implications
Fixtures contain synthetic text only and test logs must not contain user data.
## Acceptance criteria
All automated checks pass; manual matrix reports actual status; failures identify the responsible layer.
## Dependencies
All implementation specs.
## Open implementation decisions
Maestro versus Detox for native end-to-end automation.
## Verification method
`npm run validate` and documented device runs.
