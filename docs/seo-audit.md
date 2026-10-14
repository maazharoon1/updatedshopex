# Shopex technical and on-page SEO audit

Audit date: October 14, 2026 (America/Los_Angeles). Changes are local only; no commit, push, or deployment was performed.

## Scope and verified identity

- Inspected repository and ancestor directories for `AGENTS.md`; none was found. Git status was clean at the start of this audit. Existing portfolio data and the Illustration tab were preserved.
- Framework: React 18, Vite 5, TypeScript, React Router `BrowserRouter`. Deployment: Vercel static output with an SPA fallback. No dependency changes.
- The owner confirmed `shopex-portfolio.com`. Read-only HTTP checks verified that HTTPS apex returns a 308 to `https://www.shopex-portfolio.com/`, which serves this portfolio with HTTP 200. HTTP apex redirects to HTTPS apex. The canonical origin follows that existing www destination.
- Business name: **ShopEx Studio**, as displayed in the homepage heading, logos, and footer. **Shopex** is the owner-supplied alternate brand name. Service references come from the portfolio: animation, web and mobile app design, brand identity, illustration, packaging, and visual content.
- Existing logo: `/Blackandgreenlogo.png`. No verified external social profile URLs exist in the repository. No location, review, rating, affiliation, founding date, or unverified business claims were added to structured data. The two footer variants contain conflicting location text, so location needs owner review before use in SEO.

## Complete route inventory

All 53 public indexable routes were checked individually in the live HTTP audit, generated HTML audit, and rendered-browser metadata audit. The exact per-route titles, descriptions, canonical URLs, and live statuses are recorded in [seo-route-inventory.json](seo-route-inventory.json).

| Route or route set | Existing behavior and findings | Local implementation / remaining limitation |
| --- | --- | --- |
| `/` | Homepage with embedded work collection. Existing initial HTML pointed its canonical to the old Vercel host and described an independent artist rather than the broader portfolio. | Accurate brand/service title and description, confirmed-domain canonical, social metadata and JSON-LD in initial HTML. Visible content unchanged. |
| `/video/2dv68` through `/video/2dv90` (23 routes) | Valid project video pages. Initial HTML was identical to home; only client JavaScript changed some metadata. | Unique initial and rendered metadata, self-canonical URLs, individual existing thumbnail images, JSON-LD. |
| `/video/v01` through `/video/v29` (29 routes) | Same initial-HTML problem. `v20` and `v29` share an existing title and description. | Unique metadata; duplicate labels distinguish IDs in metadata only. Original visible titles/descriptions remain unchanged. Confirm whether these projects represent distinct work before consolidating them. |
| `/work` | React redirects to `/#projects`; HTTP response is currently 200. | Existing redirect behavior preserved. Excluded from sitemap; homepage canonical in fallback HTML. A server redirect requires a routing decision. |
| `/#home`, `/#projects`, category hashes | Homepage sections/filter states, not independent documents. Only active category is rendered; mobile initially shows eight cards. | Canonical remains `/`. Hash variants excluded from sitemap. Full discovery of image galleries requires structural work. |
| `/video/<unknown-or-image-id>` | React redirects to `/#projects`; HTTP response is currently 200. | Existing application behavior preserved. Not in sitemap. Invalid video metadata uses noindex before the existing client redirect; after redirect the homepage is correctly indexable. Server routing remains a recommendation. |
| All other paths, including `/about`, `/contact`, `/project/:id` | Catch-all React 404 screen, currently served with HTTP 200 by Vercel. `Project.tsx` exists but is not registered as a route. | Rendered 404 remains noindex and removes canonical/structured data. Correct HTTP 404 responses require a hosting/routing change and were not imposed. |
| Query strings and trailing-slash variants | Live `/video/v01` and `/video/v01/` both return 200; query strings do not identify separate content. | Canonicals omit query strings, fragments, and trailing slashes (except homepage `/`). Sitemap includes only that form. No new slash redirect policy imposed. |
| `robots.txt`, `sitemap.xml`, assets | Live crawler files point at the old Vercel host. Existing source sitemap lists only home and seven videos. | Generated from the shared domain and project data on every build; production sitemap contains precisely 53 URLs. Resources remain crawlable. |

There are no registered private/authenticated routes, contact forms, or form integrations in the inspected public UI. Robots rules are crawl directives, not access control.

## Implemented changes and files

| Files | Change |
| --- | --- |
| `src/lib/seo.ts` | One canonical origin and brand identity; accurate home and project metadata; canonical normalization; existing-image social URLs; Organization, WebSite, and WebPage JSON-LD; safe JSON-LD serialization. |
| `src/hooks/use-seo.ts` | Synchronizes canonical, descriptions, social cards, images, robots and structured data during client navigation. Restores home indexability after visiting a 404. Retains preview noindex during navigation. |
| `src/pages/Index.tsx`, `Video.tsx`, `NotFound.tsx` | Uses shared SEO metadata. JSX, visible text, classes, image/video rendering and click handlers were not changed. |
| `scripts/seo-plugin.ts`, `vite.config.ts`, `index.html` | Vite plugin generates metadata into the initial HTML for `/` and every existing video route. Video entry files use the same application shell and JavaScript bundles. This is static **head** generation, not body prerendering or an SSR migration. Removes meta keywords. |
| `public/robots.txt`, `public/sitemap.xml` | Removed stale manually maintained copies. Their public URLs remain available from generated `dist/robots.txt` and `dist/sitemap.xml`, and from Vite development middleware. |
| `vercel.json` | Adds a permanent, host-specific redirect from the old `shopex-six.vercel.app` alias to the confirmed HTTPS www origin, retaining paths and queries. Existing security/cache headers and SPA rewrite remain intact. Apex/www redirection already exists at the hosting level. |
| `package.json`, `scripts/seo-check.mjs` | Adds `npm run seo:check` to validate actual production artifacts, every route head, canonical consistency, social metadata, JSON-LD, unchanged app shells, referenced bundles and crawler files. |
| `scripts/seo-browser-audit.mjs`, `scripts/seo-live-audit.mjs` | Reproducible local browser comparisons and read-only live route/media audits. No forms or external messages are submitted. |
| `docs/seo-audit.md`, `docs/seo-route-inventory.json` | Audit findings, implementation scope, verification and complete route inventory. |

For Vercel preview/development builds (`VERCEL_ENV` present and not `production`), generated pages use `noindex,follow`, and the sitemap is empty with no sitemap declaration in robots. Crawling stays allowed so noindex can be read. Use deployment protection for private previews. Builds outside Vercel default to production metadata; other hosting preview pipelines must supply `VERCEL_ENV=preview`.

Open Graph/Twitter cards use the existing portfolio assets, at 1200×630 with a JPEG format for crawler compatibility. Website-displayed assets, crops, resolution, quality, eager/lazy behavior, dimensions and animations were preserved.

## Verification results

- `npm run build`: **passed**. Generates home plus 52 video HTML entries, robots and sitemap. Existing Browserslist data-age warning remains; dependencies were not updated.
- `npm run typecheck`: **passed**.
- `npm run lint`: **passed with seven pre-existing Fast Refresh warnings**, zero errors. Warning files: `badge.tsx`, `button.tsx`, `form.tsx`, `navigation-menu.tsx`, `sidebar.tsx`, `sonner.tsx`, `toggle.tsx` in `src/components/ui/`.
- `npm run seo:check`: **passed for all 53 production pages**. Checks one canonical per page, unique titles/descriptions, consistent OG/Twitter metadata, JSON-LD syntax and expected properties, no fabricated schema fields, canonical sitemap membership, local bundle existence and unchanged application shells. Sitemap also parsed successfully as XML.
- Separate temporary preview build and `seo-check.mjs --preview --dir=...`: **passed for all 53 pages**; confirms preview noindex and empty sitemap.
- Browser audit: **127 checks passed**, zero JavaScript exceptions. Tested at 1440×900 and 390×900: home, two representative video pages and 404; visible text, links, viewport geometry/styles and no horizontal overflow matched baseline. All 11 filters, Illustration gallery opening/next/close, mobile menu, load more, video navigation/back links, `/work`, invalid video redirects, and noindex recovery were checked. All 53 route heads were also checked after rendering.
- Screenshots were captured before and after. Video and 404 viewport captures matched byte for byte in the first comparison. Home screenshots show identical design but differ in existing external-image arrival timing and scrollbar size. Offscreen lazy-image loading changes document height between snapshots; this was not treated as a UI regression. Viewport box/style comparisons passed.
- Read-only live checks: **53/53 public pages returned HTTP 200**. Before deployment, every live initial page still had the same homepage title and old-host canonical; those live results are evidence of the existing problem, not evidence that local fixes are deployed.
- Media: **291/293 unique image IDs**, **52/52 video URLs**, **53/53 generated social-image URLs**, and **3/3 local logo/favicon assets** responded successfully. The two existing image IDs returning HTTP 404 are `Il0102` (Il01 cover image) and `Il03-3` (Il03 cover image). No guessed replacements were made.
- The Vercel fields actually configured (`redirects`, `headers`, `rewrites`) validated against their official schema definitions. The full provider schema has unrelated mixed-draft sections incompatible with the installed AJV; those unrelated fields were excluded from that check. Edge deployment behavior remains untested because deployment was not authorized.
- Final diff reviewed: no project data, CSS, navigation components, layouts, visible marketing copy, image components, video controls, form behavior or dependencies changed. `git diff --check` passes.

Re-run the browser audit against a production build with:

```powershell
npm.cmd run build
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run seo:check
node scripts/seo-browser-audit.mjs "$env:TEMP/shopex-seo-review"
node scripts/seo-live-audit.mjs
```

The comparison argument for the browser script is a prior output directory. Raw evidence from this audit is outside the repository in `%TEMP%/shopex-seo-before`, `%TEMP%/shopex-seo-after`, `%TEMP%/shopex-seo-preview` and `%TEMP%/shopex-seo-live.json`.

## Performance and rendering assessment

- Existing CSS output hashes are unchanged. The initial JavaScript gzip size changed from approximately 108.57 kB to 109.65 kB for shared metadata handling; no runtime dependency was added. Video metadata arrives in HTML without waiting for React execution.
- Existing responsive Cloudinary images, font preconnects, hero eager-loading, dimensioned logos and `video preload="none"` are already present. They were retained. No speculative preload, image-quality reduction, lazy-loading change or animation removal was applied.
- Unthrottled local samples observed homepage desktop CLS around 0.0037 and zero CLS on the sampled mobile/video/404 views. These are short local observations, not field Core Web Vitals or a Lighthouse score. Network-dependent LCP varied; no performance gain is claimed.
- Remaining risks: JavaScript execution is necessary for all body content, the whole portfolio data set ships with the initial bundle, desktop renders the full active collection, remote fonts/images affect timing, and existing lazy-card loading can alter offscreen document height. Address these only with measured follow-up changes and visual/regression testing.

## Recommendations requiring owner input or behavior/architecture changes

1. **Server rendering/prerendering:** initial body remains an empty React root. Consider a separately approved SSG/SSR migration for existing content. Do not add hidden SEO text. Google can render JavaScript, but rendering is an extra indexing step and other crawlers may not execute it. [Google JavaScript SEO documentation](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).
2. **Crawlable portfolio links:** project cards are buttons, image work opens modals, categories depend on hash state, and mobile load-more content requires interaction. Consider real anchor destinations and dedicated service/project pages while retaining design and keyboard/dialog behavior. Adding URLs or changing interaction semantics was outside this implementation.
3. **HTTP statuses:** change the SPA hosting fallback to return true 404 responses for unknown URLs, while explicitly preserving valid videos and the legacy `/work` behavior. Invalid video IDs currently redirect to home; decide whether they should instead show 404. The existing rendered noindex helps, but does not fix HTTP status. [Google guidance on SPA soft 404s](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics#avoid-soft-404-errors-in-single-page-apps).
4. **Broken images:** confirm/upload the intended assets for `Il0102` and `Il03-3`. Their replacements cannot be inferred safely; the supplied IDs remain unchanged.
5. **Back-link hash:** the video back link uses `/#2d-Animations`, while the actual category is `Animations`. Navigation reaches home, but category/scroll targeting needs an approved behavior correction.
6. **Visible business identity:** confirm the actual location, preferred brand styling, email address and social profile URLs. Resolve conflicting location text if appropriate. Then add verified profile links and `sameAs` values. Some illustration titles/descriptions remain identifiers/empty; useful project descriptions would need owner-approved visible content.
7. **Duplicate work:** review `v20` and `v29`, which share titles/descriptions. Metadata IDs distinguish them safely, but no content consolidation or canonical cross-link was guessed.
8. **Slash/alias policy:** canonicals normalize variants without adding slash redirects. Confirm any desired permanent slash policy before altering it. Configure alternate/legacy host redirects in Vercel domain settings too; a repository rule only affects domains attached to the deployed project.

## External steps after the owner deploys

1. Keep `www.shopex-portfolio.com` attached as the primary production domain and the existing apex-to-www HTTPS redirect. Confirm the old Vercel alias reaches the intended project before relying on the new host-specific redirect.
2. Verify the `shopex-portfolio.com` Domain property in Google Search Console via the owner's DNS. No verification token was invented or inserted.
3. Submit `https://www.shopex-portfolio.com/sitemap.xml`. Use URL Inspection on home and representative videos, inspect rendered HTML and request indexing for important pages. Recheck canonicals, redirects, slash variants, response headers and crawler files on the deployed build.
4. Validate deployed JSON-LD with Schema Markup Validator and use appropriate Google testing tools. Local JSON syntax/property checks passed; external structured-data tools and Google indexing status were not available for the undeployed changes. WebSite site-name markup is not covered by Google's Rich Results Test. [Google site-name guidance](https://developers.google.com/search/docs/appearance/site-names).
5. Keep the business name, domain, logos and verified social profiles consistent on genuine brand accounts. Monitor branded queries such as “Shopex” and “ShopEx Studio”, indexed pages, selected canonicals and field Core Web Vitals in Search Console. Rankings and indexing are not guaranteed.

Build generation uses the supported [Vite plugin hooks](https://vite.dev/guide/api-plugin.html); Vercel static filesystem entries take precedence over the retained SPA rewrite according to [Vercel configuration documentation](https://vercel.com/docs/project-configuration/vercel-json). Verify those entries on the eventual deployment; the local audit server does not emulate all Vercel edge rules.
