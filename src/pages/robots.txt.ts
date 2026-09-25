import type { APIRoute } from 'astro';
import { SITE_ORIGIN } from '../config/site';

/**
 * Crawling is open. /tarot/shared/ is intentionally NOT disallowed: crawlers must be able to
 * fetch it to read its "noindex, follow" meta tag. The sitemap line appears once the real
 * site origin (PUBLIC_SITE_URL) is known.
 */
export const GET: APIRoute = () => {
  const lines = ['User-agent: *', 'Allow: /', ''];
  if (SITE_ORIGIN) lines.push(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`, '');
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
