import type { ReactNode } from 'react';
import type { DrawnCard } from '../../data/tarot/types';
import { getInterpretation } from '../../utils/tarot';

/** Today's card at a glance: the same interpretations as every other reading, one short section each. */
export default function TodayResult({ draw, saved, footer }: { draw: DrawnCard; saved: boolean; footer?: ReactNode }) {
  const general = getInterpretation(draw, 'general');
  const love = getInterpretation(draw, 'love');
  const work = getInterpretation(draw, 'career');
  const money = getInterpretation(draw, 'money');
  const sections = [
    ['General', general.reading],
    ['Love', love.reading],
    ['Work', work.reading],
    ['Money', money.reading],
    ['Advice', general.advice],
  ] as const;
  return <section className="tarot-result today-result" aria-labelledby="result-heading">
    <p className="result-eyebrow">Your card for today · {draw.orientation}</p>
    <h2 id="result-heading">{draw.card.name}</h2>
    <p className="result-keywords">{draw.card.keywords.join(' · ')}</p>
    <div className="result-body">
      {sections.map(([label, text]) => <div key={label}><h3>{label}</h3><p>{text}</p></div>)}
      <div><h3>Carry this question</h3><p>{general.reflection}</p></div>
    </div>
    {footer}
    <p className="daily-status">{saved ? 'Your card is saved on this device until tomorrow.' : 'Your browser blocked saving, so this card may change if you reload the page.'}</p>
    <p className="result-disclaimer">A daily card is a prompt for attention and reflection, not a forecast of your day.</p>
  </section>;
}
