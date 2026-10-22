# Odido x Harness FME: plan upgrade journey

A demo app for a fictional engagement with **Odido** (Dutch mobile operator, about 7.5 million
customers). It shows how Harness Feature Management & Experimentation (FME) lets Odido release a new
in-app **plan upgrade journey** gradually, target it precisely, measure it, and run an experiment on
the upgrade offer, all from one platform.

| Capability | Where you see it in the demo |
| --- | --- |
| Feature flags and instant rollback | `odido_upgrade_journey_v2` switches the whole journey. Kill it and everyone is back on v1 in seconds. |
| Kill switch (ops flag) | `ops_upgrade_checkout_enabled` pauses all plan changes without a deploy. |
| Segments | `odido_staff` and `beta_testers` (standard), `upgrade_eligible` (rule-based). |
| Targeted / geo rollout | Custom attribute `city` sent with the SDK call: Amsterdam first, then add Rotterdam live. Also `customerType` and `appVersion` (semver). |
| Dynamic configuration | Offer headline, body and CTA come from treatment configs, no app release needed. |
| Metrics and guardrails | `client.track()` sends `upgrade.viewed`, `upgrade.completed` (value = extra €/month), `upgrade.failed`, `upgrade.load_time_ms`. |
| Experimentation | `odido_upgrade_offer`: `standard` vs `free_month` vs `price_per_day` for eligible customers. |

## How it works

```
Browser (React + @splitsoftware/splitio-browserjs)
  key = opaque customer id, attributes = { city, customerType, plan, usagePct, appVersion, isEmployee, ... }
  getTreatmentsWithConfig()  -> evaluated locally in the SDK (rules are cached, updates are streamed)
  track()                    -> events batched to Harness FME
  impression listener        -> shows the rule label ("why") in the inspector panel
```

- The SDK downloads the rollout rules once and evaluates **locally**: no network call per flag, and the
  attributes are not sent to Harness. Only the key, flag, treatment and rule label go back as impressions.
- Rule changes are **streamed** to the SDK, so a change in Harness FME reaches the app in seconds.
- When FME cannot evaluate (not ready, flag missing, network blocked), the SDK returns `control`. The
  app maps that to a deliberate safe treatment for each flag (`src/flags.js`).

## Prerequisites

- Node.js 20 or later
- A Harness FME project with an environment and its **client-side** SDK key. The live demo objects are in
  `IramsDemoOrgFME` / `Global` / `Prod-Default` (see [`docs/FME_SETUP.md`](docs/FME_SETUP.md))
- Optional: the **server-side** SDK key for the same environment, to send bulk traffic with `npm run traffic`

## Setup

```bash
cd odido-fme-upgrade
npm install
cp .env.example .env     # then add VITE_FME_CLIENT_KEY (and FME_SERVER_SDK_KEY for traffic)
```

1. Create the segments, flags and metrics in Harness FME: see [`docs/FME_SETUP.md`](docs/FME_SETUP.md).
2. Run the app: `npm run dev` and open http://localhost:5173 (restart after changing `.env`).
3. Seed metric data before the demo: `npm run traffic -- --users 3000`.

Offline rehearsal: `VITE_FME_CLIENT_KEY=localhost npm run dev` runs with fixed treatments and no network.
Targeting is not evaluated in this mode, so use it only to practise the UI.

## Demo runbook

See [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) for the full talk track. In short:

1. **Targeting.** Switch personas. Fleur (staff) and Daan (beta) get v2 through segments. Sanne gets it because
   `city = Amsterdam`. Mohammed (Rotterdam), Lotte (old app version) and Bakkerij Smit (business) stay on v1.
   The inspector shows the rule label for each.
2. **Geo expansion, live.** In FME add `Rotterdam` to the city rule and save. Mohammed flips to v2 without a refresh.
   Use the *Custom customer* persona and set `city` to `London` to show any attribute value works.
3. **Kill switch.** Kill `ops_upgrade_checkout_enabled`. Plan changes pause instantly and the app degrades gracefully.
4. **Measure.** Open the flag's *Metrics impact* tab: conversion, revenue per user, failure rate, load time.
5. **Guardrail.** Tick *Inject a regression*, run the traffic burst (or `npm run traffic -- --users 1500 --regression`).
   The failure-rate and load-time guardrails degrade and the alert policy fires. Kill the flag: everyone is on v1.
6. **Experiment.** Open the `odido_upgrade_offer` experiment: `free_month` lifts conversion against `standard`.
7. **Audit.** Show the flag's audit log: who changed what, when, with the change comment.

## Project layout

```
src/
  flags.js                 flag names, safe fallbacks, event types, offer config fallbacks
  fme.js                   SDK factory, per-customer client hook, impression listener (rule labels)
  personas.js              demo customers and their SDK attributes
  plans.js                 Odido-style plans and upgrade quotes
  simulation.js            behaviour model shared by the app and the traffic script
  telemetry.js             the track() calls behind the metrics
  components/
    PhoneApp.jsx           Odido-style app: home, v1 and v2 upgrade journeys, offer banner
    FlagInspector.jsx      treatment, rule label and config for the current customer
    AttributeEditor.jsx    edit SDK attributes live (city, plan, appVersion...)
    DemoControls.jsx       regression toggle and 40-customer traffic burst
    ActivityLog.jsx        streamed flag changes and tracked events
scripts/
  simulate-traffic.mjs     bulk traffic with the server-side SDK for significant results
docs/
  FME_SETUP.md             exact segments, flags, metrics and experiment to create
  DEMO_SCRIPT.md           talk track, timings and fallback plan
```

Odido is used as a fictional prospect. The plans, prices and app screens are illustrative, not Odido's.
