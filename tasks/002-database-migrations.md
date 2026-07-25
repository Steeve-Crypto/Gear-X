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
Complete for automated scope: normalized transactional migration, legacy-column preservation, required indexes, uniqueness, and cascade behavior are covered by in-memory SQLite integration tests. Restart verification on Android/iOS remains in task 014.
