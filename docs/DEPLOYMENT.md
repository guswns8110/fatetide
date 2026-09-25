# Deployment and AdSense preparation

FateTide is a static Astro site. There is no server, database, or worker. This file lists what has to be done outside the code.

## 1. Deploy to Cloudflare Pages (Git)

1. Put the project in a GitHub repository. From the project folder (a local Git repository is already initialized, with no commits yet):

   ```bash
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```

   `.gitignore` already excludes `node_modules/`, `dist/`, `.astro/`, and `.env*` (except `.env.example`). No secrets are in the repository.

2. In the Cloudflare dashboard open Workers & Pages, create a Pages project, and connect the GitHub repository. (Menu names change from time to time; you are looking for "Create application > Pages > Connect to Git".)

3. Use these build settings:

   | Setting | Value |
   |---|---|
   | Framework preset | Astro |
   | Build command | `pnpm run build` |
   | Build output directory | `dist` |
   | Root directory | empty (the repository root is the project) |

   The Node version comes from `.node-version` (`22`, which Astro 5 supports) and the package manager from `packageManager` in `package.json` plus `pnpm-lock.yaml`. Do not also set `NODE_VERSION` in the dashboard, so the version lives in one place. The project was developed and tested on Node 24; Node 22 has not been run locally, so check the first Cloudflare build log.

4. Add the environment variables below, then deploy. Cloudflare assigns `https://<project>.pages.dev`.

5. Set `PUBLIC_SITE_URL` to that exact address (no trailing path) and trigger a new deploy, because the value is read at build time. Canonical links, Open Graph URLs, structured data, `sitemap.xml`, and the `Sitemap:` line in `robots.txt` only appear once it is set.

6. Verify the live site:

   ```bash
   pnpm run check:deploy -- https://<project>.pages.dev
   ```

   It checks page status codes, that `?query` strings survive (including on slash-less URLs), the redirect chain for `/tarot` versus `/tarot/`, canonical and Open Graph URLs, JSON-LD, `noindex` on the shared page and the 404, `robots.txt`, `sitemap.xml`, the social image, cache and security headers, and that AdSense is off. It exits non-zero if anything fails. Add `--no-headers` when pointing it at a local `pnpm run preview` server.

`public/_headers` sets `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and long-lived caching for hashed files under `/_astro/`. It is a static Pages file, not a Function.

### Environment variables

Set these under Pages > Settings > Environment variables (Production). They are all public build-time values, not secrets, and every one may be left empty.

| Variable | Purpose | Default |
|---|---|---|
| `PUBLIC_SITE_URL` | The real origin, for example `https://<project>.pages.dev` or your own domain. | empty |
| `PUBLIC_CONTACT_EMAIL` | A real, monitored address. Shown in the footer and at the end of the policy pages. Hidden when empty. | empty |
| `PUBLIC_ADSENSE_CLIENT` | Publisher ID (`ca-pub-` plus digits). When valid it adds the `google-adsense-account` meta tag for site verification. It does not load any ad script by itself. | empty |
| `PUBLIC_ADSENSE_ENABLED` | Must be exactly `true`, and needs a valid client ID, before the AdSense script and ad slots are rendered. | `false` |

The site builds and runs with all four empty or unset.

### Trailing slashes and redirects

Pages are built as `folder/index.html`, and canonical URLs and all internal links use the trailing-slash form (`/tarot/`). Links you type or share without the slash (`/tarot`) are handled by Cloudflare, either by serving the page or by a single redirect; `check:deploy` records which. Share links are always generated as `/tarot/shared/?v=1&...`.

### Site structure and legacy routes

The two main pages are `/yes-or-no/` and `/today/`. `public/_redirects` sends the old addresses there with a 301: `/tarot/yes-or-no/` to `/yes-or-no/` and `/tarot/daily/` to `/today/` (with and without the trailing slash). One Card, Three Card, Love, and the Tarot hub still work but are `noindex, follow`, out of the sitemap, and not linked from the header, footer, or homepage. Compatibility and the Horoscope page stay indexable and are linked from the zodiac guides. To bring a de-emphasized page back into search results, remove `noindex` from its page and add its path to `src/config/sitemap.ts`. Existing share links keep working because `/tarot/shared/` and the `t=` reading types did not change.

## 2. Custom domain

Add the domain under the Pages project's Custom domains, follow Cloudflare's DNS instructions, then set `PUBLIC_SITE_URL` to the new origin and redeploy. Pick one host (apex or `www`) and redirect the other to it. Re-run `check:deploy` against the new origin.

## 3. Search Console

Add the site in Google Search Console (the domain or URL-prefix property for the live origin), submit `<origin>/sitemap.xml`, and check indexing after a few days. `/tarot/shared/` and the 404 are `noindex, follow` on purpose and are not in the sitemap.

## 4. Cloudflare Web Analytics (not enabled in code)

The code contains no analytics beacon. After the site is live, open the Pages project's Metrics or Web Analytics section and enable Web Analytics (Cloudflare can add the beacon for Pages projects), or use Analytics & Logs > Web Analytics > Add a site. Then update the Analytics section of `src/pages/privacy.astro` and `POLICY_UPDATED` in `src/config/site.ts`. Google Analytics is not used.

If custom events are ever added, send only coarse names and never a question or typed text: `tarot_reading_completed`, `tarot_share_clicked`, `tarot_native_share_success`, `tarot_link_copied`, `shared_result_opened`, `shared_result_start_reading`, `horoscope_viewed`, `compatibility_checked`.

## 5. Before applying to Google AdSense

Only the site owner can do these:

- [ ] Publish the site and open every page on a phone.
- [ ] Set a real contact address (`PUBLIC_CONTACT_EMAIL`). The policy pages are drafts written from how the site actually behaves; have them reviewed for your country and situation. They are not legal advice.
- [ ] Prefer a domain you own, then redeploy with the new `PUBLIC_SITE_URL`.
- [ ] Add the site in AdSense and verify ownership: set `PUBLIC_ADSENSE_CLIENT` (adds the verification meta tag) or paste the snippet Google gives you.
- [ ] Keep `PUBLIC_ADSENSE_ENABLED` at `false` until AdSense approves the site. Approval is never guaranteed.

### ads.txt

There is no `public/ads.txt`, on purpose. After approval, copy `deploy/ads.txt.template` to `public/ads.txt`, replace `pub-XXXXXXXXXXXXXXXX` with the real ID from AdSense, and redeploy. `pnpm run test:seo` fails if `public/ads.txt` still holds a placeholder, and `check:deploy` expects `/ads.txt` to be absent until you add it (edit that expectation when you do).

### Consent (EEA, United Kingdom, Switzerland)

The site has no cookie banner or consent tool, and a home-made "Accept all" banner would not satisfy Google's requirements. Before ads are enabled for visitors in the EEA, the UK, or Switzerland, use Google's Privacy & Messaging tool (in the AdSense account) or another Google-certified consent management platform, add its snippet to `src/layouts/BaseLayout.astro`, and update the privacy policy.

### Ad placement rules

`src/components/ads/AdSlot.astro` renders nothing unless ads are enabled and the slot has a valid ad unit ID. Slots sit only between content sections, never next to the card picker, Draw and Shuffle buttons, Share My Reading, Copy Link, the sign selectors, or navigation, and each carries an "Advertisement" label. Use `<AdSlot slot="1234567890" placement="..." />` with a real ad unit ID.

## 6. Renaming the site

`PROJECT_NAME` in `src/config/site.ts` is a working name. To rename: change it (and `SITE_TAGLINE`), edit the text in `scripts/assets/og-default.svg`, run `node scripts/render-og.mjs` and open the printed URL in a Chromium browser to regenerate `public/og-default.jpg`, search the pages and policies for the old name, and redeploy.

## 7. Known limits

Every page shares one social preview image; per-reading previews would need server code, which the MVP avoids. Safari, Firefox, and real iOS or Android share sheets were not testable in the development environment and are on the manual checklist.
