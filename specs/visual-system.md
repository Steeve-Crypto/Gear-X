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
Obsidian surfaces, brass activation, ivory text, engraved borders, reusable primitives, agent-specific clock signals, and a hardware-rendered 3D celestial body compounded from interlocking volumetric gears rather than a clock face.
## Technical requirements
Central tokens; state-driven visualization input; Three.js geometry rendered through React Three Fiber and Expo GL; extruded teeth, bores, bevels, physically based metal materials, real lights, depth camera, bounded animation count, and low-performance/reduced-motion modes. The 3D treatment must retain the established palette.
## Failure states
Low contrast, clipped text, inaccessible state, dropped-frame overload, and decorative disconnected animation.
## Privacy implications
Visual status never exposes transcript content on locked/background views.
## Acceptance criteria
Screens use tokens; clock activity maps to actual agents; state is also textually described; the celestial body has actual mesh depth, camera perspective, lighting, and compound gears at rest and in motion without changing its palette.
## Dependencies
Mobile UX, visualization state.
## Open implementation decisions
Custom bundled typeface and GPU profiling on older Android devices.
## Verification method
Screenshot review, contrast checks, reduced-motion and low-performance device tests.
