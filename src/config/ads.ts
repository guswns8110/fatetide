/**
 * Advertising switch, split into two independent gates:
 *   - `client`: a well-formed PUBLIC_ADSENSE_CLIENT (ca-pub-<digits>) alone. Used for the
 *     site-verification meta tag and for loading the AdSense base script (BaseLayout.astro).
 *     Google does not serve ads from that script until the AdSense account is approved, and its
 *     review process commonly expects the base script to already be present on the site.
 *   - `active`: requires BOTH PUBLIC_ADSENSE_ENABLED=true AND a valid client. This is the
 *     stricter switch that gates manual ad slots (AdSlot.astro) — real ad units stay off until
 *     this is explicitly turned on, independent of whether the base script is loaded.
 */
export interface AdsConfig {
  /** A well-formed publisher ID, whether or not ads are enabled (site verification + base script). */
  client: string;
  /** True only when ads are explicitly enabled and the client ID is valid (gates manual ad slots). */
  active: boolean;
}

const CLIENT_PATTERN = /^ca-pub-\d{10,20}$/;

export function resolveAdsConfig(enabled: unknown, client: unknown): AdsConfig {
  const id = typeof client === 'string' ? client.trim() : '';
  const validClient = CLIENT_PATTERN.test(id) ? id : '';
  return { client: validClient, active: enabled === 'true' && validClient !== '' };
}

export const ads = resolveAdsConfig(import.meta.env.PUBLIC_ADSENSE_ENABLED, import.meta.env.PUBLIC_ADSENSE_CLIENT);

/** Slot IDs are digits only; anything else is ignored. */
export const isValidSlotId = (value: unknown): value is string => typeof value === 'string' && /^\d{6,20}$/.test(value);
