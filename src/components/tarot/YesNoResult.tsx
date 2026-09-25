import type { ReactNode } from 'react';
import type { DrawnCard } from '../../data/tarot/types';
import { getInterpretation, getYesNoAnswer } from '../../utils/tarot';

export default function YesNoResult({ draw, onAgain, footer, variant = 'own' }: { draw: DrawnCard; onAgain?: () => void; footer?: ReactNode; variant?: 'own' | 'shared' }) {
  const { label, summary, answer } = getYesNoAnswer(draw);
  const { reading, advice, reflection } = getInterpretation(draw, 'general');
  return <section className="tarot-result" aria-labelledby="result-heading">
    <p className="result-eyebrow">{variant === 'shared' ? 'A shared' : 'Your'} yes or no reading · {draw.card.name} · {draw.orientation}</p>
    <h2 id="result-heading"><span className={`answer-badge answer-${answer}`}>{label}</span></h2>
    <p className="result-keywords">{summary}</p>
    <div className="result-body"><div><h3>Why this card</h3><p>{reading}</p></div><div><h3>A gentle suggestion</h3><p>{advice}</p></div><div><h3>For reflection</h3><p>{reflection}</p></div></div>
    {footer}
    {onAgain && <button className="button button-primary" type="button" onClick={onAgain}>Ask another question <span aria-hidden="true">↗</span></button>}
    <p className="result-disclaimer">This answer is a prompt for reflection, not a prediction. Please do not use it to decide medical, legal, or financial matters.</p>
  </section>;
}
