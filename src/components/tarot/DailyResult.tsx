import type { ReactNode } from 'react';
import type { DrawnCard } from '../../data/tarot/types';
import { getInterpretation } from '../../utils/tarot';

function formatDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

/** `saved` is only shown in the live reading; the shared view omits it (and may omit the date). */
export default function DailyResult({ draw, dateKey, saved, footer, variant = 'own' }: { draw: DrawnCard; dateKey?: string; saved?: boolean; footer?: ReactNode; variant?: 'own' | 'shared' }) {
  const { reading, advice, reflection } = getInterpretation(draw, 'general');
  const date = dateKey ? formatDate(dateKey) : '';
  const eyebrow = variant === 'shared' ? `A shared daily card${date ? ` for ${date}` : ''}` : `Your card for ${date}`;
  return <section className="tarot-result" aria-labelledby="result-heading">
    <p className="result-eyebrow">{eyebrow} · {draw.orientation}</p>
    <h2 id="result-heading">{draw.card.name}</h2>
    <p className="result-keywords">{draw.card.keywords.join(' · ')}</p>
    <div className="result-body"><div><h3>Today's theme</h3><p>{reading}</p></div><div><h3>A gentle suggestion</h3><p>{advice}</p></div><div><h3>Carry this question</h3><p>{reflection}</p></div></div>
    {footer}
    {saved !== undefined && <p className="daily-status">{saved ? 'Your card is saved on this device until tomorrow. Come back then for a new one.' : 'Your browser blocked saving, so this card may change if you reload the page.'}</p>}
    <p className="result-disclaimer">A daily card is a prompt for attention and reflection, not a forecast of your day.</p>
  </section>;
}
