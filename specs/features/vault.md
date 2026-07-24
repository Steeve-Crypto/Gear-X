# Vault
## Purpose
Browse and manage durable insights.
## Scope
Paginated browse/search/filter, detail/source links, edit, pin, archive, delete, export, and bulk selection.
## Non-goals
Loading the complete vault into global state.
## User stories
I can find a past decision and inspect its transcript source.
## Functional requirements
Date/type/session/confidence/unresolved filters, highlighting, stable pagination, empty/error states.
## Technical requirements
Indexed repository queries; escaped search; optimistic UI only with rollback.
## Failure states
No results, malformed source IDs, database write/query failure.
## Privacy implications
Exports warn that content may be plaintext outside Gear X.
## Acceptance criteria
Search/filter/detail/edit/pin/archive/delete/export work against SQLite.
## Dependencies
Insight repository, session detail, design system.
## Open implementation decisions
FTS5 availability fallback.
## Verification method
Repository integration and UI tests.
