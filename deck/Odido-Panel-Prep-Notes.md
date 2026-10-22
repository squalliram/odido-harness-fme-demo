# Personal prep notes (not for distribution)

Ali's advice from the sync, turned into checks for Friday.

## The big one: sell yourself, not Harness
- They already know FME. They are judging how you run a room: discovery, story, objection handling, close.
- Play to your strengths. You are the FME specialist (Split's first EMEA SE, Specialist SE of the Quarter, Tech Show London keynote). Let that show through confidence and depth, not through feature volume.
- Keep the energy and curiosity. Ask, listen, use their words back to them.

## Story, not feature dump
- Every demo moment ends on the anchor line (see the brief, section 6). If you can't say why a feature matters to Odido, skip it.
- One customer story told well beats four mentioned. Use the story structure: situation, what we did, outcome, what it meant. Fill in the bracketed placeholders on slide 15 with your real stories and pick one, ideally the Dutch bank, to tell in full.

## Our Understanding: go deeper technically
Questions to ask the technical personas (Ali, Rich):
- How many flags do you have in LD today, and how many are older than 90 days?
- Client-side or server-side evaluation in the app? Which SDKs: iOS, Android, React, Java, Node?
- What do you use for product analytics and the data warehouse? Where do conversion events live today?
- How long from an experiment idea to a decision? Who does the analysis?
- When did a release last hurt conversion or errors, and how did you find out?
- How are flag changes approved in production? What did the breach change about that?
- What are the security requirements for a new vendor (data residency, SSO, pen tests)?

Questions for the business personas (Alex, Ryan):
- Which journey would you most like evidence on this year?
- How do you measure digital success today: app revenue, NPS, call deflection?
- What would make this a "yes" in six weeks?

## Explaining the platform simply
- Light switch vs light switch with a meter (LD vs FME).
- "Rules travel to the app once, decisions happen on the device, results flow back and FME does the maths."
- "If Harness is down, the app keeps working with safe defaults."

## Business angle for Alex
- ROI formula, not a number: eligible customers × uplift × value per upgrade. Ask him to plug in his own numbers.
- Migration: new flags in FME, live flags in waves, stale flags deleted. No big bang, no release freeze.

## Before Friday
- [ ] Add the SDK keys to `odido-fme-upgrade/.env` and create the FME objects (`docs/FME_SETUP.md`).
- [ ] Run `npm run traffic -- --users 3000` the day before. Check Metrics impact and the experiment have results.
- [ ] Reset: Rotterdam not in the city rule, nothing killed, regression box unticked.
- [ ] Replace the bracketed placeholders on slide 15 with real stories you're allowed to share.
- [ ] Send the email brief 24 to 48 hours ahead.
- [ ] Rehearse the 15-minute demo twice, timed, once with a forced network failure (use the backup slides).
