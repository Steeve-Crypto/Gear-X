# 016 Launch Plan Configuration
## Objective
Lock approved Free, Pro, and Max economics across server authority, store mapping, billing UI, documentation, and tests without deploying xAI.
## Files involved
Launch-plan and entitlement specs, Supabase plan/metering migration and function, RevenueCat mapping/adapter, subscription UI/domain, billing/deployment/release documents, and backend/UI tests.
## Required changes
Seed approved launch plans and products; add independent input/output, per-capability, billing-period, and per-user cost enforcement; add capability model classes; show plan comparison, monthly usage/reset, purchase/restore/manage states; preserve local fallback and server authority.
## Constraints
No annual plan, custom card payment, live deployment, client authority, customer-visible provider economics, xAI enablement, local feature gating, or invented production global budget.
## Acceptance criteria
Free/Pro/Max configuration and store mappings match approval; paid resets use verified billing periods; all cost/token/duration caps fail closed; plan purchase/restore/downgrade and rendering tests pass; validation/export/secret scan pass.
## Tests
Focused plan economics, mapping, billing-period, lifecycle, spoofing, mode/fallback, adapter, and UI tests followed by the full repository gates.
## Rollback considerations
Cloud remains disabled by default. Function rollback precedes database signature rollback; billing and usage reconciliation history is retained.
## Completion status
Implemented and locally verified. Free/Pro/Max plans, exact cross-store and RevenueCat mappings, independent capability/input/output limits, verified billing-period resets, pending downgrade semantics, per-user spend caps, standard/premium capability routing, consumer plan/usage/purchase UI, documentation, full validation, Android export, and secret scan are complete. Store/RevenueCat/Supabase creation, signed purchases, live webhooks, physical devices, reviewed production global budgets, and provider enablement remain external and are not claimed complete.
