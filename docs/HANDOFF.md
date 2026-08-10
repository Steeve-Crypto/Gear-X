# Continuation Handoff

## Current state

AI runtime continuation (2026-08-10):

- `437688d` documents the evaluated mobile AI decision and creates the release-status source of truth.
- `d3f052f` adds capability-scoped inference routing, native recorded-file speech, actual multipart backend transcription, four processing modes, Developer-only Ollama, and provider tests.
- `2988241` adds local FTS5 vault retrieval with a safe indexed lexical fallback.
- `7ae37b3` adds separate cloud controls and durable daily usage reservations.
- The consumer default is Balanced: native on-device speech first, deterministic local agents/retrieval always, and consented cloud only when a production backend URL is configured.
- `EXPO_PUBLIC_GEAR_X_BACKEND_URL` is public routing configuration, never a provider credential. A deployed backend must issue short-lived mobile session tokens and keep xAI/provider keys server-side.

Gear X is on `main` and uses Expo Router, normalized SQLite repositories, persistent capture sessions, eight typed agents plus Router, consent-gated providers, evidence-backed retrieval, settings/privacy controls, and a real React Three Fiber/Expo GL visualization.

The former SVG clock has been replaced by a hardware-rendered celestial body made from extruded, beveled, counter-rotating gear meshes. It uses Three.js lighting, shadows, depth camera, metallic materials, orbital rings, state-driven emissive activity, reduced motion, and a lower-complexity mode while retaining the existing obsidian/brass/ivory palette.

Recent milestones:

- `96dfc4f` — Enable web preview
- `89c14a2` — Add mechanical depth (superseded by real WebGL renderer)
- `2379e09` — Persist capture pauses
- `1e0e609` — Wire inference settings
- The real 3D renderer milestone is the next commit after this document.

## Verification completed

- AI runtime validation passes: 19 domain/SQLite/static tests, 27 Jest tests, type checking, and lint.
- Expo SDK dependency compatibility and native speech public-config/plugin resolution pass.
- Native speech behavior is unit-tested through its bridge, but no physical-device transcription is claimed.
- `expo-dev-client` and `eas.json` prepare an internal Android APK. `npx eas-cli@latest whoami` reported `Not logged in`; sign in and link/create the EAS project before submitting the build.

- Full `npm run validate` passed after the WebGL conversion: 18 domain tests, 20 Jest tests, type checking, and lint.
- Focused 3D gear-profile tests passed: 2/2.
- Expo dependency compatibility passed.
- Side-panel WebGL rendering passed with no renderer errors.
- Android Hermes export passed: 1,248 modules, 6.25 MB.
- The temporary Android export directory was removed.

## Next work, in order

1. Refresh `npm audit --omit=dev`; plan the coordinated Expo/React Native upgrade instead of forcing incompatible package fixes.
2. Test the Expo GL scene on physical Android and iOS hardware, including heat, frame rate, reduced motion, and low-performance mode.
3. Build native iOS/Android development clients and complete recorded-file format/locale, microphone, interruption/resume, SQLite restart, share sheet, 3D GPU, unsupported speech, and poor-network matrices.
4. Deploy and verify the Gear X session/backend boundary before enabling cloud fallback in a store build. Add device attestation/auth, xAI credentials server-side, rate limits, budgets, redacted monitoring, and retention policy.
5. Expand session detail to render its insights, summaries, questions, related threads, agent failures, and provider runs directly rather than only in its export.
6. Expand Diagnostics with explicit migration status, local endpoint, live provider availability, and recent provider runs.
7. Replace the remaining production `console.warn`/`console.error` calls with redacted structured diagnostics.
8. Add the remaining UI/integration cases listed in `specs/testing.md`, especially Orbit permission/stop, loop resolution, delete confirmation, offline states, export, and deletion cascade.

## Constraints

Keep commit messages under five words and commit each small milestone. Update the relevant spec and task with every behavior change. Do not claim physical-device checks, native transcription, encrypted SQLite, or dependency remediation until they actually pass.
