# Inference and Transcription Providers

## Purpose
Separate recording, transcription, reasoning, and voice providers behind reliable contracts.
## Scope
Capability routing, native speech, deterministic intelligence, mock providers, optional remote text/transcription, and Developer-mode Ollama/local endpoints.
## Non-goals
Pretending recorded audio is transcribed or shipping provider secrets.
## User stories
- I can use Ollama locally and see when it is unavailable.
- I can opt into a configured remote provider.
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
Mock and configured Ollama paths work; inference settings influence capture, summaries, Ask, and thread questions; device adapter reports unsupported transcription honestly; remote execution cannot bypass consent.
## Dependencies
Privacy, settings, errors, agent runtime.
## Open implementation decisions
Production backend deployment/authentication and optional offline whisper.cpp pack. See `specs/ai-runtime.md` for the evaluated runtime decision.
## Verification method
Provider unit tests, unreachable Ollama test, consent test, physical-device audio/transcription check.
