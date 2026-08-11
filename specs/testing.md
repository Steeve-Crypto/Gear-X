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
Cover Router, agents, parsing, ranking, validation, repositories, migrations, state selectors, privacy consent, destructive confirmation, session pipeline, Orbit start/stop wiring, deletion, versioned export, loop resolution/missing-source behavior, and primary UI states.
## Technical requirements
Deterministic clocks/IDs/providers; isolated SQL.js databases; Jest Expo native mocks; synthetic fixtures; no network in unit tests; validation runs typecheck, Node tests, React Native tests, and lint.
## Failure states
Flaky timing, leaked database state, network-dependent unit tests, and skipped critical privacy tests block release.
## Privacy implications
Fixtures contain synthetic text only and test logs must not contain user data.
## Acceptance criteria
All automated checks pass; manual matrix reports actual status; failures identify the responsible layer.
## Dependencies
All implementation specs.
## Open implementation decisions
Maestro versus Detox remains the decision for the physical-device matrix; Jest Expo and React Native Testing Library cover the current component layer.
## Verification method
`npm run validate` and documented device runs.
