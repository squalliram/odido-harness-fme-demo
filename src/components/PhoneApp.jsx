import { useState } from 'react';
import { OFFER_FALLBACK_CONFIG } from '../flags';
import { PLANS, fillTemplate, upgradeQuote } from '../plans';
import { simulateSession } from '../simulation';
import { trackUpgradeResult, trackUpgradeViewed } from '../telemetry';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function PhoneApp({ persona, attributes, result, client, injectFault, onEvent }) {
  const journey = result.upgradeV2.effective === 'on' ? 'v2' : 'v1';
  const offer = result.offer.effective;
  const offerConfig = result.offer.config || OFFER_FALLBACK_CONFIG[offer] || OFFER_FALLBACK_CONFIG.standard;
  const checkoutEnabled = result.checkout.effective === 'on';
  const quote = upgradeQuote(attributes.plan);
  const plan = PLANS[attributes.plan];
  const firstName = persona.id === 'smit' ? 'Bakkerij Smit' : persona.name.split(' ')[0];

  const [screen, setScreen] = useState('home');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState(null);

  const send = (entries) => entries.forEach(onEvent);

  async function openUpgrade() {
    const { loadMs } = simulateSession({ journey, offer, attributes, injectFault });
    setLoading(true);
    await sleep(Math.min(loadMs, 2600));
    setLoading(false);
    setScreen('upgrade');
    send(trackUpgradeViewed(client, { loadMs, journey }));
  }

  async function confirm() {
    const faulty = journey === 'v2' && injectFault;
    setSubmitting(true);
    await sleep(faulty ? 1800 : 700);
    const completed = Math.random() >= (faulty ? 0.5 : 0.02);
    send(trackUpgradeResult(client, { completed, quote, journey, offer }));
    setSubmitting(false);
    setOutcome(completed ? 'completed' : 'failed');
    setScreen('done');
  }

  return (
    <div className="phone-wrap">
      <div className="journey-tag">
        Upgrade journey: <strong>{journey === 'v2' ? 'v2 (new, one tap)' : 'v1 (current)'}</strong>
        {' · '}Offer: <strong>{offer}</strong>
        {!checkoutEnabled && <span className="paused-tag">Plan changes paused</span>}
      </div>
      <div className="phone">
        <div className="phone-status"><span>09:41</span><span>5G ▮▮▮▮</span></div>
        <div className="phone-head">
          <span className="odido-word">odido</span>
          <span className="avatar">{firstName[0]}</span>
        </div>
        <div className="phone-body">
          {loading && <div className="loading"><span className="spinner" />Loading your options…</div>}
          {!loading && screen === 'home' && (
            <Home firstName={firstName} plan={plan} attributes={attributes} quote={quote}
              offer={offer} offerConfig={offerConfig} checkoutEnabled={checkoutEnabled} onUpgrade={openUpgrade} />
          )}
          {!loading && screen === 'upgrade' && quote && (
            journey === 'v2'
              ? <UpgradeV2 quote={quote} attributes={attributes} offer={offer} offerConfig={offerConfig}
                  checkoutEnabled={checkoutEnabled} submitting={submitting} onConfirm={confirm} onBack={() => setScreen('home')} />
              : <UpgradeV1 quote={quote} checkoutEnabled={checkoutEnabled} submitting={submitting}
                  onConfirm={confirm} onBack={() => setScreen('home')} />
          )}
          {!loading && screen === 'done' && (
            <Done outcome={outcome} quote={quote} onHome={() => setScreen('home')} />
          )}
        </div>
      </div>
    </div>
  );
}

function Home({ firstName, plan, attributes, quote, offer, offerConfig, checkoutEnabled, onUpgrade }) {
  return (
    <>
      <h2 className="hello">Hoi {firstName}</h2>
      <div className="plan-card">
        <div className="plan-row"><span>{plan.name}</span><strong>€{plan.price}/mo</strong></div>
        <div className="usage"><div className="usage-fill" style={{ width: `${Math.min(attributes.usagePct, 100)}%` }} /></div>
        <div className="muted small">{attributes.usagePct}% of your data used this month</div>
      </div>
      {quote ? (
        <div className={`offer offer-${offer}`}>
          {offerConfig.badge && <span className="offer-badge">{offerConfig.badge}</span>}
          <div className="offer-title">{fillTemplate(offerConfig.headline, quote)}</div>
          <div className="offer-body">{fillTemplate(offerConfig.body, quote)}</div>
          <button type="button" className="o-btn" onClick={onUpgrade}>{fillTemplate(offerConfig.cta, quote)}</button>
          {!checkoutEnabled && <div className="small paused">Plan changes are briefly paused. Your current plan is not affected.</div>}
        </div>
      ) : (
        <div className="offer"><div className="offer-title">You are on our best plan</div><div className="offer-body">Unlimited data at full 5G speed.</div></div>
      )}
      <div className="tiles">
        {['Bills', 'Usage', 'Roaming', 'Help'].map((t) => <div className="tile" key={t}>{t}</div>)}
      </div>
    </>
  );
}

function PausedNotice() {
  return <div className="paused-box">Plan changes are paused for a few minutes while we fix an issue. Nothing has changed on your account.</div>;
}

function UpgradeV1({ quote, checkoutEnabled, submitting, onConfirm, onBack }) {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState(quote.to.id);
  const [agreed, setAgreed] = useState(false);
  return (
    <div className="v1">
      <button type="button" className="back" onClick={onBack}>‹ Back</button>
      <h3>Change subscription</h3>
      <div className="muted small">Step {step} of 2</div>
      {step === 1 && (
        <>
          {Object.values(PLANS).map((p) => (
            <label className="v1-plan" key={p.id}>
              <input type="radio" name="plan" checked={selected === p.id} onChange={() => setSelected(p.id)} />
              <span>{p.name}</span><span className="muted">€{p.price}/mo</span>
            </label>
          ))}
          <p className="tiny">Changes take effect from your next billing cycle. Terms and conditions apply. See odido.nl for full details.</p>
          <button type="button" className="o-btn grey" onClick={() => setStep(2)}>Next</button>
        </>
      )}
      {step === 2 && (
        <>
          <table className="v1-review"><tbody>
            <tr><td>Current</td><td>{quote.from.name}</td></tr>
            <tr><td>New</td><td>{PLANS[selected].name}</td></tr>
            <tr><td>Effective</td><td>Next billing cycle</td></tr>
          </tbody></table>
          <label className="v1-agree"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /> I agree to the terms and conditions</label>
          {!checkoutEnabled && <PausedNotice />}
          <button type="button" className="o-btn grey" disabled={!agreed || submitting || !checkoutEnabled} onClick={onConfirm}>
            {submitting ? 'Processing…' : 'Confirm change'}
          </button>
        </>
      )}
    </div>
  );
}

function UpgradeV2({ quote, attributes, offer, offerConfig, checkoutEnabled, submitting, onConfirm, onBack }) {
  const [esim, setEsim] = useState(true);
  return (
    <div className="v2">
      <button type="button" className="back" onClick={onBack}>‹ Back</button>
      <div className="v2-reco">Recommended for you</div>
      <h3>{quote.to.name}</h3>
      <p className="small">You used {attributes.usagePct}% of your data this month. {quote.to.name} means no more top-ups.</p>
      <div className="compare">
        <div><div className="muted tiny">Now</div><strong>{quote.from.name}</strong><div>€{quote.from.price}</div></div>
        <div className="arrow">→</div>
        <div className="to"><div className="muted tiny">New</div><strong>{quote.to.name}</strong><div>€{quote.to.price}</div></div>
      </div>
      <ul className="perks">{quote.to.perks.map((p) => <li key={p}>✓ {p}</li>)}</ul>
      {offer !== 'standard' && offerConfig.badge && <div className="offer-badge inline">{offerConfig.badge}</div>}
      {quote.to.id === 'unlimited_max' && (
        <label className="v2-esim"><input type="checkbox" checked={esim} onChange={(e) => setEsim(e.target.checked)} /> Add a free eSIM for my smartwatch</label>
      )}
      {!checkoutEnabled && <PausedNotice />}
      <button type="button" className="o-btn" disabled={submitting || !checkoutEnabled} onClick={onConfirm}>
        {submitting ? 'Upgrading…' : `Upgrade now · +€${quote.delta}/mo`}
      </button>
      <div className="tiny muted center">Active immediately. Fully reversible within 14 days.</div>
    </div>
  );
}

function Done({ outcome, quote, onHome }) {
  return (
    <div className="done">
      {outcome === 'completed' ? (
        <>
          <div className="done-icon ok">✓</div>
          <h3>You are on {quote.to.name}</h3>
          <p className="small">We have sent a confirmation to your email.</p>
        </>
      ) : (
        <>
          <div className="done-icon fail">!</div>
          <h3>That did not work</h3>
          <p className="small">Your plan has not changed and you have not been charged. Please try again later.</p>
        </>
      )}
      <button type="button" className="o-btn" onClick={onHome}>Back to home</button>
    </div>
  );
}
