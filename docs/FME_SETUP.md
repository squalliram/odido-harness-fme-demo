# Harness FME setup for the Odido demo

## Already provisioned (live)

Every object below already exists in **org `IramsDemoOrgFME` → project `Global` → environment `Prod-Default`**.
It was created through the [Harness MCP server](https://developer.harness.io/harness-platform/use-harness-ai/connect-with-ai/index)
(`harness-mcp-v2`), so you only need the SDK keys to run the app against it. The sections below are the
exact specification, so you can recreate the setup in another project or environment.

| Object | Type | Status |
| --- | --- | --- |
| `odido_staff`, `beta_testers` | Standard segments | Created, demo keys added |
| `upgrade_eligible` | Rule-based segment | Created, rules set |
| `odido_upgrade_journey_v2`, `odido_upgrade_offer`, `ops_upgrade_checkout_enabled` | Feature flags | Created, definitions and targeting set |
| Upgrade metrics and offer experiment | Metrics, experiment | Created after the first traffic run (FME needs the event types to exist) |

The flags carry the tags the project's governance policy requires (`component`, `owner`, `service`, `team`),
so the *Feature Flag Policy* check passes. That makes a good talking point for policy-as-code on flag changes.
Create these in one FME project and environment (for example `staging`). All use traffic type `user`.
Names must match exactly: the app refers to them in `src/flags.js`.

SDK versions in this repo support rule-based segments and semver matchers
(browser SDK 1.7, Node SDK 11.12).

## 1. SDK keys

*FME settings → Projects → (your project) → SDK API keys.* Copy the **client-side** key into
`VITE_FME_CLIENT_KEY` and, for bulk traffic, the **server-side** key into `FME_SERVER_SDK_KEY`.
The server-side key is a secret: never ship it to a browser.

## 2. Segments

| Name | Type | Definition |
| --- | --- | --- |
| `odido_staff` | Standard | Add key `odido-emp-0007` |
| `beta_testers` | Standard | Add key `odido-cust-2041` |
| `upgrade_eligible` | Rule-based | `plan` is in list `go10`, `unlimited_start` **and** `usagePct` ≥ `70` **and** `customerType` is in list `consumer` |

Talking point: standard segments are explicit lists (synced from a CDP or CRM via API). Rule-based
segments are evaluated at runtime from attributes, so eligibility stays current without list uploads.

## 3. Feature flags

### `odido_upgrade_journey_v2` (release flag, temporary)

- Treatments: `on`, `off`. **Default treatment: `off`** (served when the flag is killed).
- Targeting rules, in order:
  1. If user **is in segment** `odido_staff` → serve `on`
  2. If user **is in segment** `beta_testers` → serve `on`
  3. If `city` **is in list** `Amsterdam` **and** `customerType` **is in list** `consumer`
     **and** `appVersion` **is greater than or equal to (semver)** `9.6.0` → serve `on`
  4. Default rule → serve `off`
- Live moment in the demo: add `Rotterdam` to rule 3 and save with a comment.
- Progressive rollout moment: change the default rule to *distribute treatments*, for example
  `on` 10% / `off` 90%, then 50/50. Bucketing is deterministic per key, so a customer keeps the same experience.

### `odido_upgrade_offer` (experiment flag)

- Treatments: `standard`, `free_month`, `price_per_day`. **Default treatment: `standard`.**
- Dynamic configuration (key-value or JSON) per treatment. `{plan}`, `{delta}` and `{perDay}` are filled in by the app:

```json
standard:      {"badge":"","headline":"Need more data?","body":"Move to {plan} for €{delta} more per month.","cta":"See upgrade options"}
free_month:    {"badge":"First month free","headline":"Try {plan} free for a month","body":"Then €{delta} more per month. Change your mind in month one at no cost.","cta":"Start my free month"}
price_per_day: {"badge":"Less than a coffee","headline":"{plan} for €{perDay} a day","body":"Stop watching your data balance. Upgrade in one tap.","cta":"Upgrade for €{perDay}/day"}
```

- Targeting rules:
  1. If user **is in segment** `upgrade_eligible` → distribute `standard` 34% / `free_month` 33% / `price_per_day` 33%
  2. Default rule → serve `standard`
- Live moment: edit the `free_month` headline in FME. The banner copy changes in the app with no release.

### `ops_upgrade_checkout_enabled` (operational kill switch, permanent)

- Treatments: `on`, `off`. **Default treatment: `off`**, default rule serves `on`.
- *Kill* the flag in the demo: every customer gets the default treatment `off` and plan changes pause.

## 4. Metrics

*Metrics → Create metric*, traffic type `user`:

| Metric | Measure | Event | Desired impact | Category |
| --- | --- | --- | --- | --- |
| Upgrade conversion rate | Percent of unique users | `upgrade.completed` | Increase | Key metric |
| Upgrade revenue per user | Sum of event values per user | `upgrade.completed` (value = extra €/month) | Increase | Key metric |
| Upgrade failure rate | Percent of unique users | `upgrade.failed` | Decrease | Guardrail |
| Upgrade journey load time | Average of event values per user | `upgrade.load_time_ms` | Decrease | Guardrail |

Add an **alert policy** to the two guardrails (for example, alert on a relative degradation of 10% or more)
and notify a Slack channel or email. For automatic rollback, point an FME alert webhook at an automation
(for example a Harness pipeline) that kills the flag through the API.

## 5. Experiment

*Experiments → Create experiment* on `odido_upgrade_offer`, targeting rule `upgrade_eligible`,
baseline `standard`, comparisons `free_month` and `price_per_day`. Key metrics: conversion rate and revenue
per user. Guardrails: failure rate and load time.

## 6. Seed data before the demo

FME needs enough samples per treatment before it calculates significance (355 by default).

```bash
npm run traffic -- --users 3000                 # healthy baseline, run the day before
npm run traffic -- --users 1500 --regression    # optional: a regression to show the guardrail alert
```

Metric results are recalculated periodically. Seed the day before so *Metrics impact* and the experiment
have results, and use the *Recalculate* option if you need fresh numbers.

## 7. Governance to show (optional)

- Environment permissions and **approval flows** on production changes.
- **Change comments** and the audit log on every flag.
- Flag owners, tags and the *rollout status* (for example "Ramping", "Released 100%") for flag hygiene.
