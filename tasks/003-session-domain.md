# 003 Session Domain
## Objective
Persist bounded recording/transcript/processing sessions.
## Files involved
Session models, repository, capture service, session store/routes.
## Required changes
Create/start/pause/stop/recover/delete/export workflows and child records.
## Constraints
Recording and transcription remain separate.
## Acceptance criteria
Sessions survive restart and interrupted processing can recover.
## Tests
Session lifecycle, metadata, cascade, export.
## Rollback considerations
Never remove legacy insights; feature can be disabled while records remain.
## Completion status
Complete: lifecycle, persisted pause/resume transitions, transcript persistence, history, detailed derived-record and run visibility, export, cascade deletion, idempotent segment replacement, and explicit failed-session recovery are implemented. Device verification is tracked in release readiness.
