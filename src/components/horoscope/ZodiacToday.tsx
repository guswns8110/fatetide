import { useEffect, useId, useState } from 'react';
import { getZodiacSign, zodiacSigns } from '../../data/zodiac/signs';
import { DAILY_SECTIONS } from '../../data/zodiac/types';
import { getDailyHoroscope, getLocalDateKey } from '../../utils/horoscope';

const LABELS = { general: 'General', love: 'Love', career: 'Work', money: 'Money', advice: 'Advice' } as const;

/** Optional: pick a sign to see today's horoscope for it. Same deterministic rule as the Horoscope page. */
export default function ZodiacToday() {
  const selectId = useId();
  const [selected, setSelected] = useState('');
  const [today, setToday] = useState('');

  useEffect(() => {
    setToday(getLocalDateKey());
    const fromHash = window.location.hash.slice(1);
    if (getZodiacSign(fromHash)) setSelected(fromHash);
  }, []);

  function choose(id: string) {
    setSelected(id);
    try { window.history.replaceState(null, '', id ? `#${id}` : window.location.pathname + window.location.search); } catch { /* the reading still works without a shareable hash */ }
  }

  const sign = getZodiacSign(selected);
  const daily = sign && today ? getDailyHoroscope(sign, today) : null;

  return <div className="today-zodiac">
    <h2 className="today-zodiac-title">Your zodiac <span>(optional)</span></h2>
    <div className="compat-field">
      <label htmlFor={selectId}>Choose your sign for today's horoscope</label>
      <select id={selectId} value={selected} onChange={(event) => choose(event.target.value)}>
        <option value="">Choose a sign</option>
        {zodiacSigns.map((option) => <option key={option.id} value={option.id}>{option.name} {option.symbol} ({option.dateRange})</option>)}
      </select>
    </div>
    {sign && daily && <section className="tarot-result horoscope-result" aria-labelledby="zodiac-today-heading">
      <h3 id="zodiac-today-heading" className="zodiac-today-heading"><span aria-hidden="true">{sign.symbol}</span> {sign.name} today</h3>
      <div className="result-body">
        {DAILY_SECTIONS.map((section) => <div key={section}><h3>{LABELS[section]}</h3><p>{daily[section]}</p></div>)}
      </div>
      <a href={`/zodiac/${sign.id}/`}>Read the full {sign.name} guide</a>
    </section>}
    <p className="today-zodiac-link"><a href="/horoscope/">Explore your zodiac sign</a></p>
    <span className="sr-only" role="status" aria-live="polite">{sign ? `Showing today's horoscope for ${sign.name}.` : ''}</span>
  </div>;
}
