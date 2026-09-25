import ZodiacToday from '../horoscope/ZodiacToday';
import DailyReading from './DailyReading';
import TodayResult from './TodayResult';

/** Today's Fortune: the existing Daily Tarot (same draw, storage, and share logic) plus an optional zodiac horoscope. */
export default function TodayFortune({ artworkIds }: { artworkIds: string[] }) {
  return <DailyReading
    artworkIds={artworkIds}
    showDate
    renderResult={({ draw, saved, footer }) => <TodayResult draw={draw} saved={saved} footer={footer} />}
    below={<ZodiacToday />}
  />;
}
