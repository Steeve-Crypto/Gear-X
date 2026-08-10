# 004 Transcription Adapters
## Objective
Remove simulated production transcripts and define honest provider paths.
## Files involved
`src/infrastructure/transcription`, capture pipeline, settings.
## Required changes
Mock test provider, device adapter boundary, real configured remote path with consent.
## Constraints
Audio capture is not STT; no secrets in client.
## Acceptance criteria
Production path never fabricates transcript; unsupported path is clearly reported.
## Tests
Mock, cancellation, unavailable, consent, invalid result.
## Rollback considerations
Captured recording/session remains recoverable after provider failure.
## Completion status
Reopened for production: the honest provider boundary is complete, but native OS speech and actual-file cloud upload are required by `specs/ai-runtime.md` before this task is complete.
