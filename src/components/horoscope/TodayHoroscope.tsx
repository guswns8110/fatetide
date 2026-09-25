import { useEffect, useState } from 'react';
import { DAILY_SECTIONS, type ZodiacSign } from '../../data/zodiac/types';
import { formatDateKey, getDailyHoroscope, getLocalDateKey } from '../../utils/horoscope';

const LABELS = { general: 'General', love: 'Love', career: 'Career', money: 'Money', advice: 'Advice' } as const;

type Props = Pick<ZodiacSign, 'id' | 'name' | 'dailyPool'>;

/** Today's horoscope for one sign. Only that sign's pool is sent to the browser. */
export default function TodayHoroscope({ id, name, dailyPool }: Props) {
  const [today, setToday] = useState('');
  useEffect(() => setToday(getLocalDateKey()), []);

  if (!today) return <p className="daily-status today-placeholder" role="status">Loading today's {name} horoscope...</p>;
  const daily = getDailyHoroscope({ id, dailyPool }, today);
  return <div className="today-horoscope">
    <p className="result-eyebrow">{formatDateKey(today)}</p>
    <div className="result-body">
      {DAILY_SECTIONS.map((section) => <div key={section}><h3>{LABELS[section]}</h3><p>{daily[section]}</p></div>)}
    </div>
  </div>;
}
