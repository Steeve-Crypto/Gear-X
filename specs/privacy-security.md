# Privacy and Security Specification

## Purpose
Make handling of personal speech explicit, minimal, and controllable.
## Scope
Consent, storage, providers, logging, retention, export, deletion, diagnostics, and secrets.
## Non-goals
Claims of end-to-end encryption or encrypted SQLite until implemented and verified.
## User stories
- I decide whether anything leaves my device.
- I can remove recordings, sessions, insights, or all data.
- I can understand exactly what Gear X stores.
## Functional requirements
Separate microphone and remote consent; local-first default; per-capability cloud toggles and daily ceiling; retention settings; redacted production logs; backend-issued ephemeral tokens; export/delete controls.
## Technical requirements
Consent gate wraps remote adapters; usage records contain only provider, capability, and time; no long-lived keys in client/env bundle; database failures are typed; exports require an explicit action.
## Failure states
Missing consent blocks the call, failed deletion preserves an error state, and unavailable secure token flow disables remote voice.
## Privacy implications
The local SQLite file is sandboxed but plaintext to a compromised/unlocked device backup. Audio URIs may persist only when retention is enabled.
## Acceptance criteria
Remote tests prove denial without consent; secret scan is clean; UI states disclose remote transfer and encryption limits.
## Dependencies
Providers, data model, onboarding, settings.
## Open implementation decisions
SQLCipher/platform key wrapping and biometric export confirmation.
## Verification method
Privacy tests, code scan, settings walkthrough, export inspection.
