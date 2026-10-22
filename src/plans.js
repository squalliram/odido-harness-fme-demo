export const PLANS = {
  go10: { id: 'go10', name: 'Go 10 GB', price: 15, perks: ['10 GB in NL and EU', 'Unlimited calls and texts'] },
  unlimited_start: { id: 'unlimited_start', name: 'Unlimited Start', price: 25, perks: ['Unlimited data at 20 Mbit/s', '40 GB in the EU'] },
  unlimited_max: { id: 'unlimited_max', name: 'Unlimited Max', price: 35, perks: ['Unlimited data at full 5G speed', '60 GB in the EU', 'Free eSIM for your smartwatch'] },
};

const NEXT = { go10: 'unlimited_start', unlimited_start: 'unlimited_max', unlimited_max: null };

export function nextPlan(planId) {
  const next = NEXT[planId];
  return next ? PLANS[next] : null;
}

export function upgradeQuote(planId) {
  const from = PLANS[planId];
  const to = nextPlan(planId);
  if (!from || !to) return null;
  const delta = to.price - from.price;
  return { from, to, delta, perDay: (delta / 30).toFixed(2).replace('.', ',') };
}

export function fillTemplate(text, quote) {
  if (!text || !quote) return text || '';
  return text
    .replaceAll('{plan}', quote.to.name)
    .replaceAll('{delta}', String(quote.delta))
    .replaceAll('{perDay}', quote.perDay);
}
