# 010 Ask Gear X
## Objective
Provide evidence-backed vault answers.
## Files involved
Ask feature, Retriever, ranking service, providers.
## Required changes
Question, ranked evidence, sources, quality, synthesis separation, no-evidence state.
## Constraints
Never invent an unsupported answer.
## Acceptance criteria
Every answer cites stored insight/session records or reports no evidence.
## Tests
Ranking, empty query, no evidence, fallback, consent.
## Rollback considerations
Disable synthesis while preserving deterministic retrieval.
## Completion status
In progress: ranked evidence, synthesis separation, quality, and no-evidence protection implemented; source-session links remain.
