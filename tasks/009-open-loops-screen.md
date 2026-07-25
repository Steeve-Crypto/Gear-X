# 009 Open Loops
## Objective
Persist and manage Questioner open loops.
## Files involved
Loops routes/features, Questioner, question repository.
## Required changes
Categories, search/filter, priorities, sources, resolve/dismiss, reminder-ready export.
## Constraints
No automatic external task creation.
## Acceptance criteria
All states persist and source navigation works.
## Tests
Classification, filters, transitions, missing sources.
## Rollback considerations
Keep questions even if reminder export is unavailable.
## Completion status
Complete: nine categories, search/filter, source navigation, priority/due-date editing, reminder readiness, noted resolve/dismiss transitions, and category validation are implemented.
