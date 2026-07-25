# Agent Contracts

## Purpose
Formalize the Router and eight specialized agents.
## Scope
Identity, typed input/output, eligibility, dependencies, timeout, retry, cancellation, events, observability, privacy, and idempotency.
## Non-goals
Autonomous external actions or an unbounded self-triggering agent loop.
## User stories
- I can see which agent is working and recover from a failed stage.
- Maintainers can test routing and agents without UI or live providers.
## Functional requirements
Router selects eligible agents in dependency order, deduplicates runs, limits iterations, honors cancellation, retries a failed idempotent specialist once, records every attempt, and surfaces typed errors.
## Technical requirements
Each agent declares metadata and implements `canRun` and `run`; results use typed data, events, metrics, and errors.
## Failure states
Timeouts, invalid output, dependency failure, duplicate idempotency key, cancellation, and unavailable providers.
## Privacy implications
Every agent declares local/remote allowance and data classification; remote execution requires consent.
## Acceptance criteria
All eight agents conform; Router does no specialist work; deterministic tests cover routing, ordering, cancellation, and duplicates.
## Dependencies
Inference providers, repositories, domain errors.
## Open implementation decisions
Background retry scheduling remains deferred; failed session processing is explicitly recoverable from its retained local recording.
## Verification method
Contract compile checks, runtime policy tests, agent-run record inspection, and failed-session recovery tests.
