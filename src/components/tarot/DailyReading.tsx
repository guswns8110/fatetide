import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { DrawnCard } from '../../data/tarot/types';
import { formatDateKey } from '../../utils/horoscope';
import { drawCards, getDateKey, parseDailyRecord, serializeDailyRecord } from '../../utils/tarot';
import DailyResult from './DailyResult';
import ShareReading from './ShareReading';
import TarotCard from './TarotCard';

type Stage = 'loading' | 'ready' | 'shuffling' | 'revealing' | 'result';

const STORAGE_KEY = 'oracle:daily-tarot:v1';

function readSaved(today: string): DrawnCard | null {
  try { return parseDailyRecord(window.localStorage.getItem(STORAGE_KEY), today); } catch { return null; }
}

function save(draw: DrawnCard, today: string): boolean {
  try { window.localStorage.setItem(STORAGE_KEY, serializeDailyRecord(draw, today)); return true; } catch { return false; }
}

export interface DailyResultContext {
  draw: DrawnCard;
  dateKey: string;
  saved: boolean;
  /** The Share My Reading block, for a custom result to place where it likes. */
  footer: ReactNode;
}

interface Props {
  artworkIds: string[];
  /** Replaces the default result view (used by Today's Fortune). The draw, storage, and share logic stay here. */
  renderResult?: (context: DailyResultContext) => ReactNode;
  /** Extra content shown below the reading, inside the same panel. */
  below?: ReactNode;
  /** Show the local date above the reading. */
  showDate?: boolean;
}

export default function DailyReading({ artworkIds, renderResult, below, showDate = false }: Props) {
  const [stage, setStage] = useState<Stage>('loading');
  const [draw, setDraw] = useState<DrawnCard | null>(null);
  const [today, setToday] = useState('');
  const [saved, setSaved] = useState(true);
  const locked = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const key = getDateKey();
    const existing = readSaved(key);
    setToday(key);
    if (existing) { setDraw(existing); setStage('result'); } else { setStage('ready'); }
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);
  const duration = (normal: number) => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : normal;

  function drawToday() {
    if (locked.current || stage !== 'ready') return;
    locked.current = true;
    const key = getDateKey();
    // Another tab may have drawn today's card since this page loaded.
    const next = readSaved(key) ?? drawCards(1, undefined, 'daily')[0];
    setToday(key);
    setSaved(save(next, key));
    setDraw(next);
    setStage('shuffling');
    timer.current = setTimeout(() => {
      setStage('revealing');
      timer.current = setTimeout(() => { setStage('result'); locked.current = false; }, duration(650));
    }, duration(650));
  }

  return <div className="one-card-app">
    <div className="reading-panel">
      {showDate && today && <p className="today-date">{formatDateKey(today)}</p>}
      {stage === 'loading' && <p className="daily-status" role="status">Checking for today's card...</p>}
      {stage === 'ready' && <div className="start-actions"><button type="button" className="button button-primary" onClick={drawToday}>Draw today's card <span aria-hidden="true">↗</span></button><p>One card a day. Once drawn, it stays with you until tomorrow.</p></div>}
      {stage === 'shuffling' && <div className="draw-stage" role="status" aria-live="polite"><div className="shuffle-stack"><TarotCard /><TarotCard /><TarotCard /></div><p>Drawing your card...</p></div>}
      {(stage === 'revealing' || stage === 'result') && draw && <div className="reveal-stage daily-reveal"><TarotCard card={draw.card} flipped useImage={artworkIds.includes(draw.card.id)} orientation={draw.orientation} /><p className="card-orientation">{draw.orientation === 'reversed' ? '↧ Reversed' : '↑ Upright'}</p></div>}
      {stage === 'result' && draw && (() => {
        const footer = <ShareReading reading={{ type: 'daily', category: 'general', draws: [draw], date: today }} />;
        return renderResult ? renderResult({ draw, dateKey: today, saved, footer }) : <DailyResult draw={draw} dateKey={today} saved={saved} footer={footer} />;
      })()}
      {below}
      <span className="sr-only" role="status" aria-live="polite">{stage === 'result' && draw ? `Your card for today is ${draw.card.name}, ${draw.orientation}.` : ''}</span>
    </div>
  </div>;
}
