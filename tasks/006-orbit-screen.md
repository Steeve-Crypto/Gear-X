# 006 Orbit Screen
## Objective
Deliver state-driven capture and clock experience.
## Files involved
Orbit route/feature, GearClock, session/visualization stores.
## Required changes
Controls, duration, previews, agent status, permission/error/offline, reduced motion, and a real WebGL celestial gear body using the existing palette.
## Constraints
Clock preserves mechanical identity and is never sole status output.
## Acceptance criteria
Real session recording updates actual visual state; no timers inject text.
## Tests
Permission, start/pause/stop, processing, empty/error/reduced motion.
## Rollback considerations
Capture service remains independent of the visualization.
## Completion status
In progress: capture controls, status, real session state, agent signals, motion modes, and the palette-preserving React Three Fiber/Expo GL celestial gear body are implemented; physical-device GPU verification remains.
