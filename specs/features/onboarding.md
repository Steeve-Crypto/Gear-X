# Onboarding
## Purpose
Set accurate expectations before sensitive capture.
## Scope
Product, listening, storage, remote behavior, microphone, deletion, and local/paid differences.
## Non-goals
Marketing claims not supported by implementation.
## User stories
I understand what happens before granting access.
## Functional requirements
Progressive pages, accessible controls, explicit acknowledgment, settings link, and resumable completion.
## Technical requirements
Persist completion separately from microphone and remote consent.
## Failure states
Interrupted onboarding or denied permission does not lock the app.
## Privacy implications
State clearly that local SQLite is not application-level encrypted.
## Acceptance criteria
First launch routes to onboarding; completion persists; permission is contextual.
## Dependencies
Settings and privacy specs.
## Open implementation decisions
Localized disclosure copy.
## Verification method
First-launch and accessibility UI tests.
