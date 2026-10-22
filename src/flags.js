// Single source of truth for flag names, safe fallbacks and event types.
// Plain ESM with no browser APIs so scripts/simulate-traffic.mjs can import it too.

export const TRAFFIC_TYPE = 'user';

export const FLAGS = {
  upgradeV2: {
    name: 'odido_upgrade_journey_v2',
    kind: 'Release',
    purpose: 'New one-tap plan upgrade journey',
    safe: 'off',
  },
  offer: {
    name: 'odido_upgrade_offer',
    kind: 'Experiment',
    purpose: 'Which upgrade offer converts best',
    safe: 'standard',
  },
  checkout: {
    name: 'ops_upgrade_checkout_enabled',
    kind: 'Kill switch',
    purpose: 'Pause all plan changes without a deploy',
    safe: 'on',
  },
};

export const FLAG_NAMES = Object.values(FLAGS).map((f) => f.name);

export const EVENTS = {
  viewed: 'upgrade.viewed',
  completed: 'upgrade.completed',
  failed: 'upgrade.failed',
  loadTime: 'upgrade.load_time_ms',
};

export const OFFER_FALLBACK_CONFIG = {
  standard: {
    badge: '',
    headline: 'Need more data?',
    body: 'Move to {plan} for €{delta} more per month.',
    cta: 'See upgrade options',
  },
  free_month: {
    badge: 'First month free',
    headline: 'Try {plan} free for a month',
    body: 'Then €{delta} more per month. Change your mind in month one at no cost.',
    cta: 'Start my free month',
  },
  price_per_day: {
    badge: 'Less than a coffee',
    headline: '{plan} for €{perDay} a day',
    body: 'Stop watching your data balance. Upgrade in one tap.',
    cta: 'Upgrade for €{perDay}/day',
  },
};

function parseConfig(config) {
  if (!config) return null;
  try {
    return JSON.parse(config);
  } catch {
    return null;
  }
}

// 'control' is what the SDK returns when it cannot evaluate (not ready, flag missing, network blocked).
// The app must never break on it, so every flag maps 'control' to a deliberate safe treatment.
export function evaluate(client, attributes) {
  const raw = client ? client.getTreatmentsWithConfig(FLAG_NAMES, attributes) : {};
  return Object.fromEntries(
    Object.entries(FLAGS).map(([id, flag]) => {
      const result = raw[flag.name] || { treatment: 'control', config: null };
      const usedFallback = result.treatment === 'control';
      return [
        id,
        {
          flag,
          treatment: result.treatment,
          effective: usedFallback ? flag.safe : result.treatment,
          config: parseConfig(result.config),
          usedFallback,
        },
      ];
    }),
  );
}
