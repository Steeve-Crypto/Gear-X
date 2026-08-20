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
- A production-oriented Supabase boundary is implemented locally: anonymous Supabase Auth, platform-secure refresh-token storage, authenticated routes, explicit consent, optional server-only providers, request validation, redacted errors/logs, and metadata-only accounting.
- Server-authoritative Free/Pro/Max capability plans and subscription lifecycle state gate every hosted-cloud call. Free includes a bounded 30-minute monthly transcription and small intelligence trial; client plan/quota/user/mode claims are ignored.
- Approved launch economics are locked: GearX Free $0, Pro $9.99/month with 10 transcription hours, and Max $19.99/month with 30 hours and three times Pro intelligence capacity. Every plan retains all local features.
- RevenueCat is isolated behind a replaceable billing interface. Purchase, restore, manage, stable Supabase identity, product mapping, idempotent lifecycle synchronization, authorization plus raw-body HMAC/replay verification, and consumer plan/allowance UI are implemented locally.
- Atomic billing-period duration, separate reserved/actual input-output, per-capability, size, rolling-rate, $0.25/$3/$7 per-user spend, daily/monthly global budget, and kill-switch controls fail closed without limiting local Gear X.

## Current release blockers

- The backend is not deployed. A dedicated GearX Supabase project, rate-limited anonymous Auth, reviewed production global budgets, RevenueCat/store configuration, migration/function deployment, and live endpoint verification remain required. xAI is intentionally not deployed and is not required for local use.
- No real backend/Supabase/RevenueCat public identifiers are configured in a production build. No live purchase, webhook, restore, transcription, or intelligence call is claimed.
- EAS is not authenticated or linked to a project on this machine, so Android or iOS builds cannot yet be submitted to Expo's build service. Physical iOS builds also require Apple Developer credentials and a registered device.
- Native recorded-file transcription and 3D GPU/capture behavior have not been exercised on physical iOS and Android devices. The native bridge requires a development/store build and does not run in Expo Go.
- Recorded-file speech support varies by Android version, installed speech service, locale pack, and device; a cloud fallback is required for broad reliability.
- The current Expo SDK 57 compatibility patch set is complete. The production audit reports 17 upstream Expo/Metro toolchain advisories (8 high, 9 moderate, 0 critical); npm's suggested fixes downgrade to incompatible Expo 53 packages.
- Local SQLite data is sandboxed but not application-level encrypted.

## Verification evidence

`npm run validate` passes on Expo SDK 57.0.15 and React Native 0.86.2: type checking, 19 domain/SQLite/static tests, 56 Jest UI/provider/auth/billing/runtime/pipeline tests, and lint. Twenty-seven backend tests pass. Expo Doctor passes 21/21 and Expo dependencies are compatible. Android export produces a 7,893,991-byte Hermes bundle from 1,767 modules; its provider/store/service-secret and operational-budget marker scan is clean. The production audit still reports 17 upstream Expo/Metro advisories (8 high, 9 moderate, 0 critical) whose offered fix is an incompatible Expo 53 downgrade. No physical-device, signed-build, deployed-backend, live billing/provider, or store-review result is claimed.
