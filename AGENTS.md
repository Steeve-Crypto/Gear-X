# Gear X Agent Guide

## Product purpose

Gear X is a voice-first, local-first personal intelligence mobile app represented by a living mechanical clock-planet. It remembers, connects, questions, and evolves with its user. Preserve the product identity, eight named agents, Router orchestrator, SQLite vault, Expo/React Native stack, and Ollama path.

## Required workflow

1. Inspect existing behavior, Git status, specifications, and current task before editing.
2. Update the relevant file under `specs/` before or with behavioral changes.
3. Work in small milestones. Update the matching `tasks/*.md` completion status truthfully.
4. Run type checking and focused tests after each milestone; run `npm run validate` before handoff.
5. Commit each small milestone with a commit message under five words.

## Architecture and ownership

- `app/`: Expo Router route composition only.
- `src/features/`: screen controllers and feature UI.
- `src/components/`: reusable presentation components.
- `src/domain/`: framework-independent models and errors.
- `src/agents/`: agent contracts, implementations, and Router runtime.
- `src/infrastructure/`: SQLite, migrations, device and provider adapters.
- `src/repositories/`: all durable data access.
- `src/services/`: application workflows; no screen-specific rendering.
- `src/state/`: ephemeral session, UI, provider, and visualization state only.
- `src/design/`: visual tokens and shared primitives.

Screens must not query SQLite or call provider-specific APIs. Agents must not import screens. Durable records live in SQLite, not duplicated as a complete Zustand cache.

## Specifications

Every spec must contain purpose, scope, non-goals, user stories, functional and technical requirements, failure states, privacy implications, acceptance criteria, dependencies, open implementation decisions, and verification. Update specs whenever behavior changes; never describe planned behavior as implemented.

## Testing and verification

Test Router decisions, agent parsing/validation, retrieval ranking, migrations, repositories, privacy enforcement, session pipelines, export/deletion, and primary UI states. Never claim a device test or command passed unless it ran. Record unavailable device checks in `specs/release-readiness.md`.

## Privacy constraints

Local-first is the default. Remote processing requires explicit persisted consent and a visible indicator. Never commit secrets, log transcript content in production, place long-lived provider keys in the client, or claim local database encryption that is not implemented. Recording and transcription are separate operations. Respect recording retention.

## Visual constraints

Preserve the functional mechanical clock-planet. Use obsidian, aged brass, ivory, engraved geometry, controlled motion, and readable mobile typography. Agent activity must have a non-visual text equivalent. Avoid generic SaaS grids, decorative motion, excessive glow, and inaccessible controls.

## Prohibited shortcuts

Do not restart the project, duplicate working systems, restore simulated transcripts to production, make the Router a god object, bypass repositories, add unnecessary cloud infrastructure, create placeholder screens, invent metrics, hide errors, or leave broken routes/imports.

## Definition of done

A change is done only when implementation, specification, task status, error handling, accessibility, privacy effects, and appropriate tests agree; type checking passes; and rollback implications are understood. Verify existing behavior before replacing it.
