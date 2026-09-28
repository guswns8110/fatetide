import { guides, policyLinks } from './site';
import { zodiacSigns } from '../data/zodiac/signs';

/**
 * Public, indexable pages, with a trailing slash to match the static build output.
 * Deliberately excluded: /tarot/shared/ (private share links), /404, and /compatibility/
 * (selector-driven, little independent static content; noindex, follow — see compatibility.astro).
 * scripts/validate-seo.mjs checks this list against the pages that are actually built.
 */
export const indexablePaths: readonly string[] = [
  '/',
  '/yes-or-no/',
  '/today/',
  '/guides/',
  ...guides.map(({ href }) => href),
  '/horoscope/',
  ...zodiacSigns.map(({ id }) => `/zodiac/${id}/`),
  ...policyLinks.map(({ href }) => href),
];
