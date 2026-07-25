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
Complete: ranked evidence, synthesis separation, no-evidence protection, confidence/quality, insight/session links, thread-bounded queries, and deterministic retrieval tests are implemented.
