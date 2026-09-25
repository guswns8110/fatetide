import { tarotCards, tarotCardsById } from '../data/tarot/cards';
import type { DrawnCard, Orientation, ReadingCategory, ReadingType, TarotCard, YesNoAnswer } from '../data/tarot/types';
import { fisherYates, randomInt } from './random';

export const REVERSED_CARD_PROBABILITY = 0.35;
const ORIENTATION_SCALE = 10_000;

export function drawOrientation(): Orientation {
  return randomInt(ORIENTATION_SCALE) < REVERSED_CARD_PROBABILITY * ORIENTATION_SCALE ? 'reversed' : 'upright';
}

export function shuffledDeck(cards: readonly TarotCard[] = tarotCards): TarotCard[] {
  return fisherYates(cards);
}

export function drawCards(count: number, cards: readonly TarotCard[] = tarotCards, readingType: ReadingType = 'one-card'): DrawnCard[] {
  if (!Number.isSafeInteger(count) || count < 0 || count > cards.length) throw new RangeError('Invalid draw count');
  return shuffledDeck(cards).slice(0, count).map((card) => ({
    card,
    cardId: card.id,
    orientation: drawOrientation(),
    readingType,
  }));
}

export function getInterpretation(draw: DrawnCard, category: ReadingCategory) {
  const interpretation = draw.card[draw.orientation];
  return { reading: interpretation[category], advice: interpretation.advice, reflection: draw.card.reflection };
}

export const THREE_CARD_POSITIONS = [
  { id: 'past', label: 'Past', prompt: 'What has shaped this situation' },
  { id: 'present', label: 'Present', prompt: 'What is asking for your attention now' },
  { id: 'future', label: 'Future', prompt: 'What may be worth preparing for' },
] as const;

export function drawThreeCardSpread(cards: readonly TarotCard[] = tarotCards): DrawnCard[] {
  return drawCards(THREE_CARD_POSITIONS.length, cards, 'three-card').map((draw, index) => ({ ...draw, spreadPosition: THREE_CARD_POSITIONS[index].id }));
}

export const YES_NO_ANSWERS: Record<YesNoAnswer, { label: string; summary: string }> = {
  yes: { label: 'Yes', summary: 'The energy around your question leans clearly supportive.' },
  likely_yes: { label: 'Likely yes', summary: 'The cards lean supportive, with some details still worth checking.' },
  unclear: { label: 'Unclear', summary: 'The picture is mixed. More information or time may help.' },
  likely_no: { label: 'Likely no', summary: 'The cards lean cautious. Consider what needs to change first.' },
  no: { label: 'No', summary: 'The energy suggests holding back, or looking for another path.' },
};

export function getYesNoAnswer(draw: DrawnCard) {
  return { answer: draw.card.yesNo[draw.orientation], ...YES_NO_ANSWERS[draw.card.yesNo[draw.orientation]] };
}

export const LOVE_POSITIONS = [
  { id: 'heart', label: 'Your heart', prompt: 'What you are feeling and needing' },
  { id: 'connection', label: 'The connection', prompt: 'What is shaping how you relate' },
] as const;

export function drawLoveSpread(cards: readonly TarotCard[] = tarotCards): DrawnCard[] {
  return drawCards(LOVE_POSITIONS.length, cards, 'love').map((draw, index) => ({ ...draw, spreadPosition: LOVE_POSITIONS[index].id }));
}

/** Local calendar date as YYYY-MM-DD, used as the Daily Tarot key. */
export function getDateKey(date: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export interface DailyRecord { date: string; cardId: string; orientation: Orientation }

/** Returns the saved draw only if it is well-formed, from `today`, and refers to a real card. */
export function parseDailyRecord(raw: string | null, today: string): DrawnCard | null {
  if (!raw) return null;
  try {
    const record = JSON.parse(raw) as Partial<DailyRecord> | null;
    if (!record || record.date !== today || (record.orientation !== 'upright' && record.orientation !== 'reversed')) return null;
    const card = typeof record.cardId === 'string' ? tarotCardsById.get(record.cardId) : undefined;
    return card ? { card, cardId: card.id, orientation: record.orientation, readingType: 'daily' } : null;
  } catch {
    return null;
  }
}

export function serializeDailyRecord(draw: DrawnCard, today: string): string {
  const record: DailyRecord = { date: today, cardId: draw.cardId, orientation: draw.orientation };
  return JSON.stringify(record);
}
