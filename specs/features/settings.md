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
Persist appearance/automation/processing/voice/transcription preferences; consent confirmation; retention; endpoint/model; provider selection; live provider health, current/latest schema status, recent agent/provider timing and error codes, diagnostics export, and destructive controls.
## Technical requirements
Settings repository with validated keys and typed values; provider tests have timeouts.
## Failure states
Invalid endpoint, unreachable model, failed persistence/export/delete.
## Privacy implications
Plain-language local storage/encryption limitation and remote disclosures are required. Diagnostics contain metadata and error codes, never transcript, prompt, or secret content; the local developer endpoint is visible only in Developer mode.
## Acceptance criteria
Changes survive restart and influence runtime through provider injection; unconfigured remote inference falls back locally without sending data; live availability and schema drift are visible; secrets and captured content are absent from diagnostics.
## Dependencies
Settings repository, providers, diagnostics, privacy.
## Open implementation decisions
Secure user-auth token storage for remote backend.
## Verification method
Selector, persistence, consent, and UI tests.
