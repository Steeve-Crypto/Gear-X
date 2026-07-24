# 007 Vault Screen
## Objective
Implement durable insight browse, search, filters, and management.
## Files involved
Vault feature/routes, insight repository.
## Required changes
Pagination, filters, detail/source, edit/pin/archive/delete/export/bulk.
## Constraints
Do not cache the full database in Zustand.
## Acceptance criteria
Requested management actions persist and search highlights results.
## Tests
Queries, pagination, filters, mutations, empty/error states.
## Rollback considerations
UI rollback does not alter schema or records.
## Completion status
In progress: paginated search/list and editable insight detail actions implemented; advanced filters and bulk selection remain.
