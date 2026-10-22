# Demo talk track (about 12 minutes inside a 30-40 minute role play)

The demo exists to prove three things Odido cares about. Each step ends on a business outcome, not a feature.

| # | Story beat | What you do | Line to land |
| --- | --- | --- | --- |
| 0 | Set the scene (30s) | Show the Odido-style app as Sanne in Amsterdam. | "This is the plan upgrade journey: one of the few screens that adds revenue every time it works." |
| 1 | Target precisely (2 min) | Click through Fleur, Daan, Sanne, Mohammed, Lotte, Bakkerij Smit. Point at the rule label. | "Staff first, then beta, then Amsterdam consumers on the new app. Same build for everyone. FME decides who sees what, and tells you why." |
| 2 | Expand by geography, live (1 min) | In FME add `Rotterdam` to the city rule, save with a comment. Mohammed flips with no refresh. Use *Custom customer* → `London`. | "City is just an attribute we pass in the SDK call. Region, store, network cell, tariff: same mechanism. No new deploy." |
| 3 | Stay safe (2 min) | Kill `ops_upgrade_checkout_enabled`. Then restore it. | "If billing has an incident at 2am, on-call presses one button. The app degrades gracefully. No hotfix, no app-store release." |
| 4 | Measure every release (2 min) | Open *Metrics impact* on `odido_upgrade_journey_v2`. | "Every release gets a scorecard automatically: conversion, revenue per customer, errors, speed. Teams stop arguing about whether it worked." |
| 5 | Catch a bad release (2 min) | Tick *Inject a regression* and run the burst (or show the pre-seeded regression). Show the guardrail alert, then kill the flag. | "The guardrail catches it on the first percentage of traffic, before it reaches 7 million customers." |
| 6 | Learn what sells (2 min) | Open the `odido_upgrade_offer` experiment. | "Free first month beats the standard offer on conversion and revenue per user. That's a pricing decision made on evidence, from the same flag." |
| 7 | Prove control (30s) | Audit log and change comments. | "Every change has a who, when and why. That matters after this year." |

## Before the call

- `npm run traffic -- --users 3000` the day before. Check *Metrics impact* and the experiment have results.
- Reset the demo state: Rotterdam **not** in rule 3, all flags unkilled, regression box unticked.
- Have FME open in one tab (flag `odido_upgrade_journey_v2`) and the app in another, side by side.
- Fallback: screenshots of each step in the deck, and `VITE_FME_CLIENT_KEY=localhost npm run dev` for the UI.

## Questions to expect

- **"How is this different from LaunchDarkly?"** Measurement and experimentation are built into the same flag and
  events, with guardrail alerts on every rollout, and FME is part of the Harness platform (CI/CD, pipelines, cloud cost)
  so a release can be verified and rolled back end to end. Don't attack LD; talk about what Odido gets.
- **"What about migration?"** Flags are migrated in waves, starting with new flags in FME. OpenFeature providers let
  code stay vendor-neutral. Old LD flags retire naturally as features reach 100%.
- **"Privacy / GDPR?"** Evaluation is local in the SDK. Attributes are not sent to Harness. Keys can be opaque IDs.
  EU data residency is available.
- **"Performance on mobile?"** Rules are cached on the device, updates are streamed, evaluations take microseconds,
  and there's a safe fallback (`control`) if the network is gone.
