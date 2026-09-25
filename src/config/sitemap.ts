import { policyLinks, tarotReadings } from './site';
import { zodiacSigns } from '../data/zodiac/signs';

/**
 * Public, indexable pages, with a trailing slash to match the static build output.
 * Deliberately excluded: /tarot/shared/ (private share links, noindex) and /404.
 * scripts/validate-seo.mjs checks this list against the pages that are actually built.
 */
export const indexablePaths: readonly string[] = [
  '/',
  '/tarot/',
  ...tarotReadings.map(({ href }) => href),
  '/horoscope/',
  '/compatibility/',
  ...zodiacSigns.map(({ id }) => `/zodiac/${id}/`),
  ...policyLinks.map(({ href }) => href),
];
