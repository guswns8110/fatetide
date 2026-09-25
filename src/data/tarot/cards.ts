import { majorCards } from './major';
import { minorCards } from './minor';
import type { TarotCard } from './types';

export const tarotCards: TarotCard[] = [...majorCards, ...minorCards];
export const tarotCardsById = new Map(tarotCards.map((card) => [card.id, card]));
