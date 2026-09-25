export const PROJECT_NAME = 'Oracle';
export const SITE_TAGLINE = 'Tarot, horoscope, and zodiac compatibility for reflection';
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

export const tarotReadings = [
  { label: 'One Card', href: '/tarot/one-card/', symbol: '✦', tag: 'A quiet beginning', text: 'A single card for a new perspective on the moment.' },
  { label: 'Yes or No', href: '/tarot/yes-or-no/', symbol: '◐', tag: 'A little clarity', text: 'A graded answer with room for nuance.' },
  { label: 'Three Card', href: '/tarot/three-card/', symbol: '✧', tag: 'A wider perspective', text: 'Past, present, and future in one wider view.' },
  { label: 'Love', href: '/tarot/love/', symbol: '♡', tag: 'For matters of the heart', text: 'Two cards for your heart and the connection.' },
  { label: 'Daily', href: '/tarot/daily/', symbol: '☀', tag: 'A daily ritual', text: 'One card a day, saved on your device.' },
] as const;

export interface NavItem {
  label: string;
  href: string;
  /** Extra path prefixes that also mark this item as the current section. */
  sections?: readonly string[];
  children?: readonly { label: string; href: string }[];
}

export const primaryNavigation: readonly NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Tarot', href: '/tarot/', children: tarotReadings.map(({ label, href }) => ({ label, href })) },
  { label: 'Horoscope', href: '/horoscope/', sections: ['/zodiac'] },
  { label: 'Compatibility', href: '/compatibility/' },
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
