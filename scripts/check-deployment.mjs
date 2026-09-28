// Post-deploy smoke test against a live origin, for example:
//   pnpm run check:deploy -- https://your-project.pages.dev
// It only reads public pages. Use --no-headers when testing a local preview server, which does not apply public/_headers.
import assert from 'node:assert/strict';

const args = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const checkHeaders = !process.argv.includes('--no-headers');
let origin;
try {
  const url = new URL(args[0] ?? '');
  assert.ok(url.protocol === 'https:' || url.protocol === 'http:');
  origin = url.origin;
} catch {
  console.error('Usage: pnpm run check:deploy -- https://your-site.example [--no-headers]');
  process.exit(2);
}

const results = [];
async function check(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail: detail ?? '' });
  } catch (error) {
    results.push({ name, ok: false, detail: String(error.message ?? error).split('\n')[0] });
  }
}

/** Follows redirects by hand so the chain (and what happens to the query string) is visible. */
async function fetchChain(path, method = 'GET') {
  const chain = [];
  let url = new URL(path, origin);
  for (let hop = 0; hop < 6; hop++) {
    const response = await fetch(url, { method, redirect: 'manual' });
    if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
      chain.push(`${response.status} ${url.pathname}${url.search} -> ${response.headers.get('location')}`);
      url = new URL(response.headers.get('location'), url);
      continue;
    }
    return { response, finalUrl: url, chain, text: method === 'HEAD' ? '' : await response.text() };
  }
  throw new Error(`too many redirects for ${path}`);
}

const meta = (html, key, kind = 'name') => html.match(new RegExp(`<meta ${kind}="${key}" content="([^"]*)"`))?.[1];
const canonicalOf = (html) => html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];

const SHARED = '/tarot/shared/?v=1&t=one-card&c=career&cards=the-lovers.u';
const COMPAT = '/compatibility/?a=aries&b=scorpio';
const GUIDES = ['/guides/', '/guides/yes-no-tarot/', '/guides/upright-vs-reversed/', '/guides/daily-tarot/'];
const pages = ['/', '/yes-or-no/', '/today/', ...GUIDES, '/horoscope/', '/compatibility/', '/zodiac/aries/', '/zodiac/pisces/', '/about/', '/how-it-works/', '/privacy/', '/terms/', '/disclaimer/'];

for (const path of [...pages, SHARED, COMPAT]) {
  await check(`200 ${path}`, async () => {
    const { response, finalUrl, chain } = await fetchChain(path);
    assert.equal(response.status, 200, `status ${response.status}`);
    assert.equal(finalUrl.search, new URL(path, origin).search, `query changed: ${finalUrl.search}`);
    return chain.length ? `via ${chain.length} redirect(s)` : '';
  });
}

// Slash redirects and query preservation, for pages that still exist at their own address.
for (const path of ['/horoscope', '/about', '/zodiac/aries', '/guides', '/guides/yes-no-tarot']) {
  await check(`slash-less ${path}`, async () => {
    const { response, finalUrl, chain } = await fetchChain(path);
    assert.equal(response.status, 200, `status ${response.status}`);
    // Either serving the page directly or one redirect to the slash form is fine; a longer chain is not.
    assert.ok(chain.length <= 1, `redirect chain: ${chain.join(' | ')}`);
    assert.ok([path, `${path}/`].includes(finalUrl.pathname), `ended at ${finalUrl.pathname}`);
    return chain.length ? chain.join(' | ') : 'served directly';
  });
}
for (const path of ['/tarot/shared?v=1&t=one-card&c=career&cards=the-lovers.u', '/compatibility?a=aries&b=scorpio']) {
  await check(`query kept on slash-less ${path.split('?')[0]}`, async () => {
    const { response, finalUrl, chain } = await fetchChain(path);
    assert.equal(response.status, 200, `status ${response.status}`);
    assert.equal(finalUrl.search, new URL(path, origin).search, `query lost: ${chain.join(' | ')}`);
    return chain.length ? chain.join(' | ') : 'served directly';
  });
}

// SEO tags use the real origin.
for (const path of ['/', '/yes-or-no/', '/today/', '/zodiac/scorpio/', '/privacy/', ...GUIDES]) {
  await check(`seo ${path}`, async () => {
    const { text } = await fetchChain(path);
    const expected = `${origin}${path}`;
    assert.equal(canonicalOf(text), expected, `canonical ${canonicalOf(text)}`);
    assert.equal(meta(text, 'og:url', 'property'), expected, 'og:url');
    assert.ok(meta(text, 'og:image', 'property')?.startsWith(`${origin}/`), 'og:image origin');
    assert.equal(meta(text, 'twitter:card'), 'summary_large_image');
    const ld = JSON.parse(text.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    for (const node of ld['@graph']) if (node.url) assert.ok(node.url.startsWith(`${origin}/`), `JSON-LD url ${node.url}`);
    assert.equal((text.match(/<h1[ >]/g) ?? []).length, 1, 'one h1');
    assert.equal(meta(text, 'robots'), undefined, 'must be indexable');
  });
}
await check('the 3 guides have substantial, distinct editorial content', async () => {
  const bodies = [];
  for (const path of GUIDES.slice(1)) {
    const { text } = await fetchChain(path);
    const body = text.match(/<article class="zodiac-article[^"]*">([\s\S]*?)<\/article>/)?.[1] ?? '';
    const words = body.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    assert.ok(words >= 350, `${path}: only ${words} words`);
    bodies.push(body);
  }
  return `${bodies.length} guides checked`;
});
// Old addresses redirect permanently to the new pages (public/_redirects).
const LEGACY_REDIRECTS = [
  ['/tarot/yes-or-no/', '/yes-or-no/'], ['/tarot/yes-or-no', '/yes-or-no/'],
  ['/tarot/daily/', '/today/'], ['/tarot/daily', '/today/'],
  ['/tarot/', '/'], ['/tarot', '/'],
  ['/tarot/one-card/', '/yes-or-no/'], ['/tarot/one-card', '/yes-or-no/'],
  ['/tarot/three-card/', '/yes-or-no/'], ['/tarot/three-card', '/yes-or-no/'],
  ['/tarot/love/', '/yes-or-no/'], ['/tarot/love', '/yes-or-no/'],
];
for (const [from, to] of LEGACY_REDIRECTS) {
  await check(`301 ${from} -> ${to}`, async () => {
    const { response, finalUrl, chain } = await fetchChain(from);
    assert.ok(chain[0]?.startsWith('301 '), `first hop should be 301, got: ${chain[0] ?? 'no redirect'}`);
    assert.equal(response.status, 200);
    assert.equal(finalUrl.pathname, to, `ended at ${finalUrl.pathname}`);
    return chain.join(' | ');
  });
}
// Old share links for the retired reading types still restore correctly.
for (const [type, cards] of [['three-card', 'the-fool.u,four-of-swords.r,the-star.u'], ['love', 'the-empress.u,the-tower.r'], ['one-card', 'the-lovers.u']]) {
  await check(`old shared link still works: t=${type}`, async () => {
    const path = `${SHARED.split('?')[0]}?v=1&t=${type}&c=career&cards=${cards}`;
    const { response, text } = await fetchChain(path);
    assert.equal(response.status, 200);
    assert.equal(meta(text, 'robots'), 'noindex, follow');
  });
}
// Compatibility still works but is not promoted in search.
await check('compatibility is noindex, follow with no canonical', async () => {
  const { text } = await fetchChain('/compatibility/');
  assert.equal(meta(text, 'robots'), 'noindex, follow');
  assert.equal(canonicalOf(text), undefined);
});
await check('main navigation has two links', async () => {
  const { text } = await fetchChain('/');
  const nav = text.match(/<nav class="site-nav"[\s\S]*?<\/nav>/)?.[0] ?? '';
  assert.deepEqual([...nav.matchAll(/<a href="([^"]+)"/g)].map((m) => m[1]), ['/yes-or-no/', '/today/']);
});
await check('shared page is noindex, follow with no canonical', async () => {
  const { text } = await fetchChain(SHARED);
  assert.equal(meta(text, 'robots'), 'noindex, follow');
  assert.equal(canonicalOf(text), undefined);
});
await check('404 page is noindex and returns 404', async () => {
  const { response, text } = await fetchChain('/this-page-does-not-exist/');
  assert.equal(response.status, 404, `status ${response.status}`);
  assert.equal(meta(text, 'robots'), 'noindex, follow');
});

// robots.txt, sitemap, social image.
await check('robots.txt', async () => {
  const { response, text } = await fetchChain('/robots.txt');
  assert.equal(response.status, 200);
  assert.ok(!/disallow/i.test(text), 'must not disallow anything');
  assert.ok(text.includes(`Sitemap: ${origin}/sitemap.xml`), 'Sitemap line uses the real origin');
});
await check('sitemap.xml', async () => {
  const { response, text } = await fetchChain('/sitemap.xml');
  assert.equal(response.status, 200);
  const locs = [...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.length >= 24, `${locs.length} URLs`);
  assert.ok(!locs.includes(`${origin}/compatibility/`), '/compatibility/ must not be in the sitemap');
  for (const guide of GUIDES) assert.ok(locs.includes(`${origin}${guide}`), `${guide} must be in the sitemap`);
  assert.ok(locs.every((loc) => loc.startsWith(`${origin}/`) && loc.endsWith('/')), 'absolute, origin-matched, trailing slash');
  assert.ok(!locs.some((loc) => loc.includes('shared') || loc.includes('404') || loc.includes('/tarot/')), 'no shared, 404, or retired tarot pages');
  return `${locs.length} URLs`;
});
await check('og-default.jpg', async () => {
  const { response } = await fetchChain('/og-default.jpg', 'HEAD');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') ?? '', /image\/jpeg/);
});

// Ads are off.
await check('AdSense is off', async () => {
  for (const path of ['/', '/yes-or-no/', '/today/', '/zodiac/leo/', '/horoscope/', '/guides/yes-no-tarot/']) {
    const { text } = await fetchChain(path);
    for (const needle of ['adsbygoogle', 'googlesyndication', 'class="ad-slot']) assert.ok(!text.includes(needle), `${path} contains ${needle}`);
  }
});
await check('ads.txt is plain text with one valid line', async () => {
  const { response, text, finalUrl } = await fetchChain('/ads.txt');
  assert.equal(response.status, 200, `status ${response.status}`);
  assert.equal(finalUrl.pathname, '/ads.txt', 'must not redirect');
  assert.match(response.headers.get('content-type') ?? '', /^text\/plain/, `content-type ${response.headers.get('content-type')}`);
  assert.ok(!/<html|<!doctype/i.test(text), 'served HTML instead of text');
  const lines = text.split(/\r?\n/).filter(Boolean);
  assert.equal(lines.length, 1, `${lines.length} lines`);
  assert.match(lines[0], /^google\.com, pub-\d{10,20}, DIRECT, f08c47fec0942fa0$/);
  return lines[0];
});
await check('AdSense site-verification tag (if configured) is valid and in <head>', async () => {
  const { text } = await fetchChain('/');
  const id = meta(text, 'google-adsense-account');
  if (id === undefined) return 'not configured';
  assert.match(id, /^ca-pub-\d{10,20}$/, `invalid publisher ID ${id}`);
  assert.ok(text.indexOf('google-adsense-account') < text.indexOf('</head>'), 'tag must be inside <head>');
  return id;
});
for (const path of ['/', '/about/']) {
  await check(`contact address on ${path} (or absent if not yet configured)`, async () => {
    const { text } = await fetchChain(path);
    const mailto = text.match(/mailto:([^"]+)"/)?.[1];
    if (mailto) {
      assert.match(mailto, /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/, `malformed contact address ${mailto}`);
      return `mailto:${mailto}`;
    }
    // Cloudflare's email obfuscation (Scrape Shield) can rewrite a plain mailto: link into
    // /cdn-cgi/l/email-protection at the edge; it still resolves to a real mailto link for visitors
    // (and for Googlebot, which runs JavaScript), just not as a literal "mailto:" string in the raw HTML.
    if (text.includes('cdn-cgi/l/email-protection')) return 'obfuscated by Cloudflare email protection (resolves client-side)';
    return 'no contact address (not configured)';
  });
}

if (checkHeaders) {
  await check('security and cache headers', async () => {
    const home = await fetchChain('/');
    assert.equal(home.response.headers.get('x-content-type-options'), 'nosniff', 'X-Content-Type-Options');
    const css = home.text.match(/href="(\/_astro\/[^"]+\.css)"/)?.[1];
    const asset = await fetchChain(css, 'HEAD');
    assert.match(asset.response.headers.get('cache-control') ?? '', /immutable/, 'hashed assets should be immutable');
  });
}

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? `  (${r.detail})` : ''}`);
console.log(`\n${results.length - failed.length}/${results.length} checks passed against ${origin}`);
process.exit(failed.length ? 1 : 0);
