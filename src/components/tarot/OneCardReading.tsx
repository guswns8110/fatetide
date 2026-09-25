import { useEffect, useRef, useState } from 'react';
import { tarotCards } from '../../data/tarot/cards';
import type { DrawnCard, ReadingCategory, TarotCard as CardData } from '../../data/tarot/types';
import { drawOrientation, shuffledDeck } from '../../utils/tarot';
import CategorySelector from './CategorySelector';
import ShareReading from './ShareReading';
import TarotCard from './TarotCard';
import TarotDeck from './TarotDeck';
import TarotResult from './TarotResult';

type Stage = 'idle' | 'ready' | 'shuffling' | 'selecting' | 'revealing' | 'result';

export default function OneCardReading({ artworkIds }: { artworkIds: string[] }) {
  const [stage, setStage] = useState<Stage>('idle');
  const [category, setCategory] = useState<ReadingCategory | null>(null);
  const [choices, setChoices] = useState<CardData[]>([]);
  const [draw, setDraw] = useState<DrawnCard | null>(null);
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
    setChoices(shuffledDeck(tarotCards).slice(0, 3));
    timer.current = setTimeout(() => { setStage('selecting'); locked.current = false; }, duration(650));
  }

  function choose(index: number) {
    if (locked.current || stage !== 'selecting' || !choices[index]) return;
    locked.current = true;
    const card = choices[index];
    setDraw({ card, cardId: card.id, orientation: drawOrientation(), readingType: 'one-card' });
    setStage('revealing');
    timer.current = setTimeout(() => { setStage('result'); locked.current = false; }, duration(650));
  }

  function again() {
    if (locked.current || stage !== 'result') return;
    setDraw(null);
    setChoices([]);
    setStage(category ? 'ready' : 'idle');
  }

  return <div className="one-card-app">
    <div className="reading-panel">
      <div className="panel-heading"><span className="step-count">01 / 03</span><p>First, choose a focus</p></div>
      <CategorySelector selected={category} onSelect={selectCategory} disabled={stage === 'shuffling' || stage === 'selecting' || stage === 'revealing' || stage === 'result'} />
      {(stage === 'idle' || stage === 'ready') && <div className="start-actions"><button type="button" className="button button-primary" disabled={!category} onClick={shuffle}>Shuffle the Cards <span aria-hidden="true">↗</span></button><p>Take a breath. When you are ready, begin.</p></div>}
      {stage === 'shuffling' && <div className="draw-stage" role="status" aria-live="polite"><p className="step-count">02 / 03 · SHUFFLING</p><div className="shuffle-stack"><TarotCard /><TarotCard /><TarotCard /></div><p>Gathering the cards...</p></div>}
      {stage === 'selecting' && <div className="draw-stage"><p className="step-count">02 / 03 · YOUR CHOICE</p><h2>Choose the card that calls to you.</h2><TarotDeck cards={choices} onChoose={choose} /></div>}
      {(stage === 'revealing' || stage === 'result') && draw && <div className="reveal-stage"><p className="step-count">03 / 03 · YOUR CARD</p><TarotCard card={draw.card} flipped useImage={artworkIds.includes(draw.card.id)} orientation={draw.orientation} /><p className="card-orientation">{draw.orientation === 'reversed' ? '↧ Reversed' : '↑ Upright'}</p></div>}
      {stage === 'result' && draw && category && <TarotResult draw={draw} category={category} onAgain={again} footer={<ShareReading reading={{ type: 'one-card', category, draws: [draw] }} />} />}
      <span className="sr-only" role="status" aria-live="polite">{stage === 'result' && draw ? `Your card is ${draw.card.name}, ${draw.orientation}.` : ''}</span>
    </div>
  </div>;
}
