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
const pages = ['/', '/tarot/', '/tarot/one-card/', '/tarot/yes-or-no/', '/tarot/three-card/', '/tarot/love/', '/tarot/daily/', '/horoscope/', '/compatibility/', '/zodiac/aries/', '/zodiac/pisces/', '/about/', '/how-it-works/', '/privacy/', '/terms/', '/disclaimer/'];

for (const path of [...pages, SHARED, COMPAT]) {
  await check(`200 ${path}`, async () => {
    const { response, finalUrl, chain } = await fetchChain(path);
    assert.equal(response.status, 200, `status ${response.status}`);
    assert.equal(finalUrl.search, new URL(path, origin).search, `query changed: ${finalUrl.search}`);
    return chain.length ? `via ${chain.length} redirect(s)` : '';
  });
}

// Slash redirects and query preservation.
for (const path of ['/tarot', '/horoscope', '/about', '/zodiac/aries']) {
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
for (const path of ['/', '/tarot/love/', '/zodiac/scorpio/', '/privacy/', '/compatibility/']) {
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
  assert.ok(locs.length >= 26, `${locs.length} URLs`);
  assert.ok(locs.every((loc) => loc.startsWith(`${origin}/`) && loc.endsWith('/')), 'absolute, origin-matched, trailing slash');
  assert.ok(!locs.some((loc) => loc.includes('shared') || loc.includes('404')), 'no shared or 404 pages');
  return `${locs.length} URLs`;
});
await check('og-default.jpg', async () => {
  const { response } = await fetchChain('/og-default.jpg', 'HEAD');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') ?? '', /image\/jpeg/);
});

// Ads are off.
await check('AdSense is off', async () => {
  for (const path of ['/', '/tarot/one-card/', '/zodiac/leo/', '/horoscope/']) {
    const { text } = await fetchChain(path);
    for (const needle of ['adsbygoogle', 'googlesyndication', 'class="ad-slot']) assert.ok(!text.includes(needle), `${path} contains ${needle}`);
  }
  const { response } = await fetchChain('/ads.txt');
  assert.equal(response.status, 404, 'ads.txt must not exist until a real publisher ID is added');
});
await check('no contact address published unless configured', async () => {
  const { text } = await fetchChain('/privacy/');
  return text.includes('mailto:') ? 'mailto present (contact email configured)' : 'no mailto (contact email not configured)';
});

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
