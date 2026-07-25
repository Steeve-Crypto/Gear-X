# Capture Session
## Purpose
Persist one bounded listening and processing period.
## Scope
Create, pause, stop, recover, inspect, export, and delete session records and children.
## Non-goals
One permanent global transcript.
## User stories
I can revisit a session with its transcript, insights, summary, questions, threads, errors, and providers.
## Functional requirements
Unique ID, timestamps, duration, optional audio URI, status, provider/mode fields, cascade deletion, recovery state.
## Technical requirements
Repository transactions and explicit state transitions; recording and transcription are separate.
## Failure states
Missing audio, corrupt record, interruption, partial processing, and database error.
## Privacy implications
Audio is deleted after successful transcription unless retention is enabled. A failed cleanup keeps the URI visible and surfaces a warning.
## Acceptance criteria
Session survives restart; child sources resolve; interrupted processing is recoverable.
## Dependencies
Data model, repositories, capture/transcription services.
## Open implementation decisions
Background retry scheduling remains post-beta; explicit retry is available from a failed session.
## Verification method
Integration tests and restart/device check.
