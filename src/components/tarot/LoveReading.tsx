import { useEffect, useRef, useState } from 'react';
import type { DrawnCard } from '../../data/tarot/types';
import { LOVE_POSITIONS, drawLoveSpread } from '../../utils/tarot';
import LoveResult from './LoveResult';
import ShareReading from './ShareReading';
import SpreadCards from './SpreadCards';
import TarotCard from './TarotCard';

type Stage = 'ready' | 'shuffling' | 'facedown' | 'revealing' | 'result';

export default function LoveReading({ artworkIds }: { artworkIds: string[] }) {
  const [stage, setStage] = useState<Stage>('ready');
  const [draws, setDraws] = useState<DrawnCard[]>([]);
  const locked = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const duration = (normal: number) => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : normal;

  function shuffle() {
    if (locked.current || stage !== 'ready') return;
    locked.current = true;
    setStage('shuffling');
    setDraws(drawLoveSpread());
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
    setStage('ready');
  }

  const showSpread = (stage === 'facedown' || stage === 'revealing' || stage === 'result') && draws.length === LOVE_POSITIONS.length;

  return <div className="one-card-app">
    <div className="reading-panel">
      <div className="panel-heading"><span className="step-count">01 / 03</span><p>Turn toward your heart</p></div>
      {stage === 'ready' && <div className="start-actions"><button type="button" className="button button-primary" onClick={shuffle}>Shuffle the Cards <span aria-hidden="true">↗</span></button><p>Two cards: one for your heart, one for the connection. Single or partnered, both apply.</p></div>}
      {stage === 'shuffling' && <div className="draw-stage" role="status" aria-live="polite"><p className="step-count">02 / 03 · SHUFFLING</p><div className="shuffle-stack"><TarotCard /><TarotCard /><TarotCard /></div><p>Gathering the cards...</p></div>}
      {showSpread && <div className="reveal-stage">
        <p className="step-count">{stage === 'facedown' ? '02 / 03 · YOUR SPREAD' : '03 / 03 · YOUR CARDS'}</p>
        <SpreadCards draws={draws} positions={LOVE_POSITIONS} flipped={stage !== 'facedown'} artworkIds={artworkIds} />
        {stage === 'facedown' && <div className="start-actions"><button type="button" className="button button-primary" onClick={reveal}>Reveal my cards <span aria-hidden="true">↗</span></button></div>}
      </div>}
      {stage === 'result' && <LoveResult draws={draws} onAgain={again} footer={<ShareReading reading={{ type: 'love', category: 'love', draws }} />} />}
      <span className="sr-only" role="status" aria-live="polite">{stage === 'result' ? `Your cards are ${draws.map((draw, i) => `${LOVE_POSITIONS[i].label}: ${draw.card.name}, ${draw.orientation}`).join('; ')}.` : ''}</span>
    </div>
  </div>;
}
