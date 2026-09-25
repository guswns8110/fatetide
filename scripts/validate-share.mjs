import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const output = mkdtempSync(join(tmpdir(), 'oracle-share-test-'));
try {
  const pnpm = process.env.npm_execpath;
  if (!pnpm) throw new Error('Run this script with pnpm run test:share');
  const load = async (entry, name) => {
    const outDir = join(output, name);
    const build = spawnSync(process.execPath, [pnpm, 'exec', 'vite', 'build', '--ssr', entry, '--outDir', outDir], { cwd: resolve('.'), encoding: 'utf8' });
    if (build.status !== 0) throw new Error(build.stderr || build.stdout);
    return import(pathToFileURL(join(outDir, `${name}.js`)).href);
  };
  const { MAX_SHARE_QUERY_LENGTH, SHARE_TITLE, buildShareText, buildShareUrl, categoryForType, decodeReading, encodeReading, resolveShareOrigin } = await load('src/utils/shareReading.ts', 'shareReading');
  const { copyLink, getBrowserDeps, isAbortError, performShare } = await load('src/utils/shareActions.ts', 'shareActions');
  const { drawCards, drawLoveSpread, drawThreeCardSpread } = await load('src/utils/tarot.ts', 'tarot');
  const { LOVE_POSITIONS, THREE_CARD_POSITIONS } = await load('src/utils/tarot.ts', 'tarot');

  const ok = (search) => { const result = decodeReading(search); assert.ok(result.ok, `expected ok: ${search} (${result.reason})`); return result.reading; };
  const bad = (search, reason) => { const result = decodeReading(search); assert.equal(result.ok, false, `expected failure: ${String(search)}`); assert.equal(result.reason, reason, String(search)); };

  // --- Round trips: live draw objects must be restored identically ---
  const categories = ['general', 'love', 'career', 'money'];
  for (const category of categories) {
    const draw = drawCards(1, undefined, 'one-card');
    const restored = ok(encodeReading({ type: 'one-card', category, draws: draw }));
    assert.equal(restored.category, category);
    assert.deepEqual(restored.draws.map(({ card, ...rest }) => rest), draw.map(({ card, ...rest }) => rest));
    const spread = drawThreeCardSpread();
    const three = ok(encodeReading({ type: 'three-card', category, draws: spread }));
    assert.equal(three.category, category);
    assert.deepEqual(three.draws.map(({ card, ...rest }) => rest), spread.map(({ card, ...rest }) => rest));
  }
  for (let i = 0; i < 200; i++) {
    const spread = drawThreeCardSpread();
    const three = ok(encodeReading({ type: 'three-card', category: 'general', draws: spread }));
    assert.deepEqual(three.draws, spread);
    const love = drawLoveSpread();
    const restoredLove = ok(encodeReading({ type: 'love', category: 'love', draws: love }));
    assert.deepEqual(restoredLove.draws, love);
    assert.equal(restoredLove.category, 'love');
  }
  assert.deepEqual(ok(encodeReading({ type: 'love', category: 'love', draws: drawLoveSpread() })).draws.map((d) => d.spreadPosition), LOVE_POSITIONS.map((p) => p.id));
  assert.deepEqual(ok(encodeReading({ type: 'three-card', category: 'general', draws: drawThreeCardSpread() })).draws.map((d) => d.spreadPosition), THREE_CARD_POSITIONS.map((p) => p.id));

  const yesNo = drawCards(1, undefined, 'yes-or-no');
  const yesNoBack = ok(encodeReading({ type: 'yes-or-no', category: 'general', draws: yesNo }));
  assert.deepEqual(yesNoBack.draws, yesNo);
  assert.equal(yesNoBack.category, 'general');

  const daily = drawCards(1, undefined, 'daily');
  const dailyBack = ok(encodeReading({ type: 'daily', category: 'general', draws: daily, date: '2026-09-26' }));
  assert.deepEqual(dailyBack.draws, daily);
  assert.equal(dailyBack.date, '2026-09-26');
  assert.equal(ok(encodeReading({ type: 'daily', category: 'general', draws: daily })).date, undefined);

  // All 78 cards in both orientations, for every single-card type.
  const all = drawCards(78);
  for (const draw of all) {
    for (const orientation of ['upright', 'reversed']) {
      for (const type of ['one-card', 'yes-or-no', 'daily']) {
        const live = { ...draw, orientation, readingType: type };
        const restored = ok(encodeReading({ type, category: categoryForType(type, 'career'), draws: [live] }));
        assert.equal(restored.draws.length, 1);
        assert.equal(restored.draws[0].cardId, draw.cardId);
        assert.equal(restored.draws[0].orientation, orientation);
        assert.deepEqual(restored.draws[0].card, draw.card);
        assert.equal(restored.draws[0].readingType, type);
        assert.equal(restored.draws[0].spreadPosition, undefined);
      }
    }
  }
  assert.equal(new Set(all.map((d) => encodeReading({ type: 'yes-or-no', category: 'general', draws: [d] }))).size, 78);

  // --- URL examples and shape ---
  const example = { type: 'three-card', category: 'general', draws: ['the-fool.u', 'four-of-swords.r', 'the-star.u'].map((entry, index) => ({ ...all.find((d) => `${d.cardId}` === entry.split('.')[0]), orientation: entry.endsWith('.u') ? 'upright' : 'reversed', readingType: 'three-card', spreadPosition: THREE_CARD_POSITIONS[index].id })) };
  assert.equal(encodeReading(example), 'v=1&t=three-card&c=general&cards=the-fool.u,four-of-swords.r,the-star.u');
  assert.equal(buildShareUrl(example, 'https://example.com/'), 'https://example.com/tarot/shared/?v=1&t=three-card&c=general&cards=the-fool.u,four-of-swords.r,the-star.u');
  assert.ok(encodeReading(example).length < 150);
  assert.ok(!/[^\x20-\x7e]/.test(encodeReading(example)));

  // Fixed categories are forced no matter what the URL says.
  assert.equal(ok('v=1&t=love&c=money&cards=the-empress.u,the-tower.r').category, 'love');
  assert.equal(ok('v=1&t=yes-or-no&c=money&cards=the-star.u').category, 'general');
  assert.equal(ok('v=1&t=daily&c=money&cards=the-sun.u').category, 'general');
  assert.equal(ok('v=1&t=one-card&c=career&cards=the-lovers.u').category, 'career');

  // --- Leading "?" and unknown parameters ---
  ok('?v=1&t=yes-or-no&cards=the-star.u');
  ok('v=1&t=yes-or-no&cards=the-star.u&utm_source=friend&x=1');
  assert.deepEqual(ok('v=1&t=yes-or-no&cards=the-star.u&utm_source=friend').draws, ok('v=1&t=yes-or-no&cards=the-star.u').draws);
  // Param order does not matter.
  assert.equal(ok('cards=the-star.r&t=yes-or-no&v=1').draws[0].orientation, 'reversed');

  // --- Invalid card / orientation / type ---
  bad('v=1&t=yes-or-no&cards=not-a-card.u', 'bad-card-id');
  bad('v=1&t=yes-or-no&cards=The-Star.u', 'bad-card-id');
  bad('v=1&t=yes-or-no&cards=../etc.u', 'bad-card-id');
  bad('v=1&t=yes-or-no&cards=the-star.x', 'bad-orientation');
  bad('v=1&t=yes-or-no&cards=the-star.upright', 'bad-orientation');
  bad('v=1&t=yes-or-no&cards=the-star', 'bad-orientation');
  bad('v=1&t=yes-or-no&cards=the-star.U', 'bad-orientation');
  bad('v=1&t=tarot&cards=the-star.u', 'bad-type');
  bad('v=1&t=ONE-CARD&c=general&cards=the-star.u', 'bad-type');
  bad('v=1&t=one-card&c=health&cards=the-star.u', 'bad-category');
  bad('v=1&t=three-card&c=Love&cards=the-fool.u,the-star.u,the-sun.u', 'bad-category');

  // --- Missing / duplicate params, version ---
  bad('', 'missing-param');
  bad('?', 'missing-param');
  bad('t=yes-or-no&cards=the-star.u', 'missing-param');
  bad('v=1&cards=the-star.u', 'missing-param');
  bad('v=1&t=yes-or-no', 'missing-param');
  bad('v=1&t=yes-or-no&cards=', 'missing-param');
  bad('v=&t=yes-or-no&cards=the-star.u', 'missing-param');
  bad('v=1&t=one-card&cards=the-star.u', 'missing-param');
  bad('v=1&v=1&t=yes-or-no&cards=the-star.u', 'duplicate-param');
  bad('v=1&t=yes-or-no&t=daily&cards=the-star.u', 'duplicate-param');
  bad('v=1&t=yes-or-no&cards=the-star.u&cards=the-sun.u', 'duplicate-param');
  bad('v=1&t=one-card&c=general&c=love&cards=the-star.u', 'duplicate-param');
  bad('v=2&t=yes-or-no&cards=the-star.u', 'bad-version');
  bad('v=01&t=yes-or-no&cards=the-star.u', 'bad-version');
  bad('v=abc&t=yes-or-no&cards=the-star.u', 'bad-version');

  // --- Card counts and duplicates ---
  bad('v=1&t=yes-or-no&cards=the-star.u,the-sun.u', 'bad-card-count');
  bad('v=1&t=one-card&c=general&cards=the-star.u,the-sun.u', 'bad-card-count');
  bad('v=1&t=daily&cards=the-star.u,the-sun.u', 'bad-card-count');
  bad('v=1&t=three-card&c=general&cards=the-fool.u,the-star.u', 'bad-card-count');
  bad('v=1&t=three-card&c=general&cards=the-fool.u,the-star.u,the-sun.u,the-moon.u', 'bad-card-count');
  bad('v=1&t=love&cards=the-empress.u', 'bad-card-count');
  bad('v=1&t=love&cards=the-empress.u,the-tower.r,the-sun.u', 'bad-card-count');
  bad('v=1&t=three-card&c=general&cards=the-fool.u,the-fool.r,the-star.u', 'duplicate-card');
  bad('v=1&t=three-card&c=general&cards=the-fool.u,the-star.u,the-fool.u', 'duplicate-card');
  bad('v=1&t=love&cards=the-empress.u,the-empress.r', 'duplicate-card');
  bad('v=1&t=three-card&c=general&cards=the-fool.u,,the-star.u', 'bad-orientation');
  bad('v=1&t=love&cards=the-empress.u,', 'bad-orientation');

  // --- Invalid Daily dates drop only the date ---
  for (const date of ['2026-02-30', '2026-13-01', '20260926', 'yesterday', '2026-9-26', '<script>', '2026-09-26T10:00', '']) {
    const restored = ok(`v=1&t=daily&cards=the-sun.r&d=${encodeURIComponent(date)}`);
    assert.equal(restored.date, undefined, date);
    assert.equal(restored.draws[0].cardId, 'the-sun');
    assert.equal(restored.draws[0].orientation, 'reversed');
  }
  assert.equal(ok('v=1&t=daily&cards=the-sun.u&d=2026-09-26&d=2026-09-27').date, undefined);
  assert.equal(ok('v=1&t=daily&cards=the-sun.u&d=2024-02-29').date, '2024-02-29');
  assert.equal(ok('v=1&t=yes-or-no&cards=the-sun.u&d=2026-09-26').date, undefined);
  assert.ok(!encodeReading({ type: 'daily', category: 'general', draws: daily, date: '2026-02-30' }).includes('d='));
  assert.ok(!encodeReading({ type: 'yes-or-no', category: 'general', draws: yesNo, date: '2026-09-26' }).includes('d='));

  // --- Share origin resolution ---
  for (const [configured, fallback, expected] of [
    ['https://example.com', 'http://localhost:4321', 'https://example.com'],
    ['https://example.com/', 'http://localhost:4321', 'https://example.com'],
    ['https://example.com//', 'http://localhost:4321', 'https://example.com'],
    ['  https://example.com/tarot/?x=1#y  ', 'http://localhost:4321', 'https://example.com'],
    ['https://user:secret@example.com/path', 'http://localhost:4321', 'https://example.com'],
    ['http://localhost:4321/', 'https://fallback.example', 'http://localhost:4321'],
    ['', 'https://oracle.pages.dev', 'https://oracle.pages.dev'],
    [undefined, 'https://oracle.pages.dev/', 'https://oracle.pages.dev'],
    [null, 'https://oracle.pages.dev//', 'https://oracle.pages.dev'],
    ['example.com', 'https://oracle.pages.dev', 'https://oracle.pages.dev'],
    ['javascript:alert(1)', 'https://oracle.pages.dev', 'https://oracle.pages.dev'],
    ['ftp://example.com', 'https://oracle.pages.dev', 'https://oracle.pages.dev'],
    ['data:text/html,hi', 'https://oracle.pages.dev', 'https://oracle.pages.dev'],
    ['not a url', 'https://oracle.pages.dev', 'https://oracle.pages.dev'],
    ['https://', 'https://oracle.pages.dev', 'https://oracle.pages.dev'],
  ]) {
    assert.equal(resolveShareOrigin(configured, fallback), expected, String(configured));
  }
  for (const configured of ['https://example.com/', 'https://example.com//', '']) {
    const url = buildShareUrl(example, resolveShareOrigin(configured, 'https://oracle.pages.dev/'));
    assert.ok(!url.replace('https://', '').includes('//'), url);
    assert.ok(url.includes('/tarot/shared/?v=1&t=three-card'), url);
  }

  // --- Length limit and malformed input ---
  const base = 'v=1&t=yes-or-no&cards=the-star.u';
  const padded = (length) => `${base}&x=${'a'.repeat(length - base.length - 3)}`;
  assert.equal(padded(MAX_SHARE_QUERY_LENGTH).length, MAX_SHARE_QUERY_LENGTH);
  ok(padded(MAX_SHARE_QUERY_LENGTH));
  bad(padded(MAX_SHARE_QUERY_LENGTH + 1), 'too-long');
  bad(`${base}&x=${'a'.repeat(100_000)}`, 'too-long');
  bad('v=1&t=yes-or-no&cards=the-st%E0%A4%A.u', 'bad-card-id');
  bad('v=1&t=yes-or-no&cards=%', 'bad-orientation');
  bad('%%%&&&===', 'missing-param');
  bad('v=1&t=yes-or-no&cards=the-star%2Eu%00', 'bad-orientation');
  bad('v=1&t=yes-or-no&cards=%F0%9F%94%AE.u', 'bad-card-id');
  bad('v=1&t=yes-or-no&cards=' + 'the-star.u,'.repeat(5), 'bad-card-count');
  bad('v=1&t=__proto__&cards=the-star.u', 'bad-type');
  bad('__proto__=1&constructor=2', 'missing-param');
  for (const value of [undefined, null, 42, {}, [], true, Symbol('x')]) bad(value, 'malformed');
  for (const value of ['\u0000', '\ud800', '?'.repeat(50), '&'.repeat(50), '='.repeat(50), '%'.repeat(50)]) assert.equal(decodeReading(value).ok, false);

  // --- No personal text can reach the URL, and only IDs are serialized ---
  const polluted = { type: 'yes-or-no', category: 'general', question: 'Will my ex come back?', note: 'secret', draws: yesNo.map((draw) => ({ ...draw, question: 'Will my ex come back?' })) };
  const encoded = encodeReading(polluted);
  assert.ok(!/ex|question|secret|Will/i.test(decodeURIComponent(encoded).replace(/yes-or-no|cards|the-[a-z-]+|[a-z]+-of-[a-z]+|strength|justice|death|temperance|judgement/g, '')), encoded);
  assert.equal(encoded, `v=1&t=yes-or-no&cards=${yesNo[0].cardId}.${yesNo[0].orientation === 'upright' ? 'u' : 'r'}`);
  const text = buildShareText(example);
  assert.equal(text.title, SHARE_TITLE);
  assert.ok(text.text.includes('The Fool') && text.text.includes('The Star') && !text.text.includes('http'));
  const loveText = buildShareText({ type: 'love', category: 'love', draws: drawLoveSpread() });
  assert.match(loveText.text, /^My love reading: .+ and .+\. See it and draw your own\.$/);
  for (const type of ['one-card', 'yes-or-no', 'daily']) assert.ok(buildShareText({ type, category: 'general', draws: drawCards(1) }).text.length > 20);

  // --- shareActions: injected dependencies ---
  const payload = { title: 'My Tarot Reading ✨', text: 'I drew The Lovers.', url: 'https://example.com/tarot/shared/?v=1' };
  const abort = () => Object.assign(new Error('cancelled'), { name: 'AbortError' });
  const record = () => { const calls = []; return { calls, fn: (name, impl) => async (...args) => { calls.push(name); return impl?.(...args); } }; };

  assert.ok(isAbortError(abort()));
  assert.ok(isAbortError({ name: 'AbortError' }));
  assert.ok(!isAbortError(new Error('x')) && !isAbortError(null) && !isAbortError('AbortError'));

  {
    const r = record();
    const outcome = await performShare({ share: r.fn('share'), writeClipboard: r.fn('clipboard') }, payload);
    assert.equal(outcome, 'shared');
    assert.deepEqual(r.calls, ['share']);
  }
  {
    let received;
    await performShare({ share: async (data) => { received = data; } }, payload);
    assert.deepEqual(received, payload);
  }
  {
    const r = record();
    const outcome = await performShare({ share: r.fn('share', () => { throw abort(); }), writeClipboard: r.fn('clipboard'), execCopy: () => { r.calls.push('exec'); return true; } }, payload);
    assert.equal(outcome, 'cancelled');
    assert.deepEqual(r.calls, ['share']);
  }
  {
    const r = record();
    const outcome = await performShare({ share: r.fn('share', () => { throw new TypeError('not allowed'); }), writeClipboard: r.fn('clipboard') }, payload);
    assert.equal(outcome, 'copied');
    assert.deepEqual(r.calls, ['share', 'clipboard']);
  }
  {
    // A share that throws synchronously (not just rejects) still falls back.
    const outcome = await performShare({ share: () => { throw new TypeError('sync'); }, writeClipboard: async () => {} }, payload);
    assert.equal(outcome, 'copied');
  }
  {
    const r = record();
    const outcome = await performShare({ share: r.fn('share'), canShare: () => false, writeClipboard: r.fn('clipboard') }, payload);
    assert.equal(outcome, 'copied');
    assert.deepEqual(r.calls, ['clipboard']);
    assert.equal(await performShare({ share: r.fn('share'), canShare: () => { throw new Error('bad'); }, writeClipboard: async () => {} }, payload), 'copied');
  }
  {
    let written;
    assert.equal(await performShare({ writeClipboard: async (text) => { written = text; } }, payload), 'copied');
    assert.equal(written, payload.url);
  }
  {
    // Clipboard unavailable: the legacy copy is used.
    let copied;
    assert.equal(await performShare({ execCopy: (text) => { copied = text; return true; } }, payload), 'copied');
    assert.equal(copied, payload.url);
    // Clipboard rejects (permission denied): legacy copy is used.
    assert.equal(await copyLink({ writeClipboard: async () => { throw new DOMException('denied', 'NotAllowedError'); }, execCopy: () => true }, payload.url), 'copied');
  }
  {
    // Nothing works: manual copy state, never a throw.
    assert.equal(await performShare({}, payload), 'manual');
    assert.equal(await performShare({ execCopy: () => false }, payload), 'manual');
    assert.equal(await performShare({ execCopy: () => { throw new Error('nope'); } }, payload), 'manual');
    assert.equal(await performShare({ share: async () => { throw new Error('x'); }, writeClipboard: async () => { throw new Error('y'); }, execCopy: () => false }, payload), 'manual');
    assert.equal(await copyLink({}, payload.url), 'manual');
  }

  // getBrowserDeps adapts a (fake) environment without touching real globals.
  assert.deepEqual(getBrowserDeps({}), {});
  {
    const shared = [];
    const written = [];
    const deps = getBrowserDeps({ navigator: { share: async (data) => { shared.push(data); }, canShare: () => true, clipboard: { writeText: async (text) => { written.push(text); } } } });
    assert.equal(await performShare(deps, payload), 'shared');
    assert.equal(await copyLink(deps, payload.url), 'copied');
    assert.deepEqual(shared, [payload]);
    assert.deepEqual(written, [payload.url]);
    assert.equal(deps.execCopy, undefined);
  }
  {
    const appended = [];
    const removed = [];
    const field = { style: {}, setAttribute() {}, select() {}, setSelectionRange() {} };
    const doc = { body: { appendChild: (node) => appended.push(node), removeChild: (node) => removed.push(node) }, createElement: () => field, execCommand: (command) => command === 'copy' };
    const deps = getBrowserDeps({ navigator: {}, document: doc });
    assert.equal(deps.share, undefined);
    assert.equal(deps.writeClipboard, undefined);
    assert.equal(await performShare(deps, payload), 'copied');
    assert.equal(field.value, payload.url);
    assert.deepEqual([appended.length, removed.length], [1, 1]);
    const failing = getBrowserDeps({ document: { ...doc, execCommand: () => false } });
    assert.equal(await performShare(failing, payload), 'manual');
    assert.equal(removed.length, 2);
  }

  console.log('Passed: share URL encode/decode (5 reading types, 78 cards x 2 orientations, validation and error cases), share text, and share/copy fallback chain.');
} finally {
  const tempRoot = resolve(tmpdir());
  if (!resolve(output).startsWith(tempRoot + '\\') && !resolve(output).startsWith(tempRoot + '/')) throw new Error('Refusing to remove an unexpected test directory');
  rmSync(output, { recursive: true, force: true });
}
