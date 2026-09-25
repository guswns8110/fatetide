import type { DrawnCard } from '../../data/tarot/types';
import TarotCard from './TarotCard';

interface SpreadPosition { id: string; label: string }

/** Row of labelled cards for multi-card spreads (Three Card, Love, shared results). */
export default function SpreadCards({ draws, positions, flipped, artworkIds }: { draws: readonly DrawnCard[]; positions: readonly SpreadPosition[]; flipped: boolean; artworkIds: readonly string[] }) {
  return <div className={`spread-row${draws.length === 2 ? ' is-two' : ''}`}>
    {draws.map((draw, index) => {
      const position = positions.find(({ id }) => id === draw.spreadPosition) ?? positions[index];
      return <div className="spread-slot" key={draw.cardId}>
        <p className="spread-label">{position?.label}</p>
        <TarotCard card={draw.card} flipped={flipped} useImage={artworkIds.includes(draw.card.id)} orientation={draw.orientation} />
        <p className="card-orientation">{!flipped ? ' ' : draw.orientation === 'reversed' ? '↧ Reversed' : '↑ Upright'}</p>
      </div>;
    })}
  </div>;
}
