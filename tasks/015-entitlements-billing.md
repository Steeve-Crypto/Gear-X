# 015 Entitlements and Billing
## Objective
Gate Gear X-hosted cloud enhancements with verified subscription capabilities while preserving the complete eligible local experience.
## Files involved
Entitlement/billing specs, Supabase migrations/function, provider/auth/billing services, settings subscription UI, configuration, tests, release and handoff documents.
## Required changes
Server plan/lifecycle authority, RevenueCat webhook mapping, duration/token/cost metering, global kill switch, identity restore design, entitlement-aware provider status/fallback, consumer subscription actions, and security/lifecycle tests.
## Constraints
No final prices or marketing names; no client-authoritative billing; no xAI dependency for local features; no provider/store secrets in the app; no live purchase/deployment claim without evidence.
## Acceptance criteria
Baseline/spoofed/expired/revoked users cannot consume hosted cloud; configured paid capabilities and lifecycle dates work; metering and cost guards are atomic; modes fall back locally; restore/upgrade/manage surfaces exist; all automated gates pass.
## Tests
Backend entitlement, lifecycle, webhook, spoofing, duration/token, budget/rate tests; provider-mode fallback; billing adapter/UI fixtures; validation, Doctor, bundle and secret scans.
## Rollback considerations
Global cloud disablement preserves all local data and behavior. Database rollback follows function rollback and retains billing/usage records required for reconciliation.
## Completion status
In progress. Specification and gap analysis are complete. Implementation, local verification, RevenueCat/store configuration, Supabase deployment, signed-build purchase tests, and live webhook/provider verification remain separately tracked.
