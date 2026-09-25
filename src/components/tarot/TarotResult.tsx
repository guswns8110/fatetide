import type { ReactNode } from 'react';
import type { DrawnCard, ReadingCategory } from '../../data/tarot/types';
import { getInterpretation } from '../../utils/tarot';

export default function TarotResult({ draw, category, onAgain, footer, variant = 'own' }: { draw: DrawnCard; category: ReadingCategory; onAgain?: () => void; footer?: ReactNode; variant?: 'own' | 'shared' }) {
  const { reading, advice, reflection } = getInterpretation(draw, category);
  return <section className="tarot-result" aria-labelledby="result-heading">
    <p className="result-eyebrow">{variant === 'shared' ? 'A shared' : 'Your'} {category} reading · {draw.orientation}</p>
    <h2 id="result-heading">{draw.card.name}</h2>
    <p className="result-keywords">{draw.card.keywords.join(' · ')}</p>
    <div className="result-body"><div><h3>Your reading</h3><p>{reading}</p></div><div><h3>A gentle suggestion</h3><p>{advice}</p></div><div><h3>For reflection</h3><p>{reflection}</p></div></div>
    {footer}
    {onAgain && <button className="button button-primary" type="button" onClick={onAgain}>Draw again <span aria-hidden="true">↗</span></button>}
    <p className="result-disclaimer">A tarot reading is an invitation to reflect, not a fixed prediction.</p>
  </section>;
}
