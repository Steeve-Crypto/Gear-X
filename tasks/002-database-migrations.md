# 002 Database Migrations
## Objective
Replace one-time schema creation with normalized versioned migrations.
## Files involved
`src/infrastructure/database`, `src/repositories`.
## Required changes
Add required tables, indexes, foreign keys, legacy preservation, health/version APIs.
## Constraints
Never destructively reset a user database.
## Acceptance criteria
Fresh and legacy databases reach current version transactionally.
## Tests
Migration and cascade integration tests.
## Rollback considerations
Transactions roll back failed migration; schema migrations are forward-only.
## Completion status
In progress: normalized forward migration and legacy-column preservation implemented; device migration tests remain.
