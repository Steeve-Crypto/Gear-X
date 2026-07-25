# 005 Agent Runtime
## Objective
Enforce typed agent contracts and deterministic Router execution.
## Files involved
`src/agents`, runtime service, agent-run repository.
## Required changes
Metadata, ordering, dedupe, timeout, cancellation, events, typed results.
## Constraints
Router performs no specialist knowledge work.
## Acceptance criteria
All eight agents conform and runs are observable.
## Tests
Decisions, dependencies, duplicate keys, timeout, cancellation, loop cap.
## Rollback considerations
Legacy direct agents remain adapter-compatible during migration.
## Completion status
Complete: ordering, dedupe, bounded retry, timeout cancellation, awaited attempt events, metadata, typed failures, and persisted runs are implemented and covered by deterministic policy tests.
