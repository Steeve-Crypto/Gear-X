# 011 Settings Privacy
## Objective
Implement persistent controls, diagnostics, export, and deletion.
## Files involved
Settings routes/features, repository, provider diagnostics, privacy services.
## Required changes
All specified options, disclosures, consent gates, health tests, version/counts/errors/timing.
## Constraints
No API secrets and no unsupported encryption claims.
## Acceptance criteria
Settings persist and influence runtime; remote calls require consent.
## Tests
Persistence, consent, retention, health, export/delete confirmation.
## Rollback considerations
Use defaults for unknown settings while retaining stored values.
## Completion status
In progress: persisted controls, consent, retention, export/delete, provider health, and diagnostics implemented; secure share adapter remains.
