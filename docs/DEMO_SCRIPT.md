# Demo script: Tell → Show → Tell

About 15 minutes of live demo inside a 25-minute slot. Every beat follows the same pattern:

1. **Tell** (why it matters to Odido, in one or two sentences)
2. **Show** (exact clicks in the Odido app and in Harness FME)
3. **Tell again** (the business value, tied to a metric from the Our Understanding slide)

If a beat runs long, skip the ones marked *optional*. Never skip the "Tell again": that is the part the
business audience remembers.

## Setup: tabs and screen layout

Put the Odido app on the left half of the screen and Harness on the right.

| Tab | What | How to get there |
| --- | --- | --- |
| 1 | Odido app | `npm run dev` → http://localhost:5173. The top-right badge must say **Connected: streaming updates**. |
| 2 | Release flag | Harness → **Feature Management & Experimentation** → org `IramsDemoOrgFME`, project `Global` → **Feature flags** → `odido_upgrade_journey_v2` → environment **Prod-Default** → **Definition** tab |
| 3 | Kill switch | **Feature flags** → `ops_upgrade_checkout_enabled` → **Prod-Default** |
| 4 | Segments | **Segments** → `upgrade_eligible` (rule-based) → **Prod-Default** |
| 5 | Experiment | **Experiments** → `odido_upgrade_offer_test` |
| 6 | Code | Editor open on `src/flags.js`, with `src/fme.js` and `src/telemetry.js` in tabs |

Live objects (all in `IramsDemoOrgFME` / `Global` / `Prod-Default`):

- Flags: `odido_upgrade_journey_v2` (release), `odido_upgrade_offer` (experiment), `ops_upgrade_checkout_enabled` (kill switch)
- Segments: `odido_staff`, `beta_testers` (standard lists), `upgrade_eligible` (rule-based)
- Metrics: `upgrade_conversion_rate`, `upgrade_revenue_per_user` (key), `upgrade_failure_rate`, `upgrade_journey_load_time` (guardrails)
- Experiment: `odido_upgrade_offer_test`

## Timeline at a glance

| # | Beat | Time | Required capability it proves |
| --- | --- | --- | --- |
| 0 | Set the scene | 1 min | (context) |
| 1 | Target precisely | 3 min | % rollouts and targeting by segment, city, staff, beta |
| 2 | Expand to Rotterdam, live | 1.5 min | % rollouts and targeting |
| 3 | Progressive % rollout (*optional*) | 1 min | % rollouts |
| 4 | Kill switch | 1.5 min | Instant kill switch, no deploy or app-store release |
| 5 | Under the hood: the code | 3 min | (technical merit, for developers and architects) |
| 6 | Measure every release | 2 min | Release monitoring and guardrails |
| 7 | Learn what sells: the experiment | 2 min | Built-in experimentation on the same flags |
| 8 | Prove control: governance | 1 min | Governance: approvals, policy-as-code, audit, RBAC |

---

## Beat 0: Set the scene (1 min)

**Tell.**
> "This is the plan upgrade journey in the Odido app: the screen where a customer moves to a bigger plan.
> It is one of the few screens that adds revenue every time it works, and costs revenue every time it breaks.
> Your team rebuilt it. The question is not *can we ship it*, it's *how do we ship it without risking that revenue*."

**Show.**
- Tab 1. Point at the top-right badge: **Connected: streaming updates**.
- Point at the right-hand panel **What Harness FME decided for…**: three flags, each with a treatment and a rule label.

**Tell again.**
> "Same build for every customer. Harness decides who sees what, and tells you why. Let me show you how."

---

## Beat 1: Target precisely (3 min)

**Tell.**
> "Today, with on/off flags, a release is all or nothing. What you told us you want is to release to the right
> people first: staff, then beta testers, then one city, then a percentage."

**Show.**
1. Tab 1, persona bar. Click through the customers, one at a time, and read the rule label in the right panel:
   - **Fleur** (Odido employee) → new journey, label `in segment odido_staff`
   - **Daan** (beta tester) → new journey, label `in segment beta_testers`
   - **Sanne** (Amsterdam) → new journey, label `city in list [Amsterdam] and customerType in list [consumer] and appVersion >= semver 9.6.0`
   - **Lotte** (Amsterdam, old app 9.4.0) → current journey, `default rule`
   - **Bakkerij Smit** (business customer) → current journey, `default rule`
2. Tab 2 (`odido_upgrade_journey_v2` → **Definition**). Scroll through the **targeting rules**: they read top to
   bottom exactly like the labels you just saw. Point at:
   - rules 1 and 2: *is in segment* `odido_staff` / `beta_testers`
   - rule 3: `city` is in list `Amsterdam` AND `customerType` is in list `consumer` AND `appVersion` ≥ `9.6.0` (semver)
   - **Default rule**: `off`
3. Tab 4 (`upgrade_eligible`). Show it is **rule-based**: plan in `go10`, `unlimited_start` AND `usagePct` ≥ 70
   AND consumer. "No list uploads: membership is worked out from the customer's attributes at the moment of the call."

**Tell again.**
> "Lotte proves the point: same city, but an old app version, so she is protected from a release her app
> can't handle. That's how you raise **release frequency** while controlling the **% of customers exposed**.
> And those attributes never leave the device: the SDK evaluates locally."

---

## Beat 2: Expand to Rotterdam, live (1.5 min)

**Tell.**
> "Amsterdam looks good. Marketing wants Rotterdam next. Today that's a ticket and a release. Watch."

**Show.**
1. Tab 1: select **Mohammed** (Rotterdam). Current journey, `default rule`.
2. Tab 2: in rule 3, add `Rotterdam` to the `city` list → **Review changes** → add the comment
   *"Expand upgrade v2 to Rotterdam"* → **Save**.
3. Tab 1, without refreshing: Mohammed flips to the new journey. The **Activity log** shows the streamed flag change.
4. *(Optional)* Select **Custom customer** and, in **SDK attributes**, set `city` to `London`. "Any attribute works:
   region, store, network cell, tariff."

**Tell again.**
> "A business decision, made by the business, live in seconds. No deploy, no app-store review. That's more
> features delivered with less impact on customers."

---

## Beat 3: Progressive % rollout (*optional*, 1 min)

**Tell.**
> "Once the cities look healthy you open it up by percentage, not by guesswork."

**Show.**
- Tab 2: change the **Default rule** from `off` to **Distribute treatments**: `on` 10% / `off` 90% → **Review changes** → comment → **Save**.
- "Bucketing is deterministic per customer key: a customer doesn't flip back and forth between visits."
- Change it back to `off` 100% afterwards, so the rest of the demo stays predictable.

**Tell again.**
> "10%, 25%, 50%, 100%, each step backed by data, which is what I'll show you in a minute."

---

## Beat 4: Kill switch (1.5 min)

**Tell.**
> "It's 2am and billing has an incident. Today: a hotfix, a store release, days to recover. With Harness: one button."

**Show.**
1. Tab 1: any customer, open the upgrade screen. Plan changes are available.
2. Tab 3 (`ops_upgrade_checkout_enabled`): click **Kill** → confirm with the comment *"Billing incident: pause plan changes"*.
3. Tab 1: within seconds the app shows plan changes as paused. It degrades gracefully, nothing crashes.
4. Tab 3: **Restore** the flag. Tab 1 recovers.

**Tell again.**
> "That's **mean time to recover** going from days to seconds, and fewer customer-facing incidents. On-call can do it,
> no engineer needs to push code."

---

## Beat 5: Under the hood: the code (3 min)

**Tell.**
> "For the developers and architects: here is everything the app needed to do all that."

**Show.** Tab 6, three files, about one minute each:

1. **`src/fme.js`: setup.** `SplitFactory({ core: { authorizationKey, key } })`: one client-side key and an opaque
   customer key. The **impression listener** records the rule label, which is the "why" you saw in the panel.
2. **`src/flags.js`: evaluation and safe fallbacks.** One call: `client.getTreatmentsWithConfig(FLAG_NAMES, attributes)`.
   Point at the `control` mapping: "If Harness is unreachable, the SDK returns `control` and every flag maps it to a
   deliberate safe value: current journey, standard offer, plan changes on. The app never breaks because of the flag
   platform." Point at the **dynamic config**: the offer copy comes from Harness, not from the code.
3. **`src/telemetry.js`: measurement.** `client.track('user', 'upgrade.completed', delta, props)`. "Both journeys send the
   same events, so Harness compares like with like. That's the whole integration for the metrics you're about to see."

Architecture line for the architects:
> "Rules download once and are cached on the device; changes stream in seconds; evaluation is local, in microseconds,
> with no network call per flag. Only the key, flag, treatment and rule label go back as impressions."

**Tell again.**
> "Three small files: no vendor lock-in in your business logic, and nothing that can take the app down. That's how
> you adopt this without slowing your teams."

---

## Beat 6: Measure every release (2 min)

**Tell.**
> "Shipping safely is half the story. The other half is knowing whether the release actually *worked*. Today you
> find out when customers complain."

**Show.**
1. Tab 2: open the **Metrics impact** tab on `odido_upgrade_journey_v2`.
2. Walk the scorecard, `on` vs `off`:
   - `upgrade_conversion_rate`: about 7.4% → 10.5%
   - `upgrade_journey_load_time`: about 1.1 s → 0.5 s
   - `upgrade_failure_rate`: flat
3. *(Optional, guardrail story)* Open **Metrics** → `upgrade_failure_rate` → **Alert policies**: "If failures
   degrade by more than 10% on any rollout, this alerts the team in Slack, and a webhook can kill the flag
   automatically." If you want to show it firing, tick **Inject a regression** in the app's **Demo controls** and
   click **Simulate 40 Dutch customers**; the failures appear in the table immediately (the alert itself fires on
   the next metric calculation).

**Tell again.**
> "Every release gets a scorecard automatically. That lowers your **change failure rate**, because problems are
> caught on the first few percent of traffic, not after 7 million customers have seen them."

---

## Beat 7: Learn what sells: the experiment (2 min)

**Tell.**
> "Now the question your commercial team actually cares about: which offer sells more upgrades? Today that's an
> argument. Here it's an experiment, on the same flag platform and the same events."

**Show.**
1. Tab 1: switch between **Mohammed** (`price_per_day`), **Custom customer** (`free_month`) and **Daan** (`standard`).
   The offer banner changes: the copy is the flag's dynamic config.
2. Tab 5 (`odido_upgrade_offer_test`): point at the hypothesis, baseline `standard`, comparisons `free_month` and
   `price_per_day`, and the scope: only `upgrade_eligible` customers.
3. Results: `free_month` lifts `upgrade_conversion_rate` from about 13.8% to 24.3% and revenue per customer with it,
   statistically significant. Guardrails (failure rate, load time) are flat.
4. *(Optional)* Tab for `odido_upgrade_offer` → **Definition** → edit the `free_month` headline → save. Show the banner
   copy change in the app: marketing owns the copy, no release.

**Tell again.**
> "That's a pricing decision made on evidence in days, not weeks: more **experiments per quarter** and faster
> **days to decision**. One winning experiment on one journey can pay for the platform."

---

## Beat 8: Prove control: governance (1 min)

**Tell.**
> "Everything I did in the last ten minutes is recorded and governed."

**Show.**
- Tab 2: **Audit logs**. The Rotterdam change with its comment: who, when, what, why.
- Mention the policy check: the flags carry the tags your governance policy requires (`component`, `owner`, `service`,
  `team`); a flag without them is flagged at creation. Approval flows can be required on Prod-Default changes.

**Tell again.**
> "Every change has a who, when and why, and policy-as-code stops ungoverned flags reaching production. That's the
> **audited changes** and **security findings** line on your scorecard."

**Close the demo, back to the deck:**
> "So: release to the right people first, roll back in seconds, measure every release, and learn what sells, all
> from one platform. Let me show you where we've done this before."

---

## Before the call

- [ ] `npm run dev`. The badge says **Connected: streaming updates**.
- [ ] Reset state in Prod-Default: `Rotterdam` **not** in rule 3, default rule `off` 100%, no flags killed.
- [ ] In the app: **Inject a regression** unticked, no attribute overrides (use **Reset** in *SDK attributes*).
- [ ] Experiment results are fresh. Use **Recalculate** on the experiment if the numbers are stale, and check the
      figures on slide 7 match what you will show.
- [ ] Top up traffic if needed: `npm run traffic -- --users 3000` the night before.
- [ ] Fallback if the network fails: `VITE_FME_CLIENT_KEY=localhost npm run dev` (fixed treatments, UI only) and the deck.

## If something goes wrong

| Problem | Recovery line and action |
| --- | --- |
| Badge says *Offline: safe fallbacks* | "Perfect timing: this is what happens when Harness is unreachable. The app keeps working on safe defaults." Then switch to localhost mode. |
| Mohammed doesn't flip after saving | Check you edited **Prod-Default**, not another environment. Streaming takes up to a few seconds. Switch persona and back. |
| Experiment shows "needs more data" | "This is the stats engine refusing to call a winner too early: that protects you from false positives." Show the sample sizes. |

## Questions to expect

- **"How is this different from LaunchDarkly?"** Measurement and experimentation are built into the same flags and events,
  with guardrail alerts on every rollout. And FME is part of the Harness platform (CI/CD, pipelines, policy as code), so
  a release can be verified and rolled back end to end. Don't attack LD; talk about what Odido gets.
- **"What about migration?"** In waves: new flags start in FME, live flags move team by team, stale flags are deleted, not
  migrated. OpenFeature providers keep code vendor-neutral.
- **"Privacy / GDPR?"** Evaluation is local in the SDK. Attributes are not sent to Harness. Keys can be opaque IDs.
  EU data residency is available.
- **"Performance on mobile?"** Rules are cached on the device, updates stream, evaluations take microseconds, and there is
  a safe fallback (`control`) if the network is gone.
- **"Can an AI agent manage this?"** Yes: everything in this demo was provisioned through the Harness MCP server
  (flags, segments, metrics, experiment) and passed the same governance policies as a human change.
