import type { APIRoute, GetStaticPaths } from 'astro';
import { indexablePaths } from '../config/sitemap';
import { SITE_ORIGIN } from '../config/site';

/**
 * Serves /sitemap.xml. A sitemap needs absolute URLs, so it is only generated when the real
 * site origin (PUBLIC_SITE_URL) is set; without it no file is emitted rather than a placeholder.
 */
export const getStaticPaths: GetStaticPaths = () => (SITE_ORIGIN ? [{ params: { name: 'sitemap' } }] : []);

export const GET: APIRoute = () => {
  const urls = indexablePaths.map((path) => `  <url><loc>${SITE_ORIGIN}${path}</loc></url>`).join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
