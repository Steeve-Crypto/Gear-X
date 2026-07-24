# Visual System Specification

## Purpose
Preserve and mature the living mechanical clock-planet identity.
## Scope
Tokens, typography, spacing, controls, list rows, states, elevation, iconography, and clock behavior.
## Non-goals
Generic SaaS cards, bright gradients, cartoon gears, excessive glow, or random motion.
## User stories
- I feel that the machine is alive while still understanding its state.
- Reduced motion keeps the interface stable without losing information.
## Functional requirements
Obsidian surfaces, brass activation, ivory text, engraved borders, reusable primitives, and agent-specific clock signals.
## Technical requirements
Central tokens; state-driven visualization input; bounded animation count; low-performance and reduced-motion modes.
## Failure states
Low contrast, clipped text, inaccessible state, dropped-frame overload, and decorative disconnected animation.
## Privacy implications
Visual status never exposes transcript content on locked/background views.
## Acceptance criteria
Screens use tokens; clock activity maps to actual agents; state is also textually described.
## Dependencies
Mobile UX, visualization state.
## Open implementation decisions
Custom bundled typeface and GPU profiling on older Android devices.
## Verification method
Screenshot review, contrast checks, reduced-motion and low-performance device tests.
