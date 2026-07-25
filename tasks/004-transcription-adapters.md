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
Complete for the documented beta boundary: production never fabricates transcripts; deterministic mock, unavailable device boundary, consent-gated local-network Whisper, secure backend adapter, cancellation, validation, and recoverable failure paths are implemented. Native on-device STT remains a disclosed post-beta integration.
