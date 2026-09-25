import type { ReactNode } from 'react';
import type { DrawnCard } from '../../data/tarot/types';
import { LOVE_POSITIONS, getInterpretation } from '../../utils/tarot';

export default function LoveResult({ draws, onAgain, footer, variant = 'own' }: { draws: DrawnCard[]; onAgain?: () => void; footer?: ReactNode; variant?: 'own' | 'shared' }) {
  const [heart, connection] = draws.map((draw) => ({ draw, ...getInterpretation(draw, 'love') }));
  const sections = [heart, connection];
  return <section className="tarot-result" aria-labelledby="result-heading">
    <p className="result-eyebrow">{variant === 'shared' ? 'A shared' : 'Your'} love reading · Heart and connection</p>
    <h2 id="result-heading">{heart.draw.card.name} <span aria-hidden="true">&amp;</span><span className="sr-only">and</span> {connection.draw.card.name}</h2>
    <p className="result-keywords">{[...heart.draw.card.keywords.slice(0, 1), ...connection.draw.card.keywords.slice(0, 1)].join(' · ')}</p>
    <div className="result-body">
      {sections.map(({ draw, reading }, index) => <div key={draw.cardId}>
        <p className="result-position">{LOVE_POSITIONS[index].label} · {LOVE_POSITIONS[index].prompt}</p>
        <h3>{draw.card.name} <small>{draw.orientation === 'reversed' ? 'Reversed' : 'Upright'}</small></h3>
        <p>{reading}</p>
      </div>)}
      <div><h3>A gentle step</h3><p>{connection.advice}</p></div>
      <div><h3>Questions for your heart</h3><p>{heart.reflection}</p><p className="result-note">{connection.reflection}</p></div>
    </div>
    {footer}
    {onAgain && <button className="button button-primary" type="button" onClick={onAgain}>Draw again <span aria-hidden="true">↗</span></button>}
    <p className="result-disclaimer">A love reading is a prompt for self-reflection. It cannot tell you what another person feels or will do.</p>
  </section>;
}
