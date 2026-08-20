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
- A production-oriented Supabase boundary is implemented locally: anonymous Supabase Auth, platform-secure refresh-token storage, authenticated health/session/transcription/intelligence routes, explicit consent assertions, xAI server adapters, atomic server-side daily quotas/rate limits, request validation, redacted errors/logs, and 35-day metadata retention.

## Current release blockers

- The backend is not deployed. Supabase CLI authentication is available, but the account has no dedicated GearX project; the unrelated existing projects were not reused. A project, anonymous Auth plus CAPTCHA, xAI secret, migration deployment, function deployment, and live endpoint verification remain required.
- No real `EXPO_PUBLIC_GEAR_X_BACKEND_URL`, Supabase URL, or publishable key is configured in a production build. No live xAI transcription/intelligence call is claimed.
- EAS is not authenticated or linked to a project on this machine, so Android or iOS builds cannot yet be submitted to Expo's build service. Physical iOS builds also require Apple Developer credentials and a registered device.
- Native recorded-file transcription and 3D GPU/capture behavior have not been exercised on physical iOS and Android devices. The native bridge requires a development/store build and does not run in Expo Go.
- Recorded-file speech support varies by Android version, installed speech service, locale pack, and device; a cloud fallback is required for broad reliability.
- The current Expo SDK 57 compatibility patch set is complete. The production audit reports 17 upstream Expo/Metro toolchain advisories (8 high, 9 moderate, 0 critical); npm's suggested fixes downgrade to incompatible Expo 53 packages.
- Local SQLite data is sandboxed but not application-level encrypted.

## Verification evidence

`npm run validate` passes on Expo SDK 57.0.15 and React Native 0.86.2: type checking, 19 domain/SQLite/static tests, 43 Jest UI/provider/auth/runtime/pipeline tests, and lint. Twelve backend tests pass for auth, consent, input validation, transcription, structured intelligence, provider failures/timeouts, quotas/rate limits, and secret exposure. Expo Doctor passes 21/21. Android export produces a 6.3 MB Hermes bundle, and its provider/service-secret scan is clean. No physical-device, deployed-backend, live-provider, or store-review result is claimed.
