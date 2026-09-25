import { useState } from 'react';
import type { Orientation, TarotCard as Card } from '../../data/tarot/types';

const suitSymbol: Record<string, string> = { cups: '◡', wands: '✦', swords: '⚔︎', pentacles: '◇' };

export default function TarotCard({ card, flipped = false, useImage = false, orientation = 'upright' }: { card?: Card; flipped?: boolean; useImage?: boolean; orientation?: Orientation }) {
  const [imageFailed, setImageFailed] = useState(false);
  const symbol = card?.suit ? suitSymbol[card.suit] : '✷';
  return <span className={`draw-card ${flipped ? 'is-flipped' : ''} ${orientation === 'reversed' ? 'is-reversed' : ''}`} aria-hidden="true">
    <span className="draw-card-rotator">
      <span className="draw-card-face draw-card-back"><span className="draw-card-border"><span className="back-corner top-left">✦</span><span className="back-corner top-right">✦</span><span className="back-sigil">☾<i>✷</i></span><span className="back-corner bottom-left">✦</span><span className="back-corner bottom-right">✦</span></span></span>
      <span className="draw-card-face draw-card-front"><span className="draw-card-border"><span className="front-caption">{card?.arcana === 'major' ? 'MAJOR ARCANA' : card?.suit?.toUpperCase()}</span>{card && useImage && !imageFailed ? <img src={card.imagePath} alt="" onError={() => setImageFailed(true)} /> : <span className="front-sigil">{symbol}<small>✧</small></span>}<span className="front-name">{card?.name}</span></span></span>
    </span>
  </span>;
}
