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
Complete for implemented behavior: Private/Balanced/Quality/Developer modes, consent, per-capability cloud toggles, durable daily limit, runtime provider injection, diagnostics, export/delete, retention, and Developer-only Ollama configuration are implemented.
