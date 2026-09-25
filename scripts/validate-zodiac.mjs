import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const output = mkdtempSync(join(tmpdir(), 'oracle-zodiac-test-'));
try {
  const pnpm = process.env.npm_execpath;
  if (!pnpm) throw new Error('Run this script with pnpm run test:zodiac');
  const load = async (entry, name) => {
    const outDir = join(output, name);
    const build = spawnSync(process.execPath, [pnpm, 'exec', 'vite', 'build', '--ssr', entry, '--outDir', outDir], { cwd: resolve('.'), encoding: 'utf8' });
    if (build.status !== 0) throw new Error(build.stderr || build.stdout);
    return import(pathToFileURL(join(outDir, `${name}.js`)).href);
  };
  const { zodiacSigns, getZodiacSign } = await load('src/data/zodiac/signs.ts', 'signs');
  const { formatDateKey, getDailyHoroscope, getLocalDateKey, hashString } = await load('src/utils/horoscope.ts', 'horoscope');
  const { getCompatibility } = await load('src/utils/compatibility.ts', 'compatibility');
  const { zodiacDepth } = await load('src/data/zodiac/depth.ts', 'depth');

  const ids = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
  const sections = ['general', 'love', 'career', 'money', 'advice'];
  const strings = (value) => (Array.isArray(value) ? value.flatMap(strings) : value && typeof value === 'object' ? Object.values(value).flatMap(strings) : [String(value)]);
  const filled = (text) => typeof text === 'string' && text.trim().length > 0;

  // --- Data shape ---
  assert.equal(zodiacSigns.length, 12);
  assert.deepEqual(zodiacSigns.map((sign) => sign.id), ids);
  assert.equal(new Set(zodiacSigns.map((sign) => sign.name)).size, 12);
  assert.equal(new Set(zodiacSigns.map((sign) => sign.symbol)).size, 12);
  for (const id of ids) assert.equal(getZodiacSign(id).id, id);
  assert.equal(getZodiacSign('nope'), undefined);
  assert.equal(getZodiacSign(null), undefined);

  const counts = { element: {}, modality: {} };
  for (const sign of zodiacSigns) {
    for (const field of ['id', 'name', 'symbol', 'dateRange', 'element', 'modality', 'rulingPlanet', 'relatedTarotCard', 'descriptor', 'overview', 'love', 'career', 'money']) {
      assert.ok(filled(sign[field]), `${sign.id}.${field}`);
    }
    assert.match(sign.id, /^[a-z]+$/);
    assert.ok(['fire', 'earth', 'air', 'water'].includes(sign.element), sign.id);
    assert.ok(['cardinal', 'fixed', 'mutable'].includes(sign.modality), sign.id);
    assert.match(sign.dateRange, /^[A-Z][a-z]{2} \d{1,2} – [A-Z][a-z]{2} \d{1,2}$/, sign.id);
    assert.ok(sign.overview.length > 150, `${sign.id} overview too thin`);
    for (const field of ['love', 'career', 'money']) assert.ok(sign[field].length > 120, `${sign.id}.${field} too thin`);
    for (const field of ['strengths', 'challenges']) {
      assert.ok(sign[field].length >= 4 && sign[field].every(filled), `${sign.id}.${field}`);
    }
    for (const section of sections) {
      const pool = sign.dailyPool[section];
      assert.ok(Array.isArray(pool) && pool.length >= 5 && pool.every(filled), `${sign.id}.dailyPool.${section}`);
      assert.equal(new Set(pool).size, pool.length, `${sign.id}.dailyPool.${section} has duplicates`);
    }
    assert.deepEqual(Object.keys(sign.dailyPool).sort(), [...sections].sort());
    for (const key of ['communication', 'love', 'emotional', 'friction', 'need']) assert.ok(filled(sign.compat[key]) && !/[.!?]$/.test(sign.compat[key]), `${sign.id}.compat.${key}`);
    counts.element[sign.element] = (counts.element[sign.element] ?? 0) + 1;
    counts.modality[sign.modality] = (counts.modality[sign.modality] ?? 0) + 1;
  }
  assert.deepEqual(Object.values(counts.element), [3, 3, 3, 3]);
  assert.deepEqual(Object.values(counts.modality), [4, 4, 4]);

  // Each sign has its own voice: no text is shared between signs.
  const seen = new Map();
  for (const sign of zodiacSigns) {
    for (const text of strings([sign.overview, sign.love, sign.career, sign.money, sign.strengths, sign.challenges, sign.dailyPool, sign.compat, sign.descriptor])) {
      assert.ok(!seen.has(text) || seen.get(text) === sign.id, `"${text}" is reused by ${seen.get(text)} and ${sign.id}`);
      seen.set(text, sign.id);
    }
  }

  // Guide-page depth sections: present, substantial, distinct per sign, and not filler.
  assert.deepEqual(Object.keys(zodiacDepth).sort(), [...ids].sort());
  const depthSentences = new Map();
  for (const sign of zodiacSigns) {
    const depth = zodiacDepth[sign.id];
    for (const field of ['relationships', 'workStyle']) {
      assert.ok(filled(depth[field]) && depth[field].length > 250 && depth[field].length < 900, `${sign.id}.depth.${field} length ${depth[field]?.length}`);
      assert.ok(depth[field].includes(sign.name) || /(they|their|them)/i.test(depth[field]), `${sign.id}.depth.${field} should speak about the sign`);
    }
    assert.equal(depth.growthPrompts.length, 4, sign.id);
    assert.equal(new Set(depth.growthPrompts).size, 4, sign.id);
    for (const prompt of depth.growthPrompts) assert.ok(prompt.endsWith('?') && prompt.length > 25, `${sign.id}: "${prompt}"`);
    assert.ok(depth.relationships.startsWith(sign.name) || depth.relationships.includes(sign.name), `${sign.id} relationships names the sign`);
    for (const text of strings(depth)) {
      seen.set(text, seen.get(text) ?? sign.id);
      assert.equal(seen.get(text), sign.id, `"${text}" is reused across signs`);
      for (const sentence of text.split(/(?<=[.?!])\s+/).filter((part) => part.length > 40)) {
        assert.ok(!depthSentences.has(sentence) || depthSentences.get(sentence) === sign.id, `sentence reused by ${depthSentences.get(sentence)} and ${sign.id}: "${sentence}"`);
        depthSentences.set(sentence, sign.id);
      }
    }
  }
  // Sentence-level repetition between signs' main content, not only whole paragraphs.
  const contentSentences = new Map();
  for (const sign of zodiacSigns) {
    for (const text of [sign.overview, sign.love, sign.career, sign.money]) {
      for (const sentence of text.split(/(?<=[.?!])\s+/).filter((part) => part.length > 40)) {
        assert.ok(!contentSentences.has(sentence) || contentSentences.get(sentence) === sign.id, `sentence reused by ${contentSentences.get(sentence)} and ${sign.id}: "${sentence}"`);
        contentSentences.set(sentence, sign.id);
      }
    }
  }

  // --- Language rules: reflective, never prophetic ---
  const forbidden = /\b(you will|you'll|will meet|will fail|will marry|will get rich|destined|soulmate|guaranteed|guarantee|fated|doomed|certainly|definitely)\b|\d\s?%/i;
  for (const sign of zodiacSigns) {
    for (const text of [...strings(sign), ...strings(zodiacDepth[sign.id])]) assert.ok(!forbidden.test(text), `${sign.id}: "${text}"`);
  }

  // --- Daily horoscope: deterministic ---
  assert.equal(getLocalDateKey(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
  assert.equal(getLocalDateKey(new Date(2026, 11, 31)), '2026-12-31');
  assert.equal(formatDateKey('2026-09-26'), 'Saturday, September 26');
  assert.equal(hashString('abc'), hashString('abc'));
  assert.notEqual(hashString('abc'), hashString('abd'));
  assert.equal(hashString('a'), 0xe40c292c);
  for (const sign of zodiacSigns) {
    const a = getDailyHoroscope(sign, '2026-09-26');
    const b = getDailyHoroscope(sign, '2026-09-26');
    assert.deepEqual(a, b);
    assert.deepEqual(Object.keys(a), sections);
    for (const section of sections) assert.ok(sign.dailyPool[section].includes(a[section]), `${sign.id} ${section}`);
    // Only the pool is needed, so pages can pass a trimmed sign to the client.
    assert.deepEqual(getDailyHoroscope({ id: sign.id, dailyPool: sign.dailyPool }, '2026-09-26'), a);
    // Over two months every section rotates through several different entries.
    for (const section of sections) {
      const variety = new Set(Array.from({ length: 60 }, (_, day) => getDailyHoroscope(sign, `2026-10-${String(day + 1).padStart(2, '0')}`)[section]));
      assert.ok(variety.size >= 3, `${sign.id} ${section} variety ${variety.size}`);
    }
  }
  const sameDay = zodiacSigns.map((sign) => JSON.stringify(getDailyHoroscope(sign, '2026-09-26')));
  assert.equal(new Set(sameDay).size, 12);
  assert.notDeepEqual(zodiacSigns.map((sign) => getDailyHoroscope(sign, '2026-09-26').general), zodiacSigns.map((sign) => getDailyHoroscope(sign, '2026-09-27').general));
  // Odd date keys never throw.
  for (const key of ['', 'x', '2026-13-45', '📅']) assert.ok(filled(getDailyHoroscope(zodiacSigns[0], key).general));

  // --- Compatibility: all 144 combinations ---
  const tones = new Set();
  const relations = { same: 0, opposite: 0, other: 0 };
  for (const a of zodiacSigns) {
    for (const b of zodiacSigns) {
      const ab = getCompatibility(a.id, b.id);
      const ba = getCompatibility(b.id, a.id);
      assert.ok(ab && ba, `${a.id}+${b.id}`);
      assert.deepEqual(ab, ba, `${a.id}+${b.id} is not symmetric`);
      assert.deepEqual(ab.pair.map((sign) => sign.id), [a, b].sort((x, y) => ids.indexOf(x.id) - ids.indexOf(y.id)).map((sign) => sign.id));
      assert.deepEqual(Object.keys(ab.sections), ['overall', 'communication', 'love', 'emotional', 'challenges', 'advice']);
      for (const [name, text] of Object.entries(ab.sections)) {
        assert.ok(filled(text) && text.length > 80, `${a.id}+${b.id} ${name}`);
        assert.ok(!/undefined|null|\[object|NaN/.test(text), `${a.id}+${b.id} ${name}: ${text}`);
        assert.ok(!forbidden.test(text), `${a.id}+${b.id} ${name}: ${text}`);
        assert.ok(/[.!?]$/.test(text), `${a.id}+${b.id} ${name} must end in punctuation`);
        assert.ok(!/  /.test(text) && !/\.\./.test(text), `${a.id}+${b.id} ${name} has odd spacing`);
      }
      assert.ok(['harmonious', 'dynamic', 'mixed', 'challenging'].includes(ab.tone));
      assert.ok(['Harmonious', 'Dynamic', 'Mixed', 'Challenging'].includes(ab.toneLabel));
      assert.ok(ab.sections.communication.includes(ab.pair[0].name) && ab.sections.love.includes(ab.pair[1].name));
      tones.add(ab.tone);
      relations[ab.relation]++;
      if (ab.relation === 'opposite') assert.equal(ab.tone, 'dynamic');
      if (a.id === b.id) assert.equal(ab.relation, 'same');
    }
  }
  assert.equal(tones.size, 4, 'all four tones should occur');
  assert.deepEqual(relations, { same: 12, opposite: 12, other: 120 });
  // The same pair is never scored by luck: repeated calls are identical.
  assert.deepEqual(getCompatibility('aries', 'scorpio'), getCompatibility('aries', 'scorpio'));
  assert.equal(getCompatibility('aries', 'scorpio').tone, 'challenging');
  assert.equal(getCompatibility('aries', 'libra').relation, 'opposite');
  assert.equal(getCompatibility('taurus', 'virgo').tone, 'harmonious');
  // Different pairs read differently.
  const overalls = new Set();
  for (const a of zodiacSigns) for (const b of zodiacSigns) overalls.add(JSON.stringify(getCompatibility(a.id, b.id).sections));
  assert.equal(overalls.size, 78, '12x12 pairs collapse to 78 unordered pairs, each with its own text');
  for (const bad of [['aries', 'nope'], ['nope', 'aries'], ['', ''], [undefined, 'aries'], ['__proto__', 'aries']]) assert.equal(getCompatibility(...bad), null);

  console.log('Passed: 12 zodiac signs (unique IDs, complete distinct content and guide sections, no prophetic wording), deterministic daily horoscope, and 144 symmetric compatibility results.');
} finally {
  const tempRoot = resolve(tmpdir());
  if (!resolve(output).startsWith(tempRoot + '\\') && !resolve(output).startsWith(tempRoot + '/')) throw new Error('Refusing to remove an unexpected test directory');
  rmSync(output, { recursive: true, force: true });
}
