# 013 Performance
## Objective
Keep capture, queries, and visualization responsive on mobile.
## Files involved
Repositories, lists, runtime, visualization, benchmark utilities.
## Required changes
Indexes, pagination, selectors, cancellation, bounded animations, timing metrics.
## Constraints
Metrics must be measured, never fabricated.
## Acceptance criteria
Critical timings are recorded and stale work is cancelled.
## Tests
Ranking/query benchmarks, rerender inspection, device animation profile.
## Rollback considerations
Low-performance mode disables optional animation safely.
## Completion status
Pending.
