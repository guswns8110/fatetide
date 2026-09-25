export type Orientation = 'upright' | 'reversed';
export type ReadingCategory = 'general' | 'love' | 'career' | 'money';
export type ReadingType = 'one-card' | 'yes-or-no' | 'love' | 'three-card' | 'daily';
export type YesNoAnswer = 'yes' | 'likely_yes' | 'unclear' | 'likely_no' | 'no';
export type Suit = 'cups' | 'wands' | 'swords' | 'pentacles';

export interface Interpretation {
  general: string;
  love: string;
  career: string;
  money: string;
  advice: string;
}

export interface TarotCard {
  id: string;
  name: string;
  arcana: 'major' | 'minor';
  suit?: Suit;
  number: number;
  keywords: string[];
  imagePath: string;
  upright: Interpretation;
  reversed: Interpretation;
  reflection: string;
  yesNo: { upright: YesNoAnswer; reversed: YesNoAnswer };
}

export interface ReadingIdentity {
  cardId: TarotCard['id'];
  orientation: Orientation;
  readingType: ReadingType;
  spreadPosition?: string;
}

export interface DrawnCard extends ReadingIdentity {
  card: TarotCard;
}
