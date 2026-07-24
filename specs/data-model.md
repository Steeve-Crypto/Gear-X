# Data Model Specification

## Purpose
Provide normalized, evolvable local persistence for sessions and knowledge.
## Scope
`schema_migrations`, settings, sessions, transcript segments, insights, summaries, questions, threads, thread links, agent runs, and provider runs.
## Non-goals
Cloud synchronization, embeddings at rest, and encrypted SQLite claims.
## User stories
- My sessions and derived records survive restart.
- Deleting a session removes dependent records safely.
- Existing prototype insights survive migration.
## Functional requirements
Foreign keys, cascade rules, indexes, pagination, transactions, health counts, export, and idempotent migrations are required.
## Technical requirements
Timestamps are Unix milliseconds; booleans are integers; JSON ID arrays are validated; migrations are ordered and transactional.
## Failure states
Migration rollback, malformed rows, write errors, missing audio, and partial cascade failures emit typed errors.
## Privacy implications
SQLite is application-sandboxed but not application-level encrypted. Export is user-triggered and may contain sensitive plaintext.
## Acceptance criteria
Fresh and legacy databases reach the latest version; CRUD and cascades work; schema version is diagnosable.
## Dependencies
Expo SQLite, repository interfaces, privacy spec.
## Open implementation decisions
SQLCipher or platform-encrypted database upgrade; semantic vector index strategy.
## Verification method
Migration and repository integration tests plus restart/device checks.
