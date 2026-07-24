# Threads
## Purpose
Expose inspectable relationships between insights.
## Scope
Title, description, links, rationale, confidence, timestamps, edits, linking, summary, and thread questions.
## Non-goals
Concatenated prose disguised as a relationship.
## User stories
I can understand why two insights are connected and correct the connection.
## Functional requirements
Weaver creates explicit link records; users link/unlink and edit; details show connected insights and rationale.
## Technical requirements
Normalized `threads` and `thread_insights`; unique pair constraints; transactional updates.
## Failure states
Orphan links, duplicate links, weak model output, deleted source.
## Privacy implications
Remote Weaver requires consent; local fallback remains available.
## Acceptance criteria
Automatic and manual relationships are inspectable and editable.
## Dependencies
Weaver, repositories, inference validation.
## Open implementation decisions
Graph visualization after mobile performance profiling.
## Verification method
Relationship unit/integration and UI tests.
