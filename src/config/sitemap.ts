import { policyLinks } from './site';
import { zodiacSigns } from '../data/zodiac/signs';

/**
 * Public, indexable pages, with a trailing slash to match the static build output.
 * Deliberately excluded: /tarot/shared/ (private share links), /404, and the de-emphasized
 * Tarot modes (/tarot/, One Card, Three Card, Love), which are noindex.
 * scripts/validate-seo.mjs checks this list against the pages that are actually built.
 */
export const indexablePaths: readonly string[] = [
  '/',
  '/yes-or-no/',
  '/today/',
  '/horoscope/',
  '/compatibility/',
  ...zodiacSigns.map(({ id }) => `/zodiac/${id}/`),
  ...policyLinks.map(({ href }) => href),
];
