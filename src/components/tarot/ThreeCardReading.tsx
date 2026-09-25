import { useEffect, useRef, useState } from 'react';
import type { DrawnCard, ReadingCategory } from '../../data/tarot/types';
import { THREE_CARD_POSITIONS, drawThreeCardSpread } from '../../utils/tarot';
import CategorySelector from './CategorySelector';
import ShareReading from './ShareReading';
import SpreadCards from './SpreadCards';
import TarotCard from './TarotCard';
import ThreeCardResult from './ThreeCardResult';

type Stage = 'idle' | 'ready' | 'shuffling' | 'facedown' | 'revealing' | 'result';

export default function ThreeCardReading({ artworkIds }: { artworkIds: string[] }) {
  const [stage, setStage] = useState<Stage>('idle');
  const [category, setCategory] = useState<ReadingCategory | null>(null);
  const [draws, setDraws] = useState<DrawnCard[]>([]);
  const locked = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const duration = (normal: number) => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : normal;

  function selectCategory(next: ReadingCategory) {
    if (locked.current) return;
    setCategory(next);
    setStage('ready');
  }

  function shuffle() {
    if (locked.current || !category || stage !== 'ready') return;
    locked.current = true;
    setStage('shuffling');
    setDraws(drawThreeCardSpread());
    timer.current = setTimeout(() => { setStage('facedown'); locked.current = false; }, duration(650));
  }

  function reveal() {
    if (locked.current || stage !== 'facedown') return;
    locked.current = true;
    setStage('revealing');
    timer.current = setTimeout(() => { setStage('result'); locked.current = false; }, duration(650));
  }

  function again() {
    if (locked.current || stage !== 'result') return;
    setDraws([]);
    setStage(category ? 'ready' : 'idle');
  }

  const showSpread = (stage === 'facedown' || stage === 'revealing' || stage === 'result') && draws.length === THREE_CARD_POSITIONS.length;

  return <div className="one-card-app">
    <div className="reading-panel">
      <div className="panel-heading"><span className="step-count">01 / 03</span><p>First, choose a focus</p></div>
      <CategorySelector selected={category} onSelect={selectCategory} disabled={stage !== 'idle' && stage !== 'ready'} />
      {(stage === 'idle' || stage === 'ready') && <div className="start-actions"><button type="button" className="button button-primary" disabled={!category} onClick={shuffle}>Shuffle the Cards <span aria-hidden="true">↗</span></button><p>Three cards will be drawn: past, present, and future.</p></div>}
      {stage === 'shuffling' && <div className="draw-stage" role="status" aria-live="polite"><p className="step-count">02 / 03 · SHUFFLING</p><div className="shuffle-stack"><TarotCard /><TarotCard /><TarotCard /></div><p>Gathering the cards...</p></div>}
      {showSpread && <div className="reveal-stage">
        <p className="step-count">{stage === 'facedown' ? '02 / 03 · YOUR SPREAD' : '03 / 03 · YOUR CARDS'}</p>
        <SpreadCards draws={draws} positions={THREE_CARD_POSITIONS} flipped={stage !== 'facedown'} artworkIds={artworkIds} />
        {stage === 'facedown' && <div className="start-actions"><button type="button" className="button button-primary" onClick={reveal}>Reveal my cards <span aria-hidden="true">↗</span></button></div>}
      </div>}
      {stage === 'result' && category && <ThreeCardResult draws={draws} category={category} onAgain={again} footer={<ShareReading reading={{ type: 'three-card', category, draws }} />} />}
      <span className="sr-only" role="status" aria-live="polite">{stage === 'result' ? `Your cards are ${draws.map((draw, i) => `${THREE_CARD_POSITIONS[i].label}: ${draw.card.name}, ${draw.orientation}`).join('; ')}.` : ''}</span>
    </div>
  </div>;
}
