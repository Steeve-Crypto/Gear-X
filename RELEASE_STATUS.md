# Gear X Release Status

Gear X is not yet cleared for App Store or Google Play submission.

## Implemented baseline

- Eight-agent Router architecture, normalized SQLite repositories, persistent sessions, evidence-backed local retrieval, privacy controls, export/deletion, and the real-time 3D mechanical gear body.
- Deterministic local extraction, weaving, summarization, questioning, retrieval, visualization, and archival paths that do not require an LLM.
- Capability-based transcription and text-inference routers with ordered fallback, timeout/cancellation, malformed-output handling, and task-scoped capabilities.
- Private, Balanced, Quality, and Developer modes. Normal defaults do not instantiate or probe Ollama.
- Native Apple/Android recorded-file speech bridge, optional consented multipart backend transcription, and Developer-only Ollama/local Whisper adapters. Production code never fabricates transcripts.
- Local FTS5 vault search where available, indexed lexical fallback elsewhere, local evidence ranking, and optional minimal-context synthesis.
- Separate cloud transcription/intelligence switches and a durable daily request limit. Usage records contain no transcript, prompt, response, or audio.
- Expo development-client support with explicit internal Android APK, ad hoc iOS device, and iOS Simulator build profiles.

## Current release blockers

- No production Gear X backend URL, mobile session/authentication service, xAI server configuration, rate limits, budget, or operational monitoring has been deployed or verified.
- EAS is not authenticated or linked to a project on this machine, so Android or iOS builds cannot yet be submitted to Expo's build service. Physical iOS builds also require Apple Developer credentials and a registered device.
- Native recorded-file transcription and 3D GPU/capture behavior have not been exercised on physical iOS and Android devices. The native bridge requires a development/store build and does not run in Expo Go.
- Recorded-file speech support varies by Android version, installed speech service, locale pack, and device; a cloud fallback is required for broad reliability.
- The current Expo SDK 57 compatibility upgrade is complete. The production audit still reports 24 upstream Expo/React Native/Metro toolchain advisories (15 high, 9 moderate, 0 critical); npm's suggested fixes downgrade incompatible framework packages.
- Local SQLite data is sandboxed but not application-level encrypted.

## Verification evidence

`npm run validate` passes on Expo SDK 57.0.12 and React Native 0.86.2: type checking, 19 domain/SQLite/static tests, 39 Jest UI/provider/runtime/pipeline tests, and lint. Expo dependency compatibility, public config/plugin resolution, and all 20 Expo Doctor checks pass. No physical-device, deployed-backend, or store-review result is claimed.
