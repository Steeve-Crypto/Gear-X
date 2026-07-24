# Export and Delete
## Purpose
Provide user control and portability for all personal data.
## Scope
Insight/session/all-data JSON export and record/all-data deletion.
## Non-goals
Automatic cloud backups.
## User stories
I can export my knowledge and permanently remove selected or all local data.
## Functional requirements
Versioned export schema, source relationships, confirmation, transactional cascade, and audio cleanup where possible.
## Technical requirements
Repository transaction builds export; sharing is initiated only by user; deletion reports partial file cleanup.
## Failure states
Share unavailable, serialization error, database rollback, missing audio, file deletion failure.
## Privacy implications
Exported plaintext leaves app sandbox; warn before sharing.
## Acceptance criteria
Exports are complete/readable; cascades preserve referential integrity; cancel is safe.
## Dependencies
All repositories, file/share adapter, privacy.
## Open implementation decisions
Encrypted archive export.
## Verification method
Export schema and deletion-cascade integration tests plus device share check.
