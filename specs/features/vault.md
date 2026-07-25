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
Date/type/session/confidence/unresolved/archive filters, literal highlighting, stable incremental pagination, empty/error states, and long-press bulk selection.
## Technical requirements
Indexed repository queries; escaped search; optimistic UI only with rollback.
## Failure states
No results, malformed source IDs, database write/query failure.
## Privacy implications
Exports warn that content may be plaintext outside Gear X.
## Acceptance criteria
Search/filter/detail/edit/pin/archive/delete/plaintext export/bulk actions work against SQLite; details expose source transcript, session, threads, and questions.
## Dependencies
Insight repository, session detail, design system.
## Open implementation decisions
FTS5 remains an optional post-beta optimization; the escaped `LIKE` fallback is authoritative.
## Verification method
Repository integration and UI tests.
