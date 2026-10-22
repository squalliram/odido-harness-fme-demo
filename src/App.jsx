import { useEffect, useMemo, useRef, useState } from 'react';
import { createFactory, isLocalhostMode, useFmeClient } from './fme';
import { evaluate } from './flags';
import { PERSONAS } from './personas';
import PersonaBar from './components/PersonaBar';
import PhoneApp from './components/PhoneApp';
import FlagInspector from './components/FlagInspector';
import AttributeEditor from './components/AttributeEditor';
import DemoControls from './components/DemoControls';
import ActivityLog from './components/ActivityLog';

const SDK_KEY = import.meta.env.VITE_FME_CLIENT_KEY;

export default function App() {
  if (!SDK_KEY) return <ConfigError />;
  return <Demo />;
}

function nowTime() {
  return new Date().toLocaleTimeString('en-GB');
}

function Demo() {
  const factory = useMemo(() => createFactory(SDK_KEY, PERSONAS[0].key), []);
  const [personaId, setPersonaId] = useState(PERSONAS[0].id);
  const [overrides, setOverrides] = useState({});
  const [injectFault, setInjectFault] = useState(false);
  const [flagLog, setFlagLog] = useState([]);
  const [eventLog, setEventLog] = useState([]);

  const persona = PERSONAS.find((p) => p.id === personaId);
  const attributes = { ...persona.attributes, ...(overrides[personaId] || {}) };
  const attrsKey = JSON.stringify(attributes);
  const { client, status, version } = useFmeClient(factory, persona.key);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const result = useMemo(() => evaluate(client, attributes), [client, version, attrsKey]);

  // A treatment that changes while the customer and attributes stay the same can only have come
  // from a change pushed by Harness FME (SDK_UPDATE), so it is logged as a live change.
  const previous = useRef(null);
  useEffect(() => {
    const values = Object.fromEntries(Object.entries(result).map(([id, r]) => [id, r.treatment]));
    const prev = previous.current;
    if (prev && prev.personaId === personaId && prev.attrsKey === attrsKey && status.isReady) {
      const changes = Object.entries(values)
        .filter(([id, t]) => prev.values[id] !== t && prev.values[id] !== 'control')
        .map(([id, t]) => ({ time: nowTime(), flag: result[id].flag.name, from: prev.values[id], to: t }));
      if (changes.length) setFlagLog((log) => [...changes, ...log].slice(0, 8));
    }
    previous.current = { personaId, attrsKey, values };
  }, [result, personaId, attrsKey, status.isReady]);

  function logEvent(entry) {
    setEventLog((log) => [{ time: nowTime(), ...entry }, ...log].slice(0, 10));
  }

  function setAttribute(name, value) {
    setOverrides((o) => ({ ...o, [personaId]: { ...(o[personaId] || {}), [name]: value } }));
  }

  function resetAttributes() {
    setOverrides((o) => ({ ...o, [personaId]: {} }));
  }

  return (
    <div className="layout">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">H</span>
          <div>
            <div className="brand-title">Harness FME <span className="x">×</span> Odido</div>
            <div className="brand-sub">Plan upgrade journey: release, target, measure, experiment</div>
          </div>
        </div>
        <SdkStatus status={status} localhost={isLocalhostMode(SDK_KEY)} />
      </header>

      <PersonaBar personas={PERSONAS} current={personaId} onChange={setPersonaId} />

      {status.hasTimedout && !status.isReady && (
        <div className="banner warn">
          Harness FME could not be reached. The app is running on its safe fallbacks: current upgrade journey, standard offer, plan changes on.
        </div>
      )}

      <main className="grid">
        <section className="stage">
          <PhoneApp
            key={`${persona.id}-${attrsKey}`}
            persona={persona}
            attributes={attributes}
            result={result}
            client={client}
            injectFault={injectFault}
            onEvent={logEvent}
          />
          <p className="expected"><strong>Expected:</strong> {persona.expected}</p>
        </section>

        <aside className="side">
          <FlagInspector persona={persona} result={result} />
          <AttributeEditor persona={persona} attributes={attributes} onChange={setAttribute} onReset={resetAttributes} />
          <DemoControls factory={factory} injectFault={injectFault} setInjectFault={setInjectFault} />
          <ActivityLog flagLog={flagLog} eventLog={eventLog} />
        </aside>
      </main>
    </div>
  );
}

function SdkStatus({ status, localhost }) {
  let label = 'Connecting to Harness FME…';
  let cls = 'connecting';
  if (localhost) {
    label = 'Offline rehearsal mode (localhost)';
    cls = 'offline';
  } else if (status.isReady) {
    label = 'Connected: streaming updates';
    cls = 'ready';
  } else if (status.hasTimedout) {
    label = 'Offline: safe fallbacks';
    cls = 'offline';
  }
  return <div className={`sdk-status ${cls}`}><span className="dot" />{label}</div>;
}

function ConfigError() {
  return (
    <div className="config-error">
      <h2>Add your Harness FME client-side SDK key</h2>
      <ol>
        <li>Copy <code>.env.example</code> to <code>.env</code>.</li>
        <li>Set <code>VITE_FME_CLIENT_KEY</code> to the <strong>client-side</strong> SDK key of your FME environment.</li>
        <li>Restart <code>npm run dev</code>. Vite reads <code>.env</code> only at start-up.</li>
      </ol>
      <p className="muted">Never use the server-side key here: anything prefixed with <code>VITE_</code> ships to the browser.</p>
    </div>
  );
}
