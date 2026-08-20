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
Consent gate wraps remote adapters and every backend request carries a consent assertion; backend identity comes only from a validated Supabase JWT; usage records contain only provider/capability/request metadata and time; no long-lived provider or service-role keys exist in the client/env bundle; anonymous refresh material uses platform secure storage; database failures are typed; exports require an explicit action.
## Failure states
Missing consent blocks the call, failed deletion preserves an error state, and unavailable secure token flow disables remote voice.
## Privacy implications
The local SQLite file is sandboxed but plaintext to a compromised/unlocked device backup. Audio URIs may persist only when retention is enabled.
## Acceptance criteria
Remote tests prove denial without consent; secret scan is clean; UI states disclose remote transfer and encryption limits.
## Dependencies
Providers, data model, onboarding, settings.
## Open implementation decisions
SQLCipher/platform key wrapping, biometric export confirmation, production CAPTCHA configuration, and permanent account linking.
## Verification method
Privacy tests, code scan, settings walkthrough, export inspection.
