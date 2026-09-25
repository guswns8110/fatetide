export const PROJECT_NAME = 'FateTide';
export const SITE_TAGLINE = 'Yes or No tarot and today\'s fortune, made for reflection';
export const SITE_URL = import.meta.env.PUBLIC_SITE_URL || '';

/**
 * The validated origin of the deployed site (for example https://example.com), or '' when
 * PUBLIC_SITE_URL is unset or not a valid http(s) URL. Canonical links, Open Graph URLs,
 * structured data and the sitemap are only produced when this is set, so no placeholder
 * domain ever reaches the output.
 */
function toOrigin(value: string): string {
  try {
    const url = new URL(value.trim());
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.hostname ? url.origin : '';
  } catch {
    return '';
  }
}
export const SITE_ORIGIN = toOrigin(SITE_URL);

/** Shared social preview image (1200 x 630 JPEG in /public). Regenerate it if the site name changes. */
export const OG_IMAGE_PATH = '/og-default.jpg';

/** Optional public contact address. Leave PUBLIC_CONTACT_EMAIL unset to hide contact details. */
const email = (import.meta.env.PUBLIC_CONTACT_EMAIL || '').trim();
export const CONTACT_EMAIL = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(email) ? email : '';

/** Shown on policy pages. Update it whenever a policy page changes materially. */
export const POLICY_UPDATED = 'September 26, 2026';

/**
 * The two things visitors see: Yes or No, and Today's Fortune. Everything else (One Card, Three
 * Card, Love, the Tarot hub) still works at its old address but is not linked from the main
 * navigation or the homepage.
 */
export const tarotReadings = [
  { label: 'Yes or No', href: '/yes-or-no/', core: true, symbol: '◐', tag: 'A little clarity', text: 'Ask a question. Draw one card.' },
  { label: "Today's Fortune", href: '/today/', core: true, symbol: '☀', tag: 'A daily ritual', text: 'A card and a little guidance for the day ahead.' },
  { label: 'One Card', href: '/tarot/one-card/', core: false, symbol: '✦', tag: 'A quiet beginning', text: 'A single card for a new perspective on the moment.' },
  { label: 'Three Card', href: '/tarot/three-card/', core: false, symbol: '✧', tag: 'A wider perspective', text: 'Past, present, and future in one wider view.' },
  { label: 'Love', href: '/tarot/love/', core: false, symbol: '♡', tag: 'For matters of the heart', text: 'Two cards for your heart and the connection.' },
] as const;

export interface NavItem {
  label: string;
  href: string;
}

/** Main navigation: just the two core pages. */
export const primaryNavigation: readonly NavItem[] = [
  { label: 'Yes or No', href: '/yes-or-no/' },
  { label: 'Today', href: '/today/' },
];

export interface Crumb {
  name: string;
  /** Absolute path on this site, e.g. /tarot/. */
  path: string;
}

export const policyLinks = [
  { label: 'About', href: '/about/' },
  { label: 'How it works', href: '/how-it-works/' },
  { label: 'Privacy', href: '/privacy/' },
  { label: 'Terms', href: '/terms/' },
  { label: 'Disclaimer', href: '/disclaimer/' },
] as const;
