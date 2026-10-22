import { CITIES } from '../personas';
import { PLANS } from '../plans';

export default function AttributeEditor({ persona, attributes, onChange, onReset }) {
  return (
    <div className="card">
      <div className="card-head">
        <h3>Attributes passed to the SDK</h3>
        <button type="button" className="link" onClick={onReset}>Reset</button>
      </div>
      <p className="muted small">
        Key <code>{persona.key}</code>. Name and email never leave the app. Attributes are used for local evaluation and are not sent to Harness.
      </p>
      <div className="attrs">
        <label>
          city
          <select value={attributes.city} onChange={(e) => onChange('city', e.target.value)}>
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>
          customerType
          <select value={attributes.customerType} onChange={(e) => onChange('customerType', e.target.value)}>
            <option>consumer</option>
            <option>business</option>
          </select>
        </label>
        <label>
          plan
          <select value={attributes.plan} onChange={(e) => onChange('plan', e.target.value)}>
            {Object.values(PLANS).map((p) => <option key={p.id} value={p.id}>{p.id}</option>)}
          </select>
        </label>
        <label>
          appVersion
          <select value={attributes.appVersion} onChange={(e) => onChange('appVersion', e.target.value)}>
            {['9.4.0', '9.5.3', '9.6.0', '9.6.1', '9.6.2'].map((v) => <option key={v}>{v}</option>)}
          </select>
        </label>
        <label>
          usagePct
          <input type="number" min="0" max="100" value={attributes.usagePct} onChange={(e) => onChange('usagePct', Number(e.target.value))} />
        </label>
        <label className="check">
          <input type="checkbox" checked={attributes.isEmployee} onChange={(e) => onChange('isEmployee', e.target.checked)} />
          isEmployee
        </label>
      </div>
      <pre className="attrs-json">{`client.getTreatmentsWithConfig(flags, ${JSON.stringify(attributes, null, 1)})`}</pre>
    </div>
  );
}
