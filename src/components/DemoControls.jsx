import { useState } from 'react';
import { evaluate } from '../flags';
import { withTimeout } from '../fme';
import { simulateSession, syntheticCustomer } from '../simulation';
import { trackUpgradeResult, trackUpgradeViewed } from '../telemetry';

const COUNT = 40;
const BATCH = 8;

function emptyRow() {
  return { users: 0, upgrades: 0, failures: 0, loadTotal: 0 };
}

export default function DemoControls({ factory, injectFault, setInjectFault }) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState(null);

  async function runBurst() {
    setBusy(true);
    setProgress(0);
    const runId = Date.now().toString(36);
    const customers = Array.from({ length: COUNT }, (_, i) => syntheticCustomer(`sim-${runId}-${i}`));
    const rows = { v1: emptyRow(), v2: emptyRow() };

    for (let i = 0; i < customers.length; i += BATCH) {
      await Promise.all(customers.slice(i, i + BATCH).map(async (c) => {
        const client = factory.client(c.key);
        try {
          await withTimeout(client.whenReady(), 8000);
        } catch {
          // Not ready in time: evaluate anyway, the safe fallbacks apply.
        }
        const r = evaluate(client, c.attributes);
        const journey = r.upgradeV2.effective === 'on' ? 'v2' : 'v1';
        const offer = r.offer.effective;
        const s = simulateSession({ journey, offer, attributes: c.attributes, injectFault, checkoutEnabled: r.checkout.effective === 'on' });
        trackUpgradeViewed(client, { loadMs: s.loadMs, journey });
        if (s.attempted) trackUpgradeResult(client, { completed: s.completed, quote: s.quote, journey, offer });
        const row = rows[journey];
        row.users += 1;
        row.loadTotal += s.loadMs;
        if (s.completed) row.upgrades += 1;
        if (s.failed) row.failures += 1;
        await client.destroy();
      }));
      setProgress(Math.min(i + BATCH, COUNT));
      setStats({ ...rows });
    }
    setBusy(false);
  }

  return (
    <div className="card">
      <h3>Demo controls</h3>
      <label className="check">
        <input type="checkbox" checked={injectFault} onChange={(e) => setInjectFault(e.target.checked)} />
        Inject a regression into the new journey (v2): slower load, about 40% of upgrades fail
      </label>
      <div className="row">
        <button type="button" className="h-btn" disabled={busy} onClick={runBurst}>
          {busy ? `Simulating… ${progress}/${COUNT}` : `Simulate ${COUNT} Dutch customers`}
        </button>
      </div>
      {stats && (
        <table className="stats">
          <thead><tr><th>Journey</th><th>Customers</th><th>Upgrades</th><th>Failures</th><th>Avg load</th></tr></thead>
          <tbody>
            {Object.entries(stats).map(([j, s]) => (
              <tr key={j}>
                <td>{j}</td><td>{s.users}</td><td>{s.upgrades}</td><td className={s.failures ? 'bad' : ''}>{s.failures}</td>
                <td>{s.users ? `${Math.round(s.loadTotal / s.users)} ms` : '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="muted small">
        Each synthetic customer is evaluated by FME and sends real events. For statistically significant metric results,
        run <code>npm run traffic -- --users 3000</code> before the demo.
      </p>
    </div>
  );
}
