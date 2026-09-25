import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const output = mkdtempSync(join(tmpdir(), 'oracle-tarot-test-'));
try {
  const pnpm = process.env.npm_execpath;
  if (!pnpm) throw new Error('Run this script with pnpm run test:tarot');
  const build = spawnSync(process.execPath, [pnpm, 'exec', 'vite', 'build', '--ssr', 'src/utils/tarot.ts', '--outDir', output], { cwd: resolve('.'), encoding: 'utf8' });
  if (build.status !== 0) throw new Error(build.stderr || build.stdout);
  const { LOVE_POSITIONS, THREE_CARD_POSITIONS, YES_NO_ANSWERS, drawCards, drawOrientation, drawLoveSpread, drawThreeCardSpread, getDateKey, getInterpretation, parseDailyRecord, serializeDailyRecord, getYesNoAnswer, shuffledDeck } = await import(pathToFileURL(join(output, 'tarot.js')).href);
  const all = drawCards(78);
  assert.equal(all.length, 78);
  assert.equal(all.filter(({ card }) => card.arcana === 'major').length, 22);
  assert.equal(all.filter(({ card }) => card.arcana === 'minor').length, 56);
  assert.equal(new Set(all.map(({ cardId }) => cardId)).size, 78);
  assert.ok(all.every(({ cardId }) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cardId)));
  for (const suit of ['cups', 'wands', 'swords', 'pentacles']) {
    assert.equal(all.filter(({ card }) => card.suit === suit).length, 14);
  }
  assert.equal(shuffledDeck(all).length, 78);
  for (let i = 0; i < 200; i++) {
    const draw = drawCards(3);
    assert.equal(new Set(draw.map(({ cardId }) => cardId)).size, 3);
    assert.ok(draw.every(({ orientation }) => orientation === 'upright' || orientation === 'reversed'));
    assert.ok(['upright', 'reversed'].includes(drawOrientation()));
  }
  for (const draw of all) {
    assert.equal(draw.card.imagePath, `/cards/${draw.cardId}.webp`);
    assert.ok(draw.card.keywords.length >= 2);
    for (const orientation of ['upright', 'reversed']) {
      for (const category of ['general', 'love', 'career', 'money']) {
        const { reading, advice, reflection } = getInterpretation({ ...draw, orientation }, category);
        assert.ok(reading.length > 30 && advice.length > 15 && reflection.length > 15, `${draw.cardId} ${orientation} ${category}`);
      }
    }
    assert.ok(['yes', 'likely_yes', 'unclear', 'likely_no', 'no'].includes(draw.card.yesNo.upright));
    assert.ok(['yes', 'likely_yes', 'unclear', 'likely_no', 'no'].includes(draw.card.yesNo.reversed));
  }
  const reversedRate = Array.from({ length: 10_000 }, drawOrientation).filter((value) => value === 'reversed').length / 10_000;
  assert.ok(reversedRate > 0.30 && reversedRate < 0.40);
  assert.throws(() => drawCards(79), RangeError);
  assert.equal(drawCards(1)[0].readingType, 'one-card');
  assert.equal(drawCards(1, undefined, 'yes-or-no')[0].readingType, 'yes-or-no');
  for (let i = 0; i < 200; i++) {
    const spread = drawThreeCardSpread();
    assert.equal(spread.length, 3);
    assert.equal(new Set(spread.map(({ cardId }) => cardId)).size, 3);
    assert.deepEqual(spread.map(({ spreadPosition }) => spreadPosition), THREE_CARD_POSITIONS.map(({ id }) => id));
    assert.ok(spread.every(({ readingType }) => readingType === 'three-card'));
  }
  for (let i = 0; i < 200; i++) {
    const love = drawLoveSpread();
    assert.equal(love.length, 2);
    assert.notEqual(love[0].cardId, love[1].cardId);
    assert.deepEqual(love.map(({ spreadPosition }) => spreadPosition), LOVE_POSITIONS.map(({ id }) => id));
    assert.ok(love.every(({ readingType }) => readingType === 'love'));
  }
  assert.equal(getDateKey(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
  const daily = drawCards(1, undefined, 'daily')[0];
  const saved = serializeDailyRecord(daily, '2026-09-26');
  const restored = parseDailyRecord(saved, '2026-09-26');
  assert.equal(restored?.cardId, daily.cardId);
  assert.equal(restored?.orientation, daily.orientation);
  assert.equal(restored?.readingType, 'daily');
  assert.equal(parseDailyRecord(saved, '2026-09-27'), null);
  for (const bad of [null, '', 'not json', 'null', '{}', '{"date":"2026-09-26","cardId":"nope","orientation":"upright"}', '{"date":"2026-09-26","cardId":"the-fool","orientation":"sideways"}', '{"date":"2026-09-26","cardId":5,"orientation":"upright"}']) {
    assert.equal(parseDailyRecord(bad, '2026-09-26'), null, String(bad));
  }
  for (const draw of all) {
    for (const orientation of ['upright', 'reversed']) {
      const result = getYesNoAnswer({ ...draw, orientation });
      assert.ok(result.answer in YES_NO_ANSWERS && result.label && result.summary, `${draw.cardId} ${orientation} yes/no`);
    }
  }
  console.log('Passed: 78 cards (22 major, 56 minor), unique slug IDs, four suits, unique draws, both orientations, four categories, three-card spread, love spread, daily record parsing, yes/no answers.');
} finally {
  const tempRoot = resolve(tmpdir());
  if (!resolve(output).startsWith(tempRoot + '\\') && !resolve(output).startsWith(tempRoot + '/')) throw new Error('Refusing to remove an unexpected test directory');
  rmSync(output, { recursive: true, force: true });
}
