# Ask Gear X
## Purpose
Answer questions only from stored evidence.
## Scope
Question input, local retrieval, optional synthesis, evidence/source display, quality, and no-evidence response.
## Non-goals
Open-domain assistant answers unsupported by the vault.
## User stories
I can ask what I decided and verify every supporting record.
## Functional requirements
Rank local records; separate evidence from synthesis; cite insights/sessions; expose retrieval quality.
## Technical requirements
Deterministic lexical ranking baseline; provider synthesis receives only selected evidence; validated response.
## Failure states
Empty query, no evidence, provider unavailable, invalid output, retrieval failure.
## Privacy implications
Local by default; remote synthesis requires consent and visible transfer state.
## Acceptance criteria
No evidence produces no invented answer; every answer exposes sources.
## Dependencies
Retriever, insight repository, provider layer.
## Open implementation decisions
Local embeddings and hybrid search.
## Verification method
Ranking, unsupported-answer, consent, and UI tests.
