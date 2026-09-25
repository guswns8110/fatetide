import { useEffect, useState } from 'react';
import type { ReadingType } from '../../data/tarot/types';
import { decodeReading, type SharedReading } from '../../utils/shareReading';
import { LOVE_POSITIONS, THREE_CARD_POSITIONS } from '../../utils/tarot';
import DailyResult from './DailyResult';
import LoveResult from './LoveResult';
import SpreadCards from './SpreadCards';
import TarotCard from './TarotCard';
import TarotResult from './TarotResult';
import ThreeCardResult from './ThreeCardResult';
import YesNoResult from './YesNoResult';

type State = { status: 'loading' } | { status: 'valid'; reading: SharedReading } | { status: 'invalid' };

const ownReading: Record<ReadingType, { label: string; href: string }> = {
  'one-card': { label: 'Draw Your Own Card', href: '/tarot/one-card/' },
  'yes-or-no': { label: 'Ask Your Own Question', href: '/yes-or-no/' },
  'three-card': { label: 'Draw Your Three Cards', href: '/tarot/three-card/' },
  love: { label: 'Try Your Own Love Reading', href: '/tarot/love/' },
  daily: { label: "See Today's Fortune", href: '/today/' },
};

function Actions({ label, href }: { label: string; href: string }) {
  return <div className="shared-actions">
    <a className="button button-primary" href={href}>{label} <span aria-hidden="true">↗</span></a>
    <a className="shared-explore" href="/#readings">Explore all readings</a>
  </div>;
}

export default function SharedReadingView({ artworkIds }: { artworkIds: string[] }) {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    const result = decodeReading(window.location.search);
    if (result.ok) {
      setState({ status: 'valid', reading: result.reading });
    } else {
      if (import.meta.env.DEV) console.debug('Shared reading link rejected:', result.reason);
      setState({ status: 'invalid' });
    }
  }, []);

  return <div className="one-card-app shared-app">
    <div className="reading-panel">
      {state.status === 'loading' && <p className="daily-status" role="status">Opening the reading...</p>}
      {state.status === 'invalid' && <section className="tarot-result shared-invalid" aria-labelledby="shared-invalid-heading">
        <h2 id="shared-invalid-heading">This reading link is invalid or incomplete.</h2>
        <p className="result-keywords">The link may have been cut off when it was copied. You can start a reading of your own instead.</p>
        <Actions label="Start a New Reading" href="/tarot/one-card/" />
      </section>}
      {state.status === 'valid' && <SharedResult reading={state.reading} artworkIds={artworkIds} />}
    </div>
  </div>;
}

function SharedResult({ reading, artworkIds }: { reading: SharedReading; artworkIds: string[] }) {
  const { type, category, draws, date } = reading;
  const cta = ownReading[type];
  const footer = <Actions label={cta.label} href={cta.href} />;
  const [first] = draws;
  const multi = type === 'three-card' || type === 'love';

  return <>
    <div className="reveal-stage daily-reveal">
      {multi
        ? <SpreadCards draws={draws} positions={type === 'love' ? LOVE_POSITIONS : THREE_CARD_POSITIONS} flipped artworkIds={artworkIds} />
        : <>
          <TarotCard card={first.card} flipped useImage={artworkIds.includes(first.card.id)} orientation={first.orientation} />
          <p className="card-orientation">{first.orientation === 'reversed' ? '↧ Reversed' : '↑ Upright'}</p>
        </>}
    </div>
    {type === 'one-card' && <TarotResult draw={first} category={category} variant="shared" footer={footer} />}
    {type === 'yes-or-no' && <YesNoResult draw={first} variant="shared" footer={footer} />}
    {type === 'three-card' && <ThreeCardResult draws={draws} category={category} variant="shared" footer={footer} />}
    {type === 'love' && <LoveResult draws={draws} variant="shared" footer={footer} />}
    {type === 'daily' && <DailyResult draw={first} dateKey={date} variant="shared" footer={footer} />}
    <span className="sr-only" role="status" aria-live="polite">{`Shared reading: ${draws.map((draw) => `${draw.card.name}, ${draw.orientation}`).join('; ')}.`}</span>
  </>;
}
