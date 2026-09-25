import { useEffect, useRef, useState } from 'react';
import { getZodiacSign, zodiacSigns } from '../../data/zodiac/signs';
import { DAILY_SECTIONS } from '../../data/zodiac/types';
import { capitalize, formatDateKey, getDailyHoroscope, getLocalDateKey } from '../../utils/horoscope';

const LABELS = { general: 'General', love: 'Love', career: 'Career', money: 'Money', advice: 'Advice' } as const;

export default function DailyHoroscope() {
  const [selected, setSelected] = useState<string | null>(null);
  const [today, setToday] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const shouldReveal = useRef(false);

  useEffect(() => {
    setToday(getLocalDateKey());
    const fromHash = window.location.hash.slice(1);
    if (getZodiacSign(fromHash)) setSelected(fromHash);
  }, []);

  // After an explicit choice, bring the reading into view and hand focus to its heading.
  useEffect(() => {
    if (!selected || !shouldReveal.current) return;
    shouldReveal.current = false;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    heading.current?.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    heading.current?.focus({ preventScroll: true });
  }, [selected]);

  function choose(id: string) {
    shouldReveal.current = true;
    setSelected(id);
    try { window.history.replaceState(null, '', `#${id}`); } catch { /* the reading still works without a shareable hash */ }
  }

  const sign = getZodiacSign(selected);
  const daily = sign && today ? getDailyHoroscope(sign, today) : null;

  return <div className="one-card-app">
    <div className="reading-panel">
      <h2 className="sign-heading" id="sign-picker">What is your Sun sign?</h2>
      <ul className="sign-grid" aria-labelledby="sign-picker">
        {zodiacSigns.map((option) => <li key={option.id}>
          <button type="button" className={`sign-option ${selected === option.id ? 'is-selected' : ''}`} aria-pressed={selected === option.id} onClick={() => choose(option.id)}>
            <span className="sign-symbol" aria-hidden="true">{option.symbol}</span>
            <span className="sign-name">{option.name}</span>
            <span className="sign-meta">{option.dateRange}</span>
            <span className="sign-meta">{capitalize(option.element)} · {option.descriptor}</span>
          </button>
        </li>)}
      </ul>
      {sign && daily && <section className="tarot-result horoscope-result" aria-labelledby="horoscope-heading">
        <p className="result-eyebrow">Today · {formatDateKey(today)}</p>
        <h2 id="horoscope-heading" tabIndex={-1} ref={heading}><span aria-hidden="true">{sign.symbol}</span> {sign.name} daily horoscope</h2>
        <p className="result-keywords">{sign.dateRange} · {capitalize(sign.element)} · {sign.descriptor}</p>
        <div className="result-body">
          {DAILY_SECTIONS.map((section) => <div key={section}><h3>{LABELS[section]}</h3><p>{daily[section]}</p></div>)}
        </div>
        <a className="button button-quiet" href={`/zodiac/${sign.id}/`}>Read the full {sign.name} guide</a>
        <p className="result-disclaimer">For entertainment and personal reflection. Today's horoscope is the same for everyone with this sign on the same date, and it changes at local midnight.</p>
      </section>}
      <span className="sr-only" role="status" aria-live="polite">{sign ? `Showing today's horoscope for ${sign.name}.` : ''}</span>
    </div>
  </div>;
}
