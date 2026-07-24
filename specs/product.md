# Product Specification

## Purpose
Define Gear X as the machine that remembers, connects, questions, and evolves with its user.
## Scope
Onboarding, voice capture, sessions, Orbit, Vault, Threads, Open Loops, Ask, summaries, settings, diagnostics, export, and deletion.
## Non-goals
Team workspaces, automatic calendar/task creation, background surveillance, and unsupported general-purpose answers.
## User stories
- I can capture a listening session and later inspect its transcript-derived knowledge.
- I can ask my vault a question and see supporting evidence.
- I can resolve unfinished decisions and export or delete my data.
## Functional requirements
All primary areas are navigable; sessions and knowledge persist; questions link to sources; providers and remote status are explicit.
## Technical requirements
Features use domain services and repositories; lists paginate; actions expose loading, empty, offline, and error states.
## Failure states
Permission denial, interruption, provider outage, migration failure, missing evidence, and deletion failure are recoverable and visible.
## Privacy implications
Onboarding accurately explains storage and remote processing. Local-first defaults apply.
## Acceptance criteria
Critical flows work without simulated speech; no placeholder routes; evidence backs answers; delete/export are available.
## Dependencies
All feature specs, data model, providers, privacy, UX.
## Open implementation decisions
Background capture and native offline STT require development builds and device research.
## Verification method
Automated flows plus Android and iOS manual-device checklist.
