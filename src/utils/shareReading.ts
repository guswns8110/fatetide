import { tarotCardsById } from '../data/tarot/cards';
import type { DrawnCard, Orientation, ReadingCategory, ReadingType } from '../data/tarot/types';
import { LOVE_POSITIONS, THREE_CARD_POSITIONS } from './tarot';

/**
 * Serverless share links. A link stores only stable identifiers (reading type, card IDs,
 * orientations, category, optional Daily date). Interpretations are always rebuilt from the
 * local tarot data, and no user-entered text is ever serialized.
 *
 * /tarot/shared/?v=1&t=<readingType>&cards=<id>.<u|r>[,...][&c=<category>][&d=<YYYY-MM-DD>]
 */

export const SHARE_FORMAT_VERSION = 1;
export const SHARE_PATH = '/tarot/shared/';
export const MAX_SHARE_QUERY_LENGTH = 400;

export interface SharedReading {
  type: ReadingType;
  category: ReadingCategory;
  draws: DrawnCard[];
  /** Daily only: local date (YYYY-MM-DD) the card was drawn. Display-only. */
  date?: string;
}

export type DecodeError =
  | 'malformed'
  | 'too-long'
  | 'missing-param'
  | 'duplicate-param'
  | 'bad-version'
  | 'bad-type'
  | 'bad-category'
  | 'bad-card-count'
  | 'bad-card-id'
  | 'bad-orientation'
  | 'duplicate-card';

export type DecodeResult = { ok: true; reading: SharedReading } | { ok: false; reason: DecodeError };

export const SHARE_READING_TYPES = ['one-card', 'yes-or-no', 'three-card', 'love', 'daily'] as const satisfies readonly ReadingType[];
const CATEGORIES: readonly ReadingCategory[] = ['general', 'love', 'career', 'money'];
const CARD_COUNTS: Record<ReadingType, number> = { 'one-card': 1, 'yes-or-no': 1, 'three-card': 3, love: 2, daily: 1 };
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ORIENTATION_CODE: Record<Orientation, 'u' | 'r'> = { upright: 'u', reversed: 'r' };

function isReadingType(value: string): value is ReadingType {
  return (SHARE_READING_TYPES as readonly string[]).includes(value);
}

function isCategory(value: string): value is ReadingCategory {
  return (CATEGORIES as readonly string[]).includes(value);
}

/** Only One Card and Three Card let the user pick a category; the others have a fixed one. */
function usesChosenCategory(type: ReadingType): boolean {
  return type === 'one-card' || type === 'three-card';
}

export function categoryForType(type: ReadingType, chosen?: ReadingCategory): ReadingCategory {
  if (type === 'love') return 'love';
  return usesChosenCategory(type) && chosen ? chosen : 'general';
}

export function isValidShareDate(value: string): boolean {
  if (!DATE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function positionFor(type: ReadingType, index: number): string | undefined {
  if (type === 'three-card') return THREE_CARD_POSITIONS[index]?.id;
  if (type === 'love') return LOVE_POSITIONS[index]?.id;
  return undefined;
}

/** Serializes a reading to a query string without the leading "?". Only IDs and codes are written. */
export function encodeReading(reading: SharedReading): string {
  const cards = reading.draws.map((draw) => `${encodeURIComponent(draw.cardId)}.${ORIENTATION_CODE[draw.orientation]}`).join(',');
  const parts = [`v=${SHARE_FORMAT_VERSION}`, `t=${encodeURIComponent(reading.type)}`];
  if (usesChosenCategory(reading.type)) parts.push(`c=${encodeURIComponent(reading.category)}`);
  parts.push(`cards=${cards}`);
  if (reading.type === 'daily' && reading.date && isValidShareDate(reading.date)) parts.push(`d=${reading.date}`);
  return parts.join('&');
}

export function buildShareUrl(reading: SharedReading, origin: string): string {
  return `${origin.replace(/\/+$/, '')}${SHARE_PATH}?${encodeReading(reading)}`;
}

/** Restores a reading from a query string. Never throws; malformed input yields `{ ok: false }`. */
export function decodeReading(search: unknown): DecodeResult {
  try {
    return decode(search);
  } catch {
    return { ok: false, reason: 'malformed' };
  }
}

function decode(search: unknown): DecodeResult {
  if (typeof search !== 'string') return { ok: false, reason: 'malformed' };
  const query = search.startsWith('?') ? search.slice(1) : search;
  if (query.length > MAX_SHARE_QUERY_LENGTH) return { ok: false, reason: 'too-long' };

  const params = new URLSearchParams(query);
  const single = (name: string): string | DecodeError => {
    const values = params.getAll(name);
    if (values.length > 1) return 'duplicate-param';
    return values[0] || 'missing-param';
  };
  const fail = (value: string): value is DecodeError => value === 'duplicate-param' || value === 'missing-param';

  const version = single('v');
  if (fail(version)) return { ok: false, reason: version };
  if (version !== String(SHARE_FORMAT_VERSION)) return { ok: false, reason: 'bad-version' };

  const type = single('t');
  if (fail(type)) return { ok: false, reason: type };
  if (!isReadingType(type)) return { ok: false, reason: 'bad-type' };

  let category: ReadingCategory = categoryForType(type);
  if (usesChosenCategory(type)) {
    const chosen = single('c');
    if (fail(chosen)) return { ok: false, reason: chosen };
    if (!isCategory(chosen)) return { ok: false, reason: 'bad-category' };
    category = chosen;
  }

  const cardsValue = single('cards');
  if (fail(cardsValue)) return { ok: false, reason: cardsValue };
  const entries = cardsValue.split(',');
  if (entries.length !== CARD_COUNTS[type]) return { ok: false, reason: 'bad-card-count' };

  const draws: DrawnCard[] = [];
  const seen = new Set<string>();
  for (const [index, entry] of entries.entries()) {
    const dot = entry.lastIndexOf('.');
    const id = dot === -1 ? entry : entry.slice(0, dot);
    const code = dot === -1 ? '' : entry.slice(dot + 1);
    if (code !== 'u' && code !== 'r') return { ok: false, reason: 'bad-orientation' };
    const card = SLUG.test(id) ? tarotCardsById.get(id) : undefined;
    if (!card) return { ok: false, reason: 'bad-card-id' };
    if (seen.has(card.id)) return { ok: false, reason: 'duplicate-card' };
    seen.add(card.id);
    const spreadPosition = positionFor(type, index);
    draws.push({
      card,
      cardId: card.id,
      orientation: code === 'u' ? 'upright' : 'reversed',
      readingType: type,
      ...(spreadPosition ? { spreadPosition } : {}),
    });
  }

  const reading: SharedReading = { type, category, draws };
  // A bad or repeated date only drops the date; the reading itself is still valid.
  if (type === 'daily' && params.getAll('d').length === 1 && isValidShareDate(params.get('d') ?? '')) reading.date = params.get('d') as string;
  return { ok: true, reading };
}

export const SHARE_TITLE = 'My Tarot Reading ✨';

/** Title and text for the native share sheet. The URL is passed separately, not repeated in the text. */
export function buildShareText(reading: SharedReading): { title: string; text: string } {
  const names = reading.draws.map((draw) => draw.card.name);
  const first = reading.draws[0];
  const orientation = first?.orientation === 'reversed' ? ' (reversed)' : '';
  const joined = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : (names[0] ?? 'a card');
  let text: string;
  switch (reading.type) {
    case 'one-card': text = `I drew ${joined}${orientation}. See my reading and draw your own.`; break;
    case 'yes-or-no': text = `I asked the cards a question and drew ${joined}${orientation}. See my answer and ask your own.`; break;
    case 'three-card': text = `My past, present, and future: ${joined}. See my reading and draw your own.`; break;
    case 'love': text = `My love reading: ${joined}. See it and draw your own.`; break;
    case 'daily': text = `My tarot card for today is ${joined}${orientation}. See it and get yours.`; break;
  }
  return { title: SHARE_TITLE, text };
}

/**
 * Origin used in share links: the configured site URL when it is a valid http(s) URL,
 * otherwise the page's own origin. Path, query and trailing slashes are dropped.
 */
export function resolveShareOrigin(configured: string | null | undefined, fallbackOrigin: string): string {
  const candidate = (configured ?? '').trim();
  if (candidate) {
    try {
      const url = new URL(candidate);
      if ((url.protocol === 'https:' || url.protocol === 'http:') && url.hostname) return url.origin;
    } catch {
      // Fall through to the page origin.
    }
  }
  return fallbackOrigin.replace(/\/+$/, '');
}
