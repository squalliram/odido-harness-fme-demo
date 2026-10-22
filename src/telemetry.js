import { EVENTS, TRAFFIC_TYPE } from './flags.js';

// Both journeys send the same events, so FME compares like with like across treatments.
// Each function returns what it sent so the UI can show it.
export function trackUpgradeViewed(client, { loadMs, journey }) {
  client.track(TRAFFIC_TYPE, EVENTS.viewed, undefined, { journey });
  client.track(TRAFFIC_TYPE, EVENTS.loadTime, loadMs, { journey });
  return [{ event: EVENTS.viewed }, { event: EVENTS.loadTime, value: loadMs }];
}

export function trackUpgradeResult(client, { completed, quote, journey, offer }) {
  const properties = { journey, offer, fromPlan: quote.from.id, toPlan: quote.to.id };
  if (completed) {
    client.track(TRAFFIC_TYPE, EVENTS.completed, quote.delta, properties);
    return [{ event: EVENTS.completed, value: quote.delta }];
  }
  client.track(TRAFFIC_TYPE, EVENTS.failed, undefined, properties);
  return [{ event: EVENTS.failed }];
}
