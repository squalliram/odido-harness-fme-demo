export default function ActivityLog({ flagLog, eventLog }) {
  return (
    <div className="card">
      <h3>Live activity</h3>
      <h4>Flag changes pushed by Harness FME (no redeploy, no refresh)</h4>
      {flagLog.length === 0 ? (
        <p className="muted small">Change a flag in Harness FME and it appears here within seconds.</p>
      ) : (
        <ul className="log">
          {flagLog.map((l, i) => (
            <li key={`${l.time}-${l.flag}-${i}`}>
              <span className="muted">{l.time}</span> <code>{l.flag}</code> {l.from} → <strong>{l.to}</strong>
            </li>
          ))}
        </ul>
      )}
      <h4>Events sent with client.track()</h4>
      {eventLog.length === 0 ? (
        <p className="muted small">Open the upgrade journey to send events.</p>
      ) : (
        <ul className="log">
          {eventLog.map((e, i) => (
            <li key={`${e.time}-${i}`}>
              <span className="muted">{e.time}</span> <code>{e.event}</code>{e.value !== undefined ? ` = ${e.value}` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
