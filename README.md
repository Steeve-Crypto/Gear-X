# Gear X

Gear X is a voice-first, local-first personal intelligence mobile application represented as a living mechanical clock-planet. It records bounded sessions, transforms provider-produced transcripts into structured knowledge, connects related ideas, stores long-term memory, surfaces unresolved questions, and answers against evidence in the private vault.

> Gear X is the machine that remembers, connects, questions, and evolves with its user.

## Current beta status

The repository has been migrated from a single-screen prototype to Expo Router with layered domain, provider, repository, agent-runtime, feature, and design boundaries. Audio capture is real. Simulated transcripts have been removed from production. The default transcription adapter intentionally reports unavailable until a compatible native on-device module or secure backend provider is configured—recording is not presented as transcription.

The SQLite database is application-sandboxed but is not application-level encrypted. Remote processing is disabled by default and requires explicit consent. Never place long-lived provider credentials in the mobile app.

## Architecture

```text
app/                       Expo Router route composition
src/components/            reusable mobile presentation and clock
src/design/                obsidian/brass design tokens
src/domain/                models, errors, routing, validation, ranking
src/features/              feature controllers as the app grows
src/agents/                Router plus eight specialized agents/runtime
src/infrastructure/        SQLite migrations and provider adapters
src/repositories/          durable data access and observability
src/services/              capture and knowledge workflows
src/state/                 ephemeral settings/session state
specs/                     product and feature source of truth
tasks/                     execution status and verification
tests/                     deterministic production-domain tests
```

Router is the orchestrator, not a knowledge-processing god object. The eight agents remain Listener, Extractor, Weaver, Summarizer, Questioner, Visualizer, Retriever, and Archivist.

## Requirements

- Node.js 20 or 22 LTS (Node 24 is not the Expo 53 release baseline)
- npm
- Expo Go for navigation/web checks, or an Expo development/store build for native transcription
- Ollama only for optional Developer-mode inference

## Setup

```bash
npm install
npm run typecheck
npm test
npm start
```

For Developer-mode Ollama:

```bash
ollama serve
ollama pull qwen2.5:3b
```

The default endpoint is `http://localhost:11434`. A physical device must use the development machine’s LAN address. Configure it in Settings → Inference.

## Commands

```bash
npm start
npm run android
npm run ios
npm run web
npm run typecheck
npm test
npm run lint
npm run validate
```

`validate` runs type checking, tests, and lint. Native microphone, persistence-after-restart, background interruption, and iOS/Android behavior still require the manual matrix in [release readiness](specs/release-readiness.md).

## Android development build

Native transcription requires a development/store build and cannot run in Expo Go. After signing into Expo and linking this repository to an EAS project:

```bash
npx eas-cli@latest build --platform android --profile development
```

The development profile produces an internally distributed APK for physical-device verification. No provider credentials belong in the build.

## Privacy

- Local processing is the default.
- Remote adapters are consent-gated.
- Audio URI retention is opt-in.
- Transcript content is not intentionally written to production logs.
- Grok Voice accepts only a backend-issued ephemeral credential and refuses to connect without remote consent.
- JSON export is user-triggered and plaintext; the user must protect it after it leaves the app.

See [privacy details](docs/PRIVACY.md) and [provider boundaries](specs/inference-providers.md).

## Known limitations

- Native OS recorded-file speech is integrated but still requires physical-device format and locale verification. Unsupported devices need the optional production backend fallback.
- Secure share-to-file export requires a platform file/share adapter; the current UI prepares selectable versioned JSON.
- SQLCipher/platform-wrapped database encryption is not yet implemented.
- Physical-device verification and store release configuration remain.

## Contribution workflow

Read [AGENTS.md](AGENTS.md), the relevant specification, and matching task before editing. Preserve existing systems, update specs with behavior, run focused verification, and commit each small milestone with a message under five words.
