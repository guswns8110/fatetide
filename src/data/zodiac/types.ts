export type Element = 'fire' | 'earth' | 'air' | 'water';
export type Modality = 'cardinal' | 'fixed' | 'mutable';

export const DAILY_SECTIONS = ['general', 'love', 'career', 'money', 'advice'] as const;
export type DailySection = (typeof DAILY_SECTIONS)[number];

/**
 * Short clauses used to compose compatibility text. `communication`, `love`, `emotional` and
 * `friction` are verb phrases that follow the sign name ("Aries speaks plainly..."); `need` is a
 * noun phrase ("...may benefit from room to lead").
 */
export interface CompatTraits {
  communication: string;
  love: string;
  emotional: string;
  friction: string;
  need: string;
}

export interface ZodiacSign {
  id: string;
  name: string;
  symbol: string;
  dateRange: string;
  element: Element;
  modality: Modality;
  rulingPlanet: string;
  relatedTarotCard: string;
  descriptor: string;

  overview: string;
  strengths: string[];
  challenges: string[];

  love: string;
  career: string;
  money: string;

  dailyPool: Record<DailySection, string[]>;
  compat: CompatTraits;
}

/** Long-form sections for the zodiac guide pages (see depth.ts). */
export interface ZodiacDepth {
  relationships: string;
  workStyle: string;
  growthPrompts: string[];
}
