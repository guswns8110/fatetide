/**
 * Advertising switch. Ads are OFF unless BOTH are true:
 *   PUBLIC_ADSENSE_ENABLED=true  and  PUBLIC_ADSENSE_CLIENT=ca-pub-<digits>
 * With anything else, no Google script is loaded and no ad markup is rendered.
 */
export interface AdsConfig {
  /** A well-formed publisher ID, whether or not ads are enabled (used for site verification). */
  client: string;
  /** True only when ads are explicitly enabled and the client ID is valid. */
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
