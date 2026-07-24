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
In progress: device boundary, deterministic mock, local Whisper server, secure backend, cancellation, and consent paths implemented; native provider remains.
