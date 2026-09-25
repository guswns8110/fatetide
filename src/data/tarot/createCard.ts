import type { Suit, TarotCard, YesNoAnswer } from './types';

export interface CardSeed {
  id: string;
  name: string;
  number: number;
  keywords: string;
  upright: string;
  reversed: string;
  love: string;
  career: string;
  money: string;
  advice: string;
  reflection: string;
  yesNo: YesNoAnswer;
}

const reversedAnswer: Record<YesNoAnswer, YesNoAnswer> = {
  yes: 'likely_yes', likely_yes: 'unclear', unclear: 'unclear', likely_no: 'no', no: 'no',
};

export function createCard(seed: CardSeed, suit?: Suit): TarotCard {
  const context = (meaning: string, detail: string) => `${meaning} ${detail}`;
  return {
    id: seed.id,
    name: seed.name,
    arcana: suit ? 'minor' : 'major',
    ...(suit ? { suit } : {}),
    number: seed.number,
    keywords: seed.keywords.split(', '),
    imagePath: `/cards/${seed.id}.webp`,
    upright: {
      general: seed.upright,
      love: context(seed.upright, `In relationships, ${seed.love}`),
      career: context(seed.upright, `At work, ${seed.career}`),
      money: context(seed.upright, `With money, ${seed.money}`),
      advice: seed.advice,
    },
    reversed: {
      general: seed.reversed,
      love: context(seed.reversed, `In relationships, revisit this: ${seed.love}`),
      career: context(seed.reversed, `At work, revisit this: ${seed.career}`),
      money: context(seed.reversed, `With money, revisit this: ${seed.money}`),
      advice: `${seed.advice} Notice where the reversed pattern needs a gentler response.`,
    },
    reflection: seed.reflection,
    yesNo: { upright: seed.yesNo, reversed: reversedAnswer[seed.yesNo] },
  };
}

export function parseSeeds(rows: string): CardSeed[] {
  return rows.trim().split('\n').map((line) => {
    const [id, name, number, keywords, upright, reversed, love, career, money, advice, reflection, yesNo] = line.split('|');
    if ([id, name, number, keywords, upright, reversed, love, career, money, advice, reflection, yesNo].some((part) => !part)) {
      throw new Error(`Incomplete tarot card data: ${id ?? line}`);
    }
    return { id, name, number: Number(number), keywords, upright, reversed, love, career, money, advice, reflection, yesNo: yesNo as YesNoAnswer };
  });
}
