import { aquarius, gemini, libra } from './air';
import { aries, leo, sagittarius } from './fire';
import { capricorn, taurus, virgo } from './earth';
import { cancer, pisces, scorpio } from './water';
import type { ZodiacSign } from './types';

/** Zodiac wheel order, starting with Aries. The index is used to detect opposite signs. */
export const zodiacSigns: readonly ZodiacSign[] = [aries, taurus, gemini, cancer, leo, virgo, libra, scorpio, sagittarius, capricorn, aquarius, pisces];

export const zodiacById: ReadonlyMap<string, ZodiacSign> = new Map(zodiacSigns.map((sign) => [sign.id, sign]));

export function getZodiacSign(id: string | null | undefined): ZodiacSign | undefined {
  return id ? zodiacById.get(id) : undefined;
}

export type { ZodiacSign } from './types';
