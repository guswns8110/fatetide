export function randomInt(maxExclusive: number): number {
  if (!Number.isSafeInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > 0x100000000) {
    throw new RangeError('maxExclusive must be an integer between 1 and 2^32');
  }
  if (globalThis.crypto?.getRandomValues) {
    const range = 0x100000000;
    const limit = Math.floor(range / maxExclusive) * maxExclusive;
    const sample = new Uint32Array(1);
    do { globalThis.crypto.getRandomValues(sample); } while (sample[0] >= limit);
    return sample[0] % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}

export function fisherYates<T>(values: readonly T[]): T[] {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
