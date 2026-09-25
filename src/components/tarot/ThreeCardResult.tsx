import type { ReactNode } from 'react';
import type { DrawnCard, ReadingCategory } from '../../data/tarot/types';
import { THREE_CARD_POSITIONS, getInterpretation } from '../../utils/tarot';

export default function ThreeCardResult({ draws, category, onAgain, footer, variant = 'own' }: { draws: DrawnCard[]; category: ReadingCategory; onAgain?: () => void; footer?: ReactNode; variant?: 'own' | 'shared' }) {
  return <section className="tarot-result" aria-labelledby="result-heading">
    <p className="result-eyebrow">{variant === 'shared' ? 'A shared' : 'Your'} {category} reading · Past, present, future</p>
    <h2 id="result-heading">{variant === 'shared' ? 'The three cards' : 'Your three cards'}</h2>
    <p className="result-keywords">{draws.map((draw) => draw.card.name).join(' · ')}</p>
    <div className="result-body">
      {draws.map((draw, index) => {
        const { reading, advice, reflection } = getInterpretation(draw, category);
        const position = THREE_CARD_POSITIONS[index];
        return <div key={draw.cardId}>
          <p className="result-position">{position.label} · {position.prompt}</p>
          <h3>{draw.card.name} <small>{draw.orientation === 'reversed' ? 'Reversed' : 'Upright'}</small></h3>
          <p>{reading}</p>
          <p className="result-note"><strong>A gentle suggestion.</strong> {advice}</p>
          <p className="result-note"><strong>For reflection.</strong> {reflection}</p>
        </div>;
      })}
    </div>
    {footer}
    {onAgain && <button className="button button-primary" type="button" onClick={onAgain}>Draw again <span aria-hidden="true">↗</span></button>}
    <p className="result-disclaimer">A tarot reading is an invitation to reflect, not a fixed prediction.</p>
  </section>;
}
