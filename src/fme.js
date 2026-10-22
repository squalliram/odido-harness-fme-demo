import { useEffect, useMemo, useState } from 'react';
import { SplitFactory } from '@splitsoftware/splitio-browserjs';

// Latest rule label per (key, flag), captured from the SDK's impression listener. The label is the
// "why": e.g. "in segment beta_testers", "default rule", "killed".
const labels = new Map();
const labelSubscribers = new Set();

// The SDK calls the impression listener asynchronously, so views subscribe to re-render when a label lands.
export function useLabels(key) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const onLabel = (keyName) => {
      if (keyName === key) setTick((t) => t + 1);
    };
    labelSubscribers.add(onLabel);
    return () => labelSubscribers.delete(onLabel);
  }, [key]);
}

export function lastLabel(key, flagName) {
  return labels.get(`${key}|${flagName}`);
}

// Offline rehearsal mode (VITE_FME_CLIENT_KEY=localhost): fixed treatments, no network, no targeting.
// Useful for practising the UI without connectivity; the real demo always uses a live environment.
const LOCALHOST_FEATURES = {
  odido_upgrade_journey_v2: 'on',
  odido_upgrade_offer: { treatment: 'free_month', config: null },
  ops_upgrade_checkout_enabled: 'on',
};

export const isLocalhostMode = (sdkKey) => sdkKey === 'localhost';

export function createFactory(sdkKey, key) {
  return SplitFactory({
    core: { authorizationKey: sdkKey, key },
    ...(isLocalhostMode(sdkKey) ? { features: LOCALHOST_FEATURES } : {}),
    startup: { readyTimeout: 6 },
    impressionListener: {
      logImpression({ impression }) {
        labels.set(`${impression.keyName}|${impression.feature}`, {
          label: impression.label,
          changeNumber: impression.changeNumber,
        });
        labelSubscribers.forEach((notify) => notify(impression.keyName));
      },
    },
  });
}

const STATUS_EVENTS = ['SDK_READY', 'SDK_READY_FROM_CACHE', 'SDK_UPDATE', 'SDK_READY_TIMED_OUT'];

// One client per customer key. factory.client(key) returns the cached client for keys already seen.
export function useFmeClient(factory, key) {
  const client = useMemo(() => factory.client(key), [factory, key]);
  const [status, setStatus] = useState(() => client.getStatus());
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const refresh = () => {
      setStatus(client.getStatus());
      setVersion((v) => v + 1);
    };
    const events = STATUS_EVENTS.map((e) => client.Event[e]);
    events.forEach((e) => client.on(e, refresh));
    refresh();
    return () => events.forEach((e) => client.removeListener(e, refresh));
  }, [client]);

  return { client, status, version };
}

export function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);
}
