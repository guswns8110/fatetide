import { DAILY_SECTIONS, type DailySection, type ZodiacSign } from '../data/zodiac/types';

export type DailyHoroscope = Record<DailySection, string>;

/** Local calendar date as YYYY-MM-DD. */
export function getLocalDateKey(date: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 32-bit FNV-1a. Small, dependency-free and identical in every browser and in Node. */
export function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Deterministic daily horoscope: the same date and sign always give the same text, on any device.
 * Each section picks from its own pool with its own hash, so sections do not move in lockstep.
 */
export function getDailyHoroscope(sign: Pick<ZodiacSign, 'id' | 'dailyPool'>, dateKey: string): DailyHoroscope {
  const result = {} as DailyHoroscope;
  for (const section of DAILY_SECTIONS) {
    const pool = sign.dailyPool[section];
    result[section] = pool.length ? pool[hashString(`${dateKey}|${sign.id}|${section}`) % pool.length] : '';
  }
  return result;
}

/** "Saturday, September 26" from a YYYY-MM-DD key. */
export function formatDateKey(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);
