# Settings
## Purpose
Give users control over appearance, providers, automation, retention, privacy, and diagnostics.
## Scope
All requested preferences, connectivity/health tests, export/delete, version, and diagnostics.
## Non-goals
Storing provider API secrets in the app.
## User stories
I can choose local mode, reduce motion, test Ollama, and manage my data.
## Functional requirements
Persist preferences; consent confirmation; retention; endpoint/model; provider selection; health and destructive controls.
## Technical requirements
Settings repository with validated keys and typed values; provider tests have timeouts.
## Failure states
Invalid endpoint, unreachable model, failed persistence/export/delete.
## Privacy implications
Plain-language local storage/encryption limitation and remote disclosures are required.
## Acceptance criteria
Changes survive restart and influence runtime; secrets are absent.
## Dependencies
Settings repository, providers, diagnostics, privacy.
## Open implementation decisions
Secure user-auth token storage for remote backend.
## Verification method
Selector, persistence, consent, and UI tests.
