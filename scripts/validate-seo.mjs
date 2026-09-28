import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const ORIGIN = 'https://oracle.example.test';
const root = mkdtempSync(join(tmpdir(), 'oracle-seo-test-'));
const pnpm = process.env.npm_execpath;
if (!pnpm) throw new Error('Run this script with pnpm run test:seo');

const emptyEnv = { PUBLIC_SITE_URL: '', PUBLIC_CONTACT_EMAIL: '', PUBLIC_ADSENSE_CLIENT: '', PUBLIC_ADSENSE_ENABLED: '' };

function build(label, env) {
  const outDir = join(root, label);
  const { useFileEnv, ...vars } = env;
  const childEnv = { ...process.env, ...emptyEnv, ...vars };
  // useFileEnv: let these values come from the committed .env.production, like a real production build.
  if (useFileEnv) { delete childEnv.PUBLIC_ADSENSE_CLIENT; delete childEnv.PUBLIC_ADSENSE_ENABLED; delete childEnv.PUBLIC_CONTACT_EMAIL; }
  const result = spawnSync(process.execPath, [pnpm, 'exec', 'astro', 'build', '--outDir', outDir], { cwd: resolve('.'), encoding: 'utf8', env: childEnv });
  if (result.status !== 0) throw new Error(`build ${label} failed:\n${result.stdout}\n${result.stderr}`);
  return outDir;
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]));
}

/** Built HTML pages keyed by route ("/", "/tarot/love/", "/404"). */
function pages(outDir) {
  const map = new Map();
  for (const file of walk(outDir).filter((f) => f.endsWith('.html'))) {
    const rel = relative(outDir, file).split(sep).join('/');
    const route = rel === 'index.html' ? '/' : rel === '404.html' ? '/404' : `/${rel.replace(/index\.html$/, '')}`;
    map.set(route, readFileSync(file, 'utf8'));
  }
  return map;
}

const decode = (text) => text.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16))).replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(Number(num))).replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const attr = (html, pattern) => { const m = html.match(pattern); return m ? decode(m[1]) : undefined; };
const meta = (html, key, kind = 'name') => attr(html, new RegExp(`<meta ${kind}="${key}" content="([^"]*)"`));
const visibleText = (html) => decode(html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
const count = (html, pattern) => (html.match(pattern) ?? []).length;

function jpegSize(buffer) {
  let i = 2;
  while (i < buffer.length) {
    if (buffer[i] !== 0xff) { i++; continue; }
    const marker = buffer[i + 1];
    if (marker >= 0xc0 && marker <= 0xc3) return { height: buffer.readUInt16BE(i + 5), width: buffer.readUInt16BE(i + 7) };
    i += 2 + buffer.readUInt16BE(i + 2);
  }
  return null;
}

// noindex: private share links, the 404, and Compatibility (selector-driven, little independent
// static content; kept working and linked from zodiac guides, just not promoted in search).
// One Card, Three Card, Love, and the Tarot hub were retired outright: public/_redirects sends
// their old addresses to /yes-or-no/ or / with a 301, and no page is built at them any more.
const NOINDEX = new Set(['/404', '/tarot/shared/', '/compatibility/']);
const HIDDEN_LINKS = ['/compatibility/'];
const LEGACY_ROUTES = {
  '/tarot/yes-or-no/': '/yes-or-no/',
  '/tarot/daily/': '/today/',
  '/tarot/': '/',
  '/tarot/one-card/': '/yes-or-no/',
  '/tarot/three-card/': '/yes-or-no/',
  '/tarot/love/': '/yes-or-no/',
};
const GUIDES = ['/guides/yes-no-tarot/', '/guides/upright-vs-reversed/', '/guides/daily-tarot/'];
const EXPECTED = [
  '/', '/yes-or-no/', '/today/', '/tarot/shared/', '/horoscope/', '/compatibility/',
  '/guides/', ...GUIDES,
  '/about/', '/how-it-works/', '/privacy/', '/terms/', '/disclaimer/', '/404',
  ...['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'].map((id) => `/zodiac/${id}/`),
];
/** Pages expected to carry substantial, independently valuable editorial content (word-count and no-duplication checks). */
const CONTENT_PAGES = ['/yes-or-no/', '/today/', ...GUIDES];
const BREADCRUMB_PAGES = EXPECTED.filter((route) => route !== '/' && !NOINDEX.has(route));
const FORBIDDEN_CONTENT = /coming soon|lorem ipsum|placeholder|\btodo\b|fixme|under construction|\btbd\b|\byou will\b|\byou'll\b|will meet|will fail|will marry|will get rich|destined|soulmate|guaranteed|testimonial/i;

try {
  // ---------------------------------------------------------------- production-like build (origin set)
  const main = build('main', { PUBLIC_SITE_URL: ORIGIN });
  const site = pages(main);
  assert.deepEqual([...site.keys()].sort(), [...EXPECTED].sort(), 'unexpected set of built pages');

  const titles = new Map();
  const descriptions = new Map();
  for (const [route, html] of site) {
    const label = route;
    assert.match(html, /<html lang="en"/, label);
    assert.ok(/<meta name="viewport"/.test(html), label);
    assert.equal(count(html, /<h1[ >]/g), 1, `${label} must have exactly one h1`);
    assert.equal(count(html, /<main[ >]/g), 1, `${label} must have exactly one main`);
    assert.ok(html.includes('class="skip-link"'), `${label} skip link`);

    const title = attr(html, /<title>(.*?)<\/title>/);
    const description = meta(html, 'description');
    assert.ok(title && title.length >= 10 && title.length <= 75, `${label} title length: ${title}`);
    assert.ok(description && description.length >= 50 && description.length <= 200, `${label} description length: ${description?.length}`);
    assert.ok(!titles.has(title), `${label} duplicates the title of ${titles.get(title)}`);
    assert.ok(!descriptions.has(description), `${label} duplicates the description of ${descriptions.get(description)}`);
    titles.set(title, label);
    descriptions.set(description, label);

    // aria-current="page" marks only the exact page, never a whole section (e.g. a zodiac guide is not "Horoscope").
    const mainNav = html.match(/<nav class="site-nav"[\s\S]*?<\/nav>/)?.[0] ?? '';
    const currentLinks = [...mainNav.matchAll(/<a href="([^"]+)"[^>]*aria-current="page"/g)].map((m) => m[1]);
    assert.deepEqual(currentLinks, currentLinks.filter((href) => href === route), `${label} aria-current links: ${currentLinks}`);

    // Social metadata is complete on every page.
    assert.equal(meta(html, 'og:title', 'property'), title, label);
    assert.equal(meta(html, 'og:description', 'property'), description, label);
    assert.equal(meta(html, 'og:type', 'property'), 'website', label);
    assert.ok(meta(html, 'og:site_name', 'property'), label);
    assert.equal(meta(html, 'og:image', 'property'), `${ORIGIN}/og-default.jpg`, label);
    assert.equal(meta(html, 'twitter:card'), 'summary_large_image', label);
    assert.equal(meta(html, 'twitter:image'), `${ORIGIN}/og-default.jpg`, label);

    const robots = meta(html, 'robots');
    const canonical = attr(html, /<link rel="canonical" href="([^"]*)"/);
    const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    if (NOINDEX.has(route)) {
      assert.equal(robots, 'noindex, follow', `${label} must be noindex, follow`);
      assert.equal(canonical, undefined, `${label} should not have a canonical`);
      assert.equal(jsonLdBlocks.length, 0, `${label} should not have structured data`);
    } else {
      assert.equal(robots, undefined, `${label} must be indexable`);
      assert.equal(canonical, `${ORIGIN}${route}`, `${label} canonical`);
      assert.equal(meta(html, 'og:url', 'property'), canonical, label);
      assert.equal(jsonLdBlocks.length, 1, `${label} structured data`);
      const data = JSON.parse(jsonLdBlocks[0]);
      assert.equal(data['@context'], 'https://schema.org');
      const graph = data['@graph'];
      const types = graph.map((node) => node['@type']);
      assert.ok(types.includes('WebPage'), label);
      assert.equal(types.includes('WebSite'), route === '/', `${label} WebSite only on the homepage`);
      assert.ok(!/Review|Rating|Offer|Product|FAQPage|Person|Organization/.test(JSON.stringify(types)), `${label} has an unsupported structured data type`);
      const webPage = graph.find((node) => node['@type'] === 'WebPage');
      assert.equal(webPage.url, canonical);
      assert.equal(webPage.description, description);
      assert.ok(!html.includes('</script><script type="application/ld+json">') && !jsonLdBlocks[0].includes('<'), `${label} JSON-LD must be escaped`);
      const crumbs = graph.find((node) => node['@type'] === 'BreadcrumbList');
      const navMatch = html.match(/<nav class="breadcrumbs[^"]*" aria-label="Breadcrumb">([\s\S]*?)<\/nav>/);
      if (BREADCRUMB_PAGES.includes(route)) {
        assert.ok(crumbs && navMatch, `${label} needs visible and structured breadcrumbs`);
        const visible = [...navMatch[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => decode(m[1].replace(/<[^>]+>/g, '').trim()));
        assert.deepEqual(crumbs.itemListElement.map((item) => item.name), visible, `${label} breadcrumb names match the visible trail`);
        assert.deepEqual(crumbs.itemListElement.map((item) => item.position), visible.map((_, index) => index + 1));
        assert.equal(crumbs.itemListElement.at(-1).item, canonical, `${label} last breadcrumb is the page`);
      } else {
        assert.ok(!crumbs && !navMatch, `${label} should not have breadcrumbs`);
      }
    }
  }

  // Content hygiene: no placeholders, prophecy, mixed-language debris, or repeated paragraphs.
  for (const [route, html] of site) {
    const text = visibleText(html);
    assert.ok(!FORBIDDEN_CONTENT.test(text), `${route}: forbidden wording "${text.match(FORBIDDEN_CONTENT)?.[0]}"`);
    assert.ok(!/[ㄱ-ㆎ가-힣�]/.test(text), `${route}: unexpected characters`);
    assert.ok(!/\bundefined\b|\[object|NaN\b/.test(text), `${route}: leaked value`);
    const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) => visibleText(m[1]).trim()).filter((p) => p.length > 60);
    const repeated = paragraphs.filter((p, i) => paragraphs.indexOf(p) !== i);
    assert.deepEqual(repeated, [], `${route}: repeated paragraphs`);
  }
  assert.ok(!/mailto:/.test([...site.values()].join('')), 'no contact address may appear unless configured');

  // Editorial content: substantial on its own, and not copy-pasted between the new pages.
  const articleBody = (html) => html.match(/<article class="zodiac-article[^"]*">([\s\S]*?)<\/article>/)?.[1] ?? '';
  const seenParagraphs = new Map();
  for (const route of CONTENT_PAGES) {
    const body = articleBody(site.get(route));
    const words = visibleText(body).split(/\s+/).filter(Boolean).length;
    assert.ok(words >= 350, `${route}: only ${words} words of editorial content, expected substantially more than a thin tool page`);
    assert.ok((body.match(/<h2/g) ?? []).length >= 3, `${route}: too few h2 sections for independent, skimmable content`);
    const paragraphs = [...body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) => visibleText(m[1]).trim()).filter((p) => p.length > 50);
    for (const paragraph of paragraphs) {
      assert.ok(!seenParagraphs.has(paragraph) || seenParagraphs.get(paragraph) === route, `${route}: paragraph copied from ${seenParagraphs.get(paragraph)}: "${paragraph.slice(0, 60)}..."`);
      seenParagraphs.set(paragraph, route);
    }
  }
  const guidesIndexHtml = site.get('/guides/');
  for (const guide of GUIDES) assert.ok(guidesIndexHtml.includes(`href="${guide}"`), `/guides/ must link to ${guide}`);
  assert.equal((guidesIndexHtml.match(/class="guide-list"/g) ?? []).length, 1, '/guides/ needs a guide list');

  // Internal links all resolve to a built file.
  const exists = (path) => {
    const target = join(main, path.replace(/^\//, ''));
    return (existsSync(target) && statSync(target).isFile()) || existsSync(join(target, 'index.html')) || existsSync(`${target}.html`);
  };
  for (const [route, html] of site) {
    for (const [, href] of html.matchAll(/href="(\/[^"]*)"/g)) {
      if (href.startsWith('//')) continue;
      const path = decode(href).split('#')[0].split('?')[0];
      if (path === '' || path === '/') continue;
      assert.ok(exists(path), `${route}: broken link ${href}`);
      const lastSegment = path.split('/').filter(Boolean).at(-1) ?? '';
      if (!lastSegment.includes('.')) assert.ok(path.endsWith('/'), `${route}: internal link ${href} should use the canonical trailing-slash form`);
    }
  }

  // Simplified structure: two main links, no menu, and no promotion of the de-emphasized features.
  for (const [route, html] of site) {
    const nav = html.match(/<nav class="site-nav"[\s\S]*?<\/nav>/)?.[0] ?? '';
    assert.deepEqual([...nav.matchAll(/<a href="([^"]+)"/g)].map((m) => m[1]), ['/yes-or-no/', '/today/'], `${route}: main navigation`);
    assert.ok(!/nav-toggle|nav-sub|has-children/.test(html), `${route}: no menu or dropdown markup`);
    const footer = html.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? '';
    const footerLinks = [...footer.matchAll(/<a [^>]*?href="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(footerLinks, ['/', '/yes-or-no/', '/today/', '/horoscope/', ...GUIDES, '/about/', '/how-it-works/', '/privacy/', '/terms/', '/disclaimer/'], `${route}: footer links`);
    for (const legacy of ['/tarot/yes-or-no', '/tarot/daily', '/tarot/one-card', '/tarot/three-card', '/tarot/love', 'href="/tarot/"']) {
      assert.ok(!html.includes(legacy.startsWith('href') ? legacy : `href="${legacy}`), `${route}: links to a redirected legacy route (${legacy})`);
    }
  }
  const home = site.get('/');
  const homeLinks = [...home.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  for (const hidden of HIDDEN_LINKS) assert.ok(!homeLinks.includes(hidden), `homepage must not link to ${hidden}`);
  assert.equal((home.match(/class="choice-card"/g) ?? []).length, 2, 'homepage offers exactly two choices');
  assert.ok(home.includes('href="/yes-or-no/"') && home.includes('href="/today/"') && home.includes('href="/horoscope/"'));

  // Old addresses are permanent redirects (public/_redirects), and no page is built at them.
  const redirects = readFileSync(join(main, '_redirects'), 'utf8').split(/\r?\n/).filter(Boolean).map((line) => line.trim().split(/\s+/));
  for (const [from, to] of Object.entries(LEGACY_ROUTES)) {
    for (const source of [from, from.replace(/\/$/, '')]) {
      assert.ok(redirects.some(([a, b, code]) => a === source && b === to && code === '301'), `_redirects needs a 301 from ${source} to ${to}`);
    }
    assert.ok(!site.has(from), `${from} must not be built as a page`);
    assert.ok(site.has(to), `${to} must exist`);
  }
  assert.ok(existsSync(join(main, '_headers')));

  // Sitemap, robots, social image.
  const sitemap = readFileSync(join(main, 'sitemap.xml'), 'utf8');
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.deepEqual([...locs].sort(), EXPECTED.filter((route) => !NOINDEX.has(route)).map((route) => `${ORIGIN}${route}`).sort(), 'sitemap must list exactly the indexable pages');
  assert.equal(new Set(locs).size, locs.length);
  assert.ok(locs.every((loc) => loc.endsWith('/')), 'sitemap URLs use the trailing slash form');
  assert.ok(!sitemap.includes('shared') && !sitemap.includes('404'));
  const robots = readFileSync(join(main, 'robots.txt'), 'utf8');
  assert.ok(/^User-agent: \*$/m.test(robots) && /^Allow: \/$/m.test(robots));
  assert.ok(!/disallow/i.test(robots), 'robots.txt must not block anything, so crawlers can read noindex on /tarot/shared/');
  assert.ok(robots.includes(`Sitemap: ${ORIGIN}/sitemap.xml`));
  const og = readFileSync(join(main, 'og-default.jpg'));
  assert.deepEqual(jpegSize(og), { width: 1200, height: 630 });
  assert.ok(og.length < 400_000, 'social image should stay small');

  // With no AdSense values set: no Google script, no ad markup, no verification meta.
  const everything = [...site.values()].join('\n');
  for (const needle of ['adsbygoogle', 'googlesyndication', 'class="ad-slot', 'google-adsense-account']) assert.ok(!everything.includes(needle), `ads off: found ${needle}`);
  // ads.txt is a single real line, is copied unchanged into every build, and is never a placeholder.
  const adsTxt = readFileSync(resolve('public/ads.txt'), 'utf8');
  assert.match(adsTxt, /^google\.com, pub-\d{10,20}, DIRECT, f08c47fec0942fa0\r?\n?$/, 'public/ads.txt must be exactly one line with the real publisher ID');
  assert.ok(!/X{6,}/i.test(adsTxt), 'public/ads.txt must not hold the placeholder');
  assert.equal(readFileSync(join(main, 'ads.txt'), 'utf8'), adsTxt, 'ads.txt is served unchanged');
  assert.ok(existsSync(resolve('deploy/ads.txt.template')));

  // ---------------------------------------------------------------- no domain configured yet
  const bare = pages(build('bare', {}));
  for (const [route, html] of bare) {
    assert.ok(!/rel="canonical"|og:url|og:image|twitter:image|application\/ld\+json/.test(html), `${route}: no domain-dependent tags without PUBLIC_SITE_URL`);
    assert.equal(meta(html, 'twitter:card'), 'summary', route);
    assert.equal(meta(html, 'robots'), NOINDEX.has(route) ? 'noindex, follow' : undefined, route);
  }
  assert.ok(!existsSync(join(root, 'bare', 'sitemap.xml')), 'no sitemap without a domain');
  assert.ok(!/Sitemap:/.test(readFileSync(join(root, 'bare', 'robots.txt'), 'utf8')));

  // ---------------------------------------------------------------- ads enabled with a client ID and a contact address
  const adsBuild = pages(build('ads', { PUBLIC_SITE_URL: ORIGIN, PUBLIC_ADSENSE_ENABLED: 'true', PUBLIC_ADSENSE_CLIENT: 'ca-pub-1234567890123456', PUBLIC_CONTACT_EMAIL: 'hello@example.test' }));
  for (const [route, html] of adsBuild) {
    assert.ok(html.includes('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456'), `${route}: ad script`);
    assert.equal(meta(html, 'google-adsense-account'), 'ca-pub-1234567890123456', route);
    assert.ok(!html.includes('class="ad-slot'), `${route}: an ad slot without an ad unit ID must render nothing`);
    assert.ok(html.includes('mailto:hello@example.test'), `${route}: contact address`);
  }
  assert.equal(readFileSync(join(root, 'ads', 'ads.txt'), 'utf8'), adsTxt);
  const verifyOnly = pages(build('verify', { PUBLIC_ADSENSE_ENABLED: 'false', PUBLIC_ADSENSE_CLIENT: 'ca-pub-1234567890123456' }));
  for (const html of verifyOnly.values()) {
    assert.ok(!html.includes('googlesyndication') && !html.includes('adsbygoogle'), 'client ID alone must not load ads');
    assert.ok(html.includes('name="google-adsense-account"'));
  }

  // The committed production values: the verification tag is present on every page, and ads stay off.
  const fileEnv = Object.fromEntries(readFileSync(resolve('.env.production'), 'utf8').split(/\r?\n/).filter((line) => /^[A-Z_]+=/.test(line)).map((line) => line.split(/=(.*)/s).slice(0, 2)));
  assert.match(fileEnv.PUBLIC_ADSENSE_CLIENT, /^ca-pub-\d{10,20}$/, '.env.production needs a valid publisher ID');
  assert.equal(fileEnv.PUBLIC_ADSENSE_ENABLED, 'false', '.env.production must keep ads off until AdSense approves the site');
  assert.deepEqual(Object.keys(fileEnv).sort(), ['PUBLIC_ADSENSE_CLIENT', 'PUBLIC_ADSENSE_ENABLED', 'PUBLIC_CONTACT_EMAIL'], '.env.production may only hold these public values');
  assert.match(fileEnv.PUBLIC_CONTACT_EMAIL, /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/, '.env.production needs a well-formed contact address');
  const prod = pages(build('production-env', { PUBLIC_SITE_URL: ORIGIN, useFileEnv: true }));
  assert.equal(prod.size, EXPECTED.length);
  for (const [route, html] of prod) {
    assert.equal((html.match(/<meta name="google-adsense-account" content="([^"]+)"/g) ?? []).length, 1, `${route}: exactly one verification tag`);
    assert.equal(meta(html, 'google-adsense-account'), fileEnv.PUBLIC_ADSENSE_CLIENT, route);
    assert.ok(html.indexOf('google-adsense-account') < html.indexOf('</head>'), `${route}: tag belongs in <head>`);
    for (const needle of ['adsbygoogle', 'googlesyndication', 'class="ad-slot', '<ins ']) assert.ok(!html.includes(needle), `${route}: ads must stay off (found ${needle})`);
    assert.equal(attr(html, /<link rel="canonical" href="([^"]*)"/) ?? '', NOINDEX.has(route) ? '' : `${ORIGIN}${route}`, `${route}: canonical unchanged by the verification tag`);
    assert.ok(html.includes(`mailto:${fileEnv.PUBLIC_CONTACT_EMAIL}`), `${route}: contact address from .env.production`);
  }
  // ads.txt must name the same publisher as the verification tag.
  assert.equal(adsTxt.trim(), `google.com, pub-${fileEnv.PUBLIC_ADSENSE_CLIENT.replace('ca-pub-', '')}, DIRECT, f08c47fec0942fa0`, 'ads.txt publisher must match PUBLIC_ADSENSE_CLIENT');
  assert.equal(readFileSync(join(root, 'production-env', 'ads.txt'), 'utf8'), adsTxt);

  // ---------------------------------------------------------------- ads configuration rules
  const outDir = join(root, 'ads-config');
  const compiled = spawnSync(process.execPath, [pnpm, 'exec', 'vite', 'build', '--ssr', 'src/config/ads.ts', '--outDir', outDir], { cwd: resolve('.'), encoding: 'utf8' });
  if (compiled.status !== 0) throw new Error(compiled.stderr || compiled.stdout);
  const { isValidSlotId, resolveAdsConfig } = await import(pathToFileURL(join(outDir, 'ads.js')).href);
  const valid = 'ca-pub-1234567890123456';
  assert.deepEqual(resolveAdsConfig('true', valid), { client: valid, active: true });
  assert.deepEqual(resolveAdsConfig('true', `  ${valid}  `), { client: valid, active: true });
  for (const enabled of ['false', '', undefined, null, 'TRUE', 'True', '1', 'yes', true]) assert.equal(resolveAdsConfig(enabled, valid).active, false, String(enabled));
  for (const client of ['', undefined, null, 'ca-pub-', 'ca-pub-123', 'ca-pub-abcdefghij', 'pub-1234567890123456', 'XXXXXXXX', '<script>', `${valid}x`, 42]) {
    assert.deepEqual(resolveAdsConfig('true', client), { client: '', active: false }, String(client));
  }
  assert.deepEqual(resolveAdsConfig(undefined, undefined), { client: '', active: false });
  for (const slot of ['1234567890', '123456']) assert.ok(isValidSlotId(slot));
  for (const slot of [undefined, '', '12345', 'abc', '1234567890"', 1234567890, null]) assert.ok(!isValidSlotId(slot), String(slot));

  console.log(`Passed: ${EXPECTED.length} pages audited (unique metadata, one h1, canonical/Open Graph/JSON-LD, breadcrumbs, noindex on shared and 404, sitemap and robots, links, content hygiene) plus no-domain, ads-enabled and ads-config builds.`);
} finally {
  const tempRoot = resolve(tmpdir());
  if (!resolve(root).startsWith(tempRoot + '\\') && !resolve(root).startsWith(tempRoot + '/')) throw new Error('Refusing to remove an unexpected test directory');
  rmSync(root, { recursive: true, force: true });
}
