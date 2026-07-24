# Mobile UX Specification

## Purpose
Define an understandable voice-first product on small screens.
## Scope
Navigation, states, controls, accessibility, forms, lists, confirmations, and responsive behavior.
## Non-goals
Desktop-density dashboards or animation-only status communication.
## User stories
- I can start and stop listening with one clear control.
- I can understand state with text, icons, and motion.
- I can use large text, screen readers, and reduced motion.
## Functional requirements
Five primary tabs, stack details/settings, 44-point targets, labelled controls, confirmations for destructive actions, and visible progress/errors.
## Technical requirements
Safe areas, scalable text, list virtualization/pagination, keyboard avoidance, focus order, and non-color-only states.
## Failure states
Blocked permission, offline provider, empty result, interrupted capture, and destructive-operation failure each have recovery actions.
## Privacy implications
Remote indicators and retention consequences appear at the decision point.
## Acceptance criteria
Primary flows are usable with reduced motion and screen reader labels; no hidden essential clock-only state.
## Dependencies
Visual system and feature specs.
## Open implementation decisions
Tablet-specific split views after beta.
## Verification method
UI tests, accessibility inspection, Android/iOS manual checklist.
