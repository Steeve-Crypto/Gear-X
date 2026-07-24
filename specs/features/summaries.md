# Summaries
## Purpose
Create durable, editable compression with source references.
## Scope
Session, daily, thread, manual/automatic, regenerate, edit, delete, and recovery.
## Non-goals
Unreferenced prose that replaces source records.
## User stories
I can review a concise session summary and trace it to insights.
## Functional requirements
Scope/type, title/body, source IDs, provider, timestamps, manual edit and regeneration.
## Technical requirements
Structured output validation and local rule fallback; writes through repository.
## Failure states
Insufficient sources, provider failure, invalid output, write failure.
## Privacy implications
Remote generation requires consent; sources are minimized.
## Acceptance criteria
Summary CRUD and source navigation persist; fallback is labelled.
## Dependencies
Summarizer, providers, repositories.
## Open implementation decisions
Daily scheduling strategy.
## Verification method
Validation, fallback, repository, and UI tests.
