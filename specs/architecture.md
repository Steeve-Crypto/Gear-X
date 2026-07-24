# Architecture Specification

## Purpose
Define maintainable boundaries while preserving the existing Expo, agents, SQLite, Ollama, and clock systems.
## Scope
Routes, features, domain, agents, runtime, repositories, infrastructure, services, state, and visualization.
## Non-goals
Distributed queues, microservices, or replacing proven local components without evidence.
## User stories
- As a maintainer, I can change a provider or screen without rewriting persistence or agents.
- As a tester, I can run orchestration deterministically without rendering React Native UI.
## Functional requirements
Expo Router owns navigation; repositories own SQL; adapters own providers; services coordinate use cases; screens render state.
## Technical requirements
Dependency direction is `app/features -> services/state -> agents/repositories -> infrastructure/domain`. Domain imports no UI framework.
## Failure states
Cycles, direct SQL in screens, provider calls in components, unbounded Router loops, and duplicate durable state are architecture failures.
## Privacy implications
Provider boundaries enforce consent centrally and logging boundaries redact personal content.
## Acceptance criteria
No monolithic App; route tree is scalable; agent and data paths have typed contracts; checks pass.
## Dependencies
Data model, agent contracts, providers, testing.
## Open implementation decisions
Whether to add dependency injection containers after the beta; current explicit factories are preferred.
## Verification method
Import review, route smoke test, TypeScript, architecture tests.
