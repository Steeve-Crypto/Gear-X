# Open Loops
## Purpose
Turn unresolved knowledge into actionable, inspectable records.
## Scope
Nine categories, status, priority, sources, dates, resolution, dismissal, reminder-ready flag, search/filter.
## Non-goals
Automatically creating external reminders.
## User stories
I can see unfinished commitments and resolve them with a note.
## Functional requirements
Questioner classifies and persists loops; users search/filter, edit priority and due date, mark reminder readiness, resolve/dismiss with notes, and navigate sources.
## Technical requirements
Questions repository indexes status/category/due date and validates transitions.
## Failure states
Invalid category, missing source, duplicate model output, failed status write.
## Privacy implications
External export/reminder integration requires a separate explicit action.
## Acceptance criteria
All categories render; filtering and resolution persist.
## Dependencies
Questioner, repositories, insight/session details.
## Open implementation decisions
Platform reminder integration is outside beta; the persisted reminder-ready flag is the explicit handoff boundary.
## Verification method
Classification, persistence, and UI tests.
