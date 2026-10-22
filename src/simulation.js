// Behaviour model for synthetic customers. Shared by the in-app traffic burst and the Node traffic script,
// so both produce the same story: v2 converts better, free_month wins the offer test, and an injected
// regression in v2 shows up as failures and slow load times.
import { upgradeQuote } from './plans.js';

const CITY_WEIGHTS = [
  ['Amsterdam', 22], ['Rotterdam', 15], ['Den Haag', 12], ['Utrecht', 10], ['Eindhoven', 8],
  ['Groningen', 7], ['Tilburg', 6], ['Almere', 6], ['Breda', 7], ['Nijmegen', 7],
];

const OFFER_LIFT = { standard: 1, free_month: 1.45, price_per_day: 1.15 };

function pick(weights, rand) {
  const total = weights.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [value, w] of weights) {
    r -= w;
    if (r <= 0) return value;
  }
  return weights[weights.length - 1][0];
}

export function syntheticCustomer(key, rand = Math.random) {
  return {
    key,
    attributes: {
      city: pick(CITY_WEIGHTS, rand),
      customerType: rand() < 0.1 ? 'business' : 'consumer',
      isEmployee: false,
      plan: pick([['go10', 50], ['unlimited_start', 35], ['unlimited_max', 15]], rand),
      usagePct: Math.round(15 + rand() * 85),
      tenureMonths: Math.round(rand() * 96),
      appVersion: rand() < 0.8 ? '9.6.2' : '9.4.0',
      platform: rand() < 0.55 ? 'ios' : 'android',
    },
  };
}

export function simulateSession({ journey, offer, attributes, injectFault, checkoutEnabled = true, rand = Math.random }) {
  const quote = upgradeQuote(attributes.plan);
  const faulty = journey === 'v2' && injectFault;
  const loadMs = Math.round((journey === 'v2' ? 380 : 950) + rand() * 250 + (faulty ? 1600 + rand() * 600 : 0));
  if (!quote || !checkoutEnabled) return { loadMs, attempted: false, completed: false, failed: false, quote };

  const highIntent = attributes.usagePct >= 70;
  let p = highIntent ? 0.16 : 0.04;
  if (journey === 'v2') p *= 1.35;
  p *= OFFER_LIFT[offer] ?? 1;

  const attempted = rand() < Math.min(p * 1.3, 0.95);
  const failed = attempted && rand() < (faulty ? 0.4 : 0.02);
  const completed = attempted && !failed && rand() < 0.8;
  return { loadMs, attempted, completed, failed, quote };
}
