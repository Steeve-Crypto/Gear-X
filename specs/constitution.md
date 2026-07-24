# Gear X Constitution

## Purpose
Define non-negotiable engineering and product principles for Gear X.
## Scope
All application code, data, providers, agents, documentation, tests, and releases.
## Non-goals
This is not a cloud collaboration suite, generic notes app, or autonomous external task executor.
## User stories
- As a user, I can trust Gear X to preserve my private knowledge and explain when data leaves my device.
- As a maintainer, I can evolve one coherent system without replacing its identity.
## Functional requirements
The eight agents remain specialized; Router only orchestrates; the clock reflects real state; durable records use repositories; remote processing is opt-in.
## Technical requirements
Expo Router, strict TypeScript, normalized SQLite migrations, adapter-based providers, typed failures, deterministic tests, and small reviewed commits are required.
## Failure states
Unsafe remote calls, data loss, unsupported claims, hidden failures, simulated production transcription, or a broken local path block release.
## Privacy implications
Personal speech is highly sensitive. Minimize collection, retain recordings only by choice, redact logs, and never ship long-lived secrets.
## Acceptance criteria
Architecture and code obey these principles; deviations are documented and approved; validation passes.
## Dependencies
Product, architecture, privacy, testing, and release-readiness specs.
## Open implementation decisions
Encrypted database provider and reliable offline native transcription remain future native-build decisions.
## Verification method
Architecture review, secret scan, route inspection, tests, and release checklist.
