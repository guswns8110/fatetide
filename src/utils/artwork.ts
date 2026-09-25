import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

/** Build-time list of card IDs that have a WebP file in public/cards. */
export function getArtworkIds(): string[] {
  const directory = resolve(process.cwd(), 'public/cards');
  return existsSync(directory)
    ? readdirSync(directory).filter((name) => /\.webp$/.test(name)).map((name) => name.replace(/\.webp$/, ''))
    : [];
}
