# Oracle

Astro static site for tarot readings (One Card, Yes or No, Three Card, Love, Daily), daily horoscopes and guides for the 12 zodiac signs, and zodiac compatibility. No server, database, or paid API.

## Local development

```bash
pnpm install
pnpm run dev
```

## Build and checks

```bash
pnpm run build       # static site into dist/
pnpm run check       # astro check (types)
pnpm run test:tarot  # card data and draw logic
pnpm run test:share  # share link encode/decode and share/copy fallbacks
pnpm run test:zodiac # zodiac content, daily horoscope, compatibility
pnpm run test:seo    # builds the site several ways and audits metadata, sitemap, robots, links, ads switch
pnpm run check:deploy -- https://<your-site>  # smoke test of a live deployment
```

Node 22 or newer (see `.node-version`) and pnpm (see `packageManager` in `package.json`).

Card artwork can be added as `public/cards/<card-id>.webp`; reading pages detect available files at build time and use the CSS card visual when no file exists.

## Configuration

Copy `.env.example` to `.env` for local use. All values are optional and read at build time: `PUBLIC_SITE_URL`, `PUBLIC_CONTACT_EMAIL`, `PUBLIC_ADSENSE_CLIENT`, `PUBLIC_ADSENSE_ENABLED`. Ads are off by default. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Cloudflare Pages settings, Web Analytics, AdSense preparation, `ads.txt`, consent requirements, and renaming the site.
