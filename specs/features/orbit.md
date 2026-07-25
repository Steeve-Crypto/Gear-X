# Orbit
## Purpose
Make live cognition visible and controllable through the clock-planet.
## Scope
Permission, recording, pause/stop, duration, transcript preview, insight, agent state, offline/error/empty, reduced motion.
## Non-goals
Decorative animation or background recording without platform support.
## User stories
I can start a session, understand what is active, and stop safely.
## Functional requirements
Clock state maps Listener, Extractor, Weaver, Archivist, Questioner, Retriever, Summarizer, and Visualizer; text mirrors status; the clock uses perspective, physical depth, and counter-rotating mechanical layers rather than a flat face.
## Technical requirements
Orbit consumes session/visualization selectors and capture service; it performs no SQL or provider calls.
## Failure states
Permission denial, interruption, transcription/provider failure, and offline state retain recovery actions.
## Privacy implications
Permission is requested in context; remote transfer is visibly labelled.
## Acceptance criteria
Real recording creates a session; no simulated transcript timer; the clock remains visibly three-dimensional without changing the established colors; reduced motion stops continuous movement.
## Dependencies
Session domain, audio, transcription, runtime, visual system.
## Open implementation decisions
Native live partial transcription provider.
## Verification method
UI tests and physical-device recording check.
