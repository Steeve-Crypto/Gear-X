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
Complete for automated scope: indexed/paginated repositories, bounded runtime work, stale request cancellation, reduced-motion/low-performance modes, timing records, and a reproducible 10,000-record query benchmark are implemented. The measured average was 6.76 ms over 100 filtered queries on 2026-07-25; device animation profiling remains in task 014.
