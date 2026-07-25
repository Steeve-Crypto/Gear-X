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
Obsidian surfaces, brass activation, ivory text, engraved borders, reusable primitives, agent-specific clock signals, and a visibly three-dimensional clock-planet with mechanical depth rather than a flat diagram.
## Technical requirements
Central tokens; state-driven visualization input; perspective-compressed orbital planes, beveled/extruded gear layers, bounded animation count, and low-performance/reduced-motion modes. The 3D treatment must retain the established palette.
## Failure states
Low contrast, clipped text, inaccessible state, dropped-frame overload, and decorative disconnected animation.
## Privacy implications
Visual status never exposes transcript content on locked/background views.
## Acceptance criteria
Screens use tokens; clock activity maps to actual agents; state is also textually described; the clock reads as a layered mechanical object at rest and in motion without changing its palette.
## Dependencies
Mobile UX, visualization state.
## Open implementation decisions
Custom bundled typeface and GPU profiling on older Android devices.
## Verification method
Screenshot review, contrast checks, reduced-motion and low-performance device tests.
