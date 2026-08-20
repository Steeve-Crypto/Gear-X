# Launch Plans and Pricing

## Purpose
Lock the approved Free, Pro, and Max launch configuration while preserving every local Gear X capability independently of subscription state.

## Scope
Public plan names/prices, store identifiers, RevenueCat entitlement/package mapping, cloud allowances, billing-period resets, operational provider-price assumptions, per-user spend ceilings, capability model classes, and consumer presentation.

## Non-goals
Annual products, custom card payments, deploying or enabling xAI, promising unlimited usage, changing local features by plan, or treating RevenueCat client state as authorization.

## User stories
- A Free user retains core Gear X and can use a bounded cloud trial when consent, quota, and global controls allow it.
- A Pro user can purchase the $9.99 monthly plan and see 10 hours of monthly cloud transcription plus a normal active-user intelligence allowance.
- A Max user can purchase the $19.99 monthly plan and see 30 hours of monthly cloud transcription plus three times Pro intelligence capacity.
- Every user can understand remaining allowance and reset timing without seeing tokens or provider economics.
- Exhaustion, downgrade, expiry, refund, provider failure, or billing failure never removes local data or local functionality.

## Functional requirements
- Stable internal plan IDs are `free`, `pro`, and `max`; consumer names are presentation data.
- Pro and Max monthly product IDs are `gearx_pro_monthly` and `gearx_max_monthly` in both stores, mapped with the store as part of the key.
- RevenueCat entitlement IDs are `gearx_pro` and `gearx_max`; the `default` offering uses custom packages `pro_monthly` and `max_monthly`.
- Free grants 30 minutes monthly transcription and limited, independently capped extraction, weaving, summarization, questioning, and answer synthesis.
- Pro grants 10 hours monthly transcription, 300,000 input tokens and 100,000 output tokens internally, plus all cloud capabilities.
- Max grants 30 hours monthly transcription, 900,000 input tokens and 300,000 output tokens internally, plus the same capabilities as Pro.
- Free/Pro/Max per-user provider-spend ceilings are respectively $0.25, $3.00, and $7.00 per authoritative allowance period. They are never shown as benefits.
- Paid allowance periods begin at the verified store transaction period start and reset at the verified period end. Free uses a server UTC calendar month. Client clocks, reinstall, and device IDs never reset usage.
- Private remains local-only. Balanced prefers local/device. Quality may prefer entitled cloud. Developer permits local developer providers but never bypasses the same hosted-cloud entitlement.

## Technical requirements
- Postgres plan rows are the economic authority. Product mappings use `(store, product_id)` so identical Apple/Google product IDs remain unambiguous.
- Intelligence reservations separately meter conservative input and output ceilings. Completion stores provider-reported input/output and actual cost where available.
- Plan cost is estimated using server-side per-model-class prices; final enforcement uses the lower-level global controls as a second boundary.
- Current planning assumptions are REST speech-to-text at $0.10/hour, standard text at $1.25/million input and $2.50/million output, and higher-quality text at $2.00/million input and $6.00/million output. These are mutable operational inputs and must be reviewed before provider enablement.
- Worst-case higher-quality modeled totals are: Free $0.20, Pro $2.20, and Max $6.60, leaving margin below the approved hard caps.
- Routine extraction, summaries, and question refinement use `standard`; complex weaving and evidence synthesis may use `premium`. Concrete model names remain server environment configuration.
- Global cloud defaults remain disabled with zero budgets. No migration enables xAI or invents production global budgets.
- Free abuse is bounded by authenticated per-user metering, conservative anonymous-signup IP throttling, capability/rate ceilings, and global budgets. Device identity is not trusted; stronger attestation remains a deployment decision.

## Failure states
Unknown/mismatched store product, missing entitlement mapping, stale or replayed billing event, missing billing-period timestamp, quota or per-user spend exhaustion, global budget or kill-switch denial, provider-price drift, offline billing, restore pending, and store downgrade effective at a later period.

## Privacy implications
Plan and usage metadata remain server-side and content-free. Purchase state does not upload or delete local SQLite knowledge. Remote content still requires persisted consent after entitlement succeeds.

## Acceptance criteria
- Database fixtures expose exactly Free, Pro, and Max with approved products, prices, transcription ceilings, token ceilings, capability limits, model classes, and spend caps.
- The same product string can map independently to Apple and Google.
- Paid usage resets from verified billing-period dates; Free resets on the server month boundary.
- Free/Pro/Max reservations fail closed at $0.25/$3/$7 and separate input/output ceilings.
- Consumer UI renders all approved plan messages, current plan, percent/time remaining, reset timing, purchase, restore, manage, pending, and readable error states.
- Mode/provider routing cannot override server entitlement, and local fallback remains tested.

## Dependencies
Server-authoritative entitlement migration, RevenueCat billing adapter/webhooks, Supabase Auth, provider routing, consent settings, usage accounting, App Store Connect, and Google Play Console.

## Open implementation decisions
Production global daily/monthly budgets, final provider/model enablement, Apple/Google grace settings, tax/territory availability, anonymous anti-abuse attestation, and whether future annual products are approved.

## Verification
Run plan/mapping/economics/period/lifecycle backend tests, purchase/restore/downgrade/mode/fallback/UI tests, full validation, Expo Doctor, Expo dependency check, Android export, and client bundle secret scan. Store products, RevenueCat offering, live webhooks, signed purchases, Supabase deployment, and provider enablement remain external until directly verified.

## Rollback implications
Set the global cloud control to disabled while retaining plan, billing, and usage history. Roll back the function before database signatures. Never downgrade or delete local user content based on commercial state.
