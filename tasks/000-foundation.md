# 000 Foundation
## Objective
Establish strict domain boundaries, shared errors/tokens, specifications, repository instructions, and quality scripts.
## Files involved
`src/domain`, `src/design`, `specs`, `AGENTS.md`, `package.json`.
## Required changes
Create the SDD control plane and remove the monolithic entry.
## Constraints
Preserve agents, clock, SQLite, Ollama, and product identity.
## Acceptance criteria
Required specs/tasks exist and are concrete; strict types compile.
## Tests
Typecheck and spec/task inventory.
## Rollback considerations
Revert this milestone without touching persisted user data.
## Completion status
Complete.
