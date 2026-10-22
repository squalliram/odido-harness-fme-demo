// Sends realistic synthetic traffic to Harness FME with the server-side SDK, so the Metrics impact tab
// and the offer experiment have enough samples (FME needs at least 355 per treatment by default).
//
//   npm run traffic -- --users 3000             healthy rollout
//   npm run traffic -- --users 1500 --regression  v2 regression: failures and slow loads
import { SplitFactory } from '@splitsoftware/splitio';
import { EVENTS, FLAGS, FLAG_NAMES, TRAFFIC_TYPE } from '../src/flags.js';
import { simulateSession, syntheticCustomer } from '../src/simulation.js';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const next = process.argv[i + 1];
  return next && !next.startsWith('--') ? next : true;
}

const users = Number(arg('users', 2000));
const regression = Boolean(arg('regression', false));
const prefix = String(arg('prefix', `sim-${Date.now().toString(36)}`));

if (!process.env.FME_SERVER_SDK_KEY) {
  console.error('Set FME_SERVER_SDK_KEY in .env (server-side SDK key).');
  process.exit(1);
}

const factory = SplitFactory({
  core: { authorizationKey: process.env.FME_SERVER_SDK_KEY },
  startup: { readyTimeout: 15 },
  scheduler: { eventsQueueSize: 5000, impressionsRefreshRate: 10, eventsPushRate: 10 },
});
const client = factory.client();

try {
  await client.whenReady();
} catch {
  console.error('FME SDK did not become ready. Check the server-side key and network.');
  process.exit(1);
}

const tally = {};
for (let i = 0; i < users; i += 1) {
  const c = syntheticCustomer(`${prefix}-${i}`);
  const t = client.getTreatments(c.key, FLAG_NAMES, c.attributes);
  const pick = (flag) => (t[flag.name] === 'control' ? flag.safe : t[flag.name]);
  const journey = pick(FLAGS.upgradeV2) === 'on' ? 'v2' : 'v1';
  const offer = pick(FLAGS.offer);
  const s = simulateSession({ journey, offer, attributes: c.attributes, injectFault: regression, checkoutEnabled: pick(FLAGS.checkout) === 'on' });

  client.track(c.key, TRAFFIC_TYPE, EVENTS.viewed, undefined, { journey });
  client.track(c.key, TRAFFIC_TYPE, EVENTS.loadTime, s.loadMs, { journey });
  if (s.attempted) {
    const props = { journey, offer, fromPlan: s.quote.from.id, toPlan: s.quote.to.id };
    if (s.completed) client.track(c.key, TRAFFIC_TYPE, EVENTS.completed, s.quote.delta, props);
    else client.track(c.key, TRAFFIC_TYPE, EVENTS.failed, undefined, props);
  }

  const row = (tally[`${journey} / ${offer}`] ??= { users: 0, upgrades: 0, failures: 0, loadMs: 0 });
  row.users += 1;
  row.loadMs += s.loadMs;
  if (s.completed) row.upgrades += 1;
  if (s.failed) row.failures += 1;
}

console.table(Object.fromEntries(Object.entries(tally).map(([k, r]) => [k, {
  users: r.users,
  conversion: `${((r.upgrades / r.users) * 100).toFixed(1)}%`,
  failures: r.failures,
  avgLoadMs: Math.round(r.loadMs / r.users),
}])));

// destroy() flushes queued impressions and events before exit.
await client.destroy();
console.log(`Sent ${users} customers to Harness FME${regression ? ' with the v2 regression' : ''}. Key prefix: ${prefix}`);
