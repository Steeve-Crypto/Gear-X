# Gear X Handoff

## Current state

Gear X is implemented for every repository-local requirement that can be verified on this Windows machine. The app uses Expo SDK 57.0.12, React Native 0.86.2, Expo Router, `expo-audio`, the native speech bridge, SQLite repositories, eight agents plus Router orchestration, privacy-gated provider routing, and the real-time 3D celestial gear body. Session details, diagnostics, privacy/export/delete controls, open loops, and critical UI flows have automated coverage.

The review server runs at `http://127.0.0.1:8088/orbit`. Runtime logs live under ignored `.runtime/` and must not be committed.

## Verified locally

- `npm run validate`: type checking, 19 domain/SQLite/static tests, 39 Jest tests, and lint pass.
- `npx expo-doctor`: 20/20 checks pass.
- `npx expo install --check`: dependencies are compatible.
- Web `/orbit`: visible Orbit heading, 3D gear body, Start listening control, and no browser warning/error logs.
- Production dependency audit: 24 upstream toolchain advisories remain (15 high, 9 moderate, 0 critical). npm proposes incompatible Expo/React Native/Metro downgrades; do not force them.

## External release gates

1. Sign in to Expo/EAS and link the project, then run the existing Android, iOS device, and iOS Simulator build profiles.
2. Supply Apple Developer credentials and register a physical iOS device; use macOS/Xcode for simulator/device installation.
3. Deploy the production Gear X backend session/auth, xAI inference, transcription, rate-limit, budget, and monitoring boundary; set `EXPO_PUBLIC_GEAR_X_BACKEND_URL` only after that boundary exists.
4. Exercise recording, recorded-file speech recognition, interruption/recovery, retention cleanup, and the 3D GPU path on representative physical Android and iOS devices.
5. Prepare store metadata, privacy disclosures, screenshots, signing credentials, and submission records.
6. Monitor upstream Expo/React Native/Metro advisory fixes and upgrade only to an Expo-compatible set that passes Doctor and validation.
7. Evaluate SQLCipher or another supported at-rest encryption design before making any encryption claim.

## Next-owner workflow

Read `AGENTS.md`, `RELEASE_STATUS.md`, and `specs/release-readiness.md` first. Keep commits under five words, update specs/tasks with behavior, run focused tests after each milestone, and run `npm run validate` before handoff. Never mark physical-device, backend, EAS, store, encryption, or audit gates complete without direct evidence.
