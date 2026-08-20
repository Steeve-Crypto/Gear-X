# Inference and Transcription Providers

## Purpose
Separate recording, transcription, reasoning, and voice providers behind reliable contracts.
## Scope
Capability routing, native speech, deterministic intelligence, mock providers, optional remote text/transcription, and Developer-mode Ollama/local endpoints.
## Non-goals
Pretending recorded audio is transcribed or shipping provider secrets.
## User stories
- I can use native speech and deterministic intelligence without Ollama.
- I can opt into a configured remote provider with a daily ceiling.
- I can enable Ollama in Developer mode and see when it is unavailable.
- Tests can run with deterministic mocks.
## Functional requirements
Availability test, timeout, cancellation, bounded retry, structured validation, consent gate, provider run metrics, and explicit fallback.
## Technical requirements
`TranscriptionProvider` and `InferenceProvider` interfaces; selected settings are injected into agent context rather than read from hard-coded defaults; AbortSignal; validated response schemas; ephemeral remote token contract.
## Failure states
Unavailable endpoint/model, timeout, network failure, invalid output, missing consent/token, and unsupported on-device STT.
## Privacy implications
Remote adapters show transfer state and require persisted consent. Prompts/responses are not logged by default.
## Acceptance criteria
Native recorded-file speech, deterministic fallback, task-capability routing, configured Ollama, actual-file backend upload, timeout/fallback, and cost ceilings work; settings influence capture, summaries, Ask, and thread questions; remote execution cannot bypass consent.
## Dependencies
Privacy, settings, errors, agent runtime.
## Open implementation decisions
Production Supabase project deployment and optional offline whisper.cpp pack. The implemented backend contract is defined in `specs/production-backend.md`; deployment remains external until project credentials are supplied.
## Verification method
Provider unit tests, fallback/timeout/budget tests, unreachable Ollama test, consent test, public config scan, and physical-device audio/transcription check.
