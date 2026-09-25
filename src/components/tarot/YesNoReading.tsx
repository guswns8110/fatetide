import { useEffect, useRef, useState } from 'react';
import { tarotCards } from '../../data/tarot/cards';
import type { DrawnCard, TarotCard as CardData } from '../../data/tarot/types';
import { drawOrientation, shuffledDeck } from '../../utils/tarot';
import ShareReading from './ShareReading';
import TarotCard from './TarotCard';
import TarotDeck from './TarotDeck';
import YesNoResult from './YesNoResult';

type Stage = 'ready' | 'shuffling' | 'selecting' | 'revealing' | 'result';

export default function YesNoReading({ artworkIds }: { artworkIds: string[] }) {
  const [stage, setStage] = useState<Stage>('ready');
  const [choices, setChoices] = useState<CardData[]>([]);
  const [draw, setDraw] = useState<DrawnCard | null>(null);
  const locked = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const duration = (normal: number) => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : normal;

  function shuffle() {
    if (locked.current || stage !== 'ready') return;
    locked.current = true;
    setStage('shuffling');
    setChoices(shuffledDeck(tarotCards).slice(0, 3));
    timer.current = setTimeout(() => { setStage('selecting'); locked.current = false; }, duration(650));
  }

  function choose(index: number) {
    if (locked.current || stage !== 'selecting' || !choices[index]) return;
    locked.current = true;
    const card = choices[index];
    setDraw({ card, cardId: card.id, orientation: drawOrientation(), readingType: 'yes-or-no' });
    setStage('revealing');
    timer.current = setTimeout(() => { setStage('result'); locked.current = false; }, duration(650));
  }

  function again() {
    if (locked.current || stage !== 'result') return;
    setDraw(null);
    setChoices([]);
    setStage('ready');
  }

  return <div className="one-card-app">
    <div className="reading-panel">
      <div className="panel-heading"><span className="step-count">01 / 03</span><p>Hold your question in mind</p></div>
      {stage === 'ready' && <div className="start-actions"><button type="button" className="button button-primary" onClick={shuffle}>Shuffle the Cards <span aria-hidden="true">↗</span></button><p>Ask an open, sincere question. No need to type it.</p></div>}
      {stage === 'shuffling' && <div className="draw-stage" role="status" aria-live="polite"><p className="step-count">02 / 03 · SHUFFLING</p><div className="shuffle-stack"><TarotCard /><TarotCard /><TarotCard /></div><p>Gathering the cards...</p></div>}
      {stage === 'selecting' && <div className="draw-stage"><p className="step-count">02 / 03 · YOUR CHOICE</p><h2>Choose the card that calls to you.</h2><TarotDeck cards={choices} onChoose={choose} /></div>}
      {(stage === 'revealing' || stage === 'result') && draw && <div className="reveal-stage"><p className="step-count">03 / 03 · YOUR CARD</p><TarotCard card={draw.card} flipped useImage={artworkIds.includes(draw.card.id)} orientation={draw.orientation} /><p className="card-orientation">{draw.orientation === 'reversed' ? '↧ Reversed' : '↑ Upright'}</p></div>}
      {stage === 'result' && draw && <YesNoResult draw={draw} onAgain={again} footer={<ShareReading reading={{ type: 'yes-or-no', category: 'general', draws: [draw] }} />} />}
      <span className="sr-only" role="status" aria-live="polite">{stage === 'result' && draw ? `Your card is ${draw.card.name}, ${draw.orientation}.` : ''}</span>
    </div>
  </div>;
}
