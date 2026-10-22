import { lastLabel, useLabels } from '../fme';

function pillClass(kind, treatment) {
  if (treatment === 'control') return 'pill-muted';
  if (kind === 'Experiment') return 'pill-exp';
  return treatment === 'on' ? 'pill-on' : 'pill-off';
}

export default function FlagInspector({ persona, result }) {
  useLabels(persona.key);
  return (
    <div className="card">
      <h3>What Harness FME decided for {persona.name}</h3>
      <p className="muted small">Evaluated in the browser by the FME SDK in under a millisecond. The rule label explains why.</p>
      <table className="flags">
        <tbody>
          {Object.values(result).map((r) => {
            const info = lastLabel(persona.key, r.flag.name);
            return (
              <tr key={r.flag.name}>
                <td>
                  <span className="kind">{r.flag.kind}</span>
                  <code>{r.flag.name}</code>
                  <div className="muted small">{r.flag.purpose}</div>
                </td>
                <td className="value">
                  <span className={`pill ${pillClass(r.flag.kind, r.treatment)}`}>{r.treatment}</span>
                  <div className="small rule">{info?.label || '…'}</div>
                  {r.usedFallback && <div className="small fallback">Using safe fallback: {r.effective}</div>}
                  {r.config && <div className="small muted">dynamic config attached</div>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
