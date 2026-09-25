import { useEffect, useId, useState } from 'react';
import { getZodiacSign, zodiacSigns } from '../../data/zodiac/signs';
import { getCompatibility } from '../../utils/compatibility';

const SECTIONS = [
  ['overall', 'Overall dynamic'],
  ['communication', 'Communication'],
  ['love', 'Love'],
  ['emotional', 'Emotional connection'],
  ['challenges', 'Challenges'],
  ['advice', 'Advice'],
] as const;

function SignSelect({ label, value, onChange }: { label: string; value: string; onChange: (id: string) => void }) {
  const id = useId();
  return <div className="compat-field">
    <label htmlFor={id}>{label}</label>
    <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Choose a sign</option>
      {zodiacSigns.map((sign) => <option key={sign.id} value={sign.id}>{sign.name} {sign.symbol} ({sign.dateRange})</option>)}
    </select>
  </div>;
}

export default function CompatibilityChecker() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const first = params.get('a');
    const second = params.get('b');
    if (getZodiacSign(first)) setA(first as string);
    if (getZodiacSign(second)) setB(second as string);
  }, []);

  function update(nextA: string, nextB: string) {
    setA(nextA);
    setB(nextB);
    const params = new URLSearchParams();
    if (nextA) params.set('a', nextA);
    if (nextB) params.set('b', nextB);
    const query = params.toString();
    try { window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`); } catch { /* the result still works without a shareable URL */ }
  }

  const signA = getZodiacSign(a);
  const signB = getZodiacSign(b);
  const result = signA && signB ? getCompatibility(signA.id, signB.id) : null;

  return <div className="one-card-app">
    <div className="reading-panel">
      <h2 className="sign-heading">Choose two signs</h2>
      <div className="compat-form">
        <SignSelect label="First sign" value={a} onChange={(id) => update(id, b)} />
        <span className="compat-plus" aria-hidden="true">+</span>
        <SignSelect label="Second sign" value={b} onChange={(id) => update(a, id)} />
      </div>
      {!result && <p className="daily-status">Pick two signs to see how their styles fit together. You can choose the same sign twice.</p>}
      {result && signA && signB && <section className="tarot-result compat-result" aria-labelledby="compat-heading">
        <p className="result-eyebrow">Zodiac compatibility</p>
        <h2 id="compat-heading">{signA.name} <span aria-hidden="true">{signA.symbol} +</span><span className="sr-only">and</span> {signB.name} <span aria-hidden="true">{signB.symbol}</span></h2>
        <p className="compat-tone"><span className={`tone-badge tone-${result.tone}`}>{result.toneLabel}</span></p>
        <div className="result-body">
          {SECTIONS.map(([key, label]) => <div key={key}><h3>{label}</h3><p>{result.sections[key]}</p></div>)}
        </div>
        <p className="compat-links">
          <a href={`/zodiac/${signA.id}/`}>Read the {signA.name} guide</a>
          {signA.id !== signB.id && <a href={`/zodiac/${signB.id}/`}>Read the {signB.name} guide</a>}
        </p>
        <p className="result-disclaimer">For entertainment and personal reflection. Sun signs describe only one layer of a person and cannot predict how a relationship will unfold.</p>
      </section>}
      <span className="sr-only" role="status" aria-live="polite">{result ? `${signA?.name} and ${signB?.name}: a ${result.toneLabel.toLowerCase()} pairing.` : ''}</span>
    </div>
  </div>;
}
