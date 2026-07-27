# Lirja Patel — tech blog

A fast, content-driven website built with **Astro**, **React islands**, **Tailwind CSS**, and a
**headless CMS**. Content is fetched at build time and rendered to static HTML — no runtime CMS
calls, no client-side data fetching, and no JavaScript on the page unless something on it is
genuinely interactive.

**Live site:** https://lirja-tech-blog.netlify.app
**Content editor:** https://lirja-tech-blog.netlify.app/admin/
**Editor's guide:** https://lirja-tech-blog.netlify.app/editing

---

## What this project demonstrates

| Area | How |
| --- | --- |
| **Content-first architecture** | Pages never talk to a CMS. They ask one adapter module, which resolves Contentful or local Markdown. |
| **Non-technical publishing** | A real editing UI at `/admin` with an editorial workflow, plus an on-site [guide](src/pages/editing.astro) written for people who have never opened a code editor. |
| **Performance as a budget** | ~147 KB of JavaScript on the homepage, enforced by a test that fails the build if it regresses. |
| **Accessibility as a test** | Every page is scanned by axe-core in light and dark mode, plus explicit keyboard-interaction tests. |
| **Type-safe content** | A Zod schema validates every Markdown file at build time; a malformed post fails the build instead of shipping. |
| **Generated social cards** | A 1200×630 PNG is rendered per post at build time with satori — no design tool in the loop. |

---

## Getting started

```bash
npm install
npm run dev          # http://localhost:4321
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Static build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run cms` | Local CMS backend, so `/admin` edits real files (see below) |
| `npm run check` | Type-check Astro templates, TypeScript and the content schema |
| `npm test` | Playwright end-to-end + accessibility suite |
| `npm run test:ui` | Playwright's interactive test runner |
| `npm run verify` | `check` + `build` + `test` — what CI runs |

---

## Architecture

```
Contentful  ─┐
             ├─►  src/lib/posts.ts  ─►  pages & components  ─►  static HTML
Markdown    ─┘      (the adapter)
```

### The content adapter

[`src/lib/posts.ts`](src/lib/posts.ts) is the only module that knows where content lives:

1. If `CONTENTFUL_SPACE_ID` **and** `CONTENTFUL_ACCESS_TOKEN` are set, posts come from Contentful.
2. Otherwise they come from Markdown in [`src/content/blog/`](src/content/blog/).

Both sources normalise to the same `BlogPost` shape, so **switching CMS is a config change, not a
refactor**. It also means the repo clones and runs with zero configuration, and a CMS outage can
never break a build.

### Why Markdown *and* Contentful?

They serve different teams. Contentful suits a marketing org that already lives there. The
Markdown collection suits a small team that wants content in version control with pull-request
review — and it is what the `/admin` editor writes to. The adapter means the site does not care.

### Content schema

[`src/content/config.ts`](src/content/config.ts) defines a Zod schema for every post. A missing
title, a malformed date, or a typo'd field name **fails the build with a readable error** rather
than rendering a broken page. The CMS fields in
[`public/admin/config.yml`](public/admin/config.yml) mirror this schema deliberately — the editing
UI and the type system describe the same content model.

---

## Editing content

### Locally, through the CMS UI

```bash
npm run cms          # terminal 1 — local CMS backend on :8081
npm run dev          # terminal 2 — the site on :4321
```

Open **http://localhost:4321/admin/**. Because `local_backend: true` is set in
`public/admin/config.yml`, the CMS reads and writes the real Markdown files in
`src/content/blog/` — no GitHub account, no network, no login. Saving a post writes a file; the dev
server hot-reloads.

### In production

`/admin` uses Netlify Identity + Git Gateway: editors sign in with an email address and never see
GitHub. Publishing commits to `main`, which triggers a rebuild.

To enable it:

1. Netlify → **Site configuration → Identity** → enable Identity.
2. Under **Registration**, set *Invite only*.
3. Under **Services → Git Gateway**, enable it.
4. Invite editors by email.

### Directly in Markdown

Add a file to `src/content/blog/`. The filename becomes the URL.

```markdown
---
title: A post about something
excerpt: One or two sentences used on cards, in RSS, and as the meta description.
publishedDate: 2026-07-27
tags: [Astro, Performance]
featured: false
draft: false
---

Body content in Markdown.
```

---

## Environment variables

Copy `.env.example` to `.env` if you want to source content from Contentful:

```ini
CONTENTFUL_SPACE_ID=your_space_id
CONTENTFUL_ACCESS_TOKEN=your_delivery_api_token
CONTENTFUL_ENVIRONMENT=master
```

Without these, the build uses Markdown automatically. The matching Contentful content type is
`blogPost`, with fields `title`, `slug`, `excerpt`, `body` (Rich Text), `tags`, `publishedDate`,
`coverImage`, and `readingTime`.

---

## Testing

```bash
npm test                 # everything
npm run test:a11y        # accessibility only
npm run test:ui          # interactive runner
```

Tests run against a **real production build** served by `astro preview`, not the dev server — so
the suite exercises the same output that gets deployed, including generated OG images and the
search index.

| Suite | Covers |
| --- | --- |
| [`navigation.spec.ts`](tests/navigation.spec.ts) | Page rendering, routing, tag filtering, 404, mobile drawer |
| [`search.spec.ts`](tests/search.spec.ts) | Keyboard shortcut, filtering, arrow-key navigation, empty state, failed index fetch |
| [`a11y.spec.ts`](tests/a11y.spec.ts) | axe-core on 7 pages × light/dark, skip link, theme persistence, heading order, image alt text |
| [`content.spec.ts`](tests/content.spec.ts) | RSS validity, sitemap, structured data, OG images, UTC date handling, JavaScript budget |

Two decisions worth noting:

- **Scans request reduced motion.** Elements fade in from `opacity: 0`, and a scanner that samples
  mid-animation reports contrast failures for text that is perfectly legible once settled. This
  also verifies that reduced-motion support leaves content *visible* rather than stuck invisible.
- **Workers are capped at 3.** `astro preview` is a lightweight static server; one worker per CPU
  core saturated it and produced failures that never reproduced individually.

---

## Performance

The homepage ships **~147 KB** of JavaScript — the React runtime plus two islands (search and the
newsletter form). Everything else is static HTML.

This is enforced, not aspirational: `content.spec.ts` fails if the homepage exceeds 175 KB. That
budget earned its keep — importing Preline's default entry point site-wide added **297 KB to every
page** to power one FAQ accordion. Scoping the import to just that component on just that page
brought total JavaScript from 446 KB down to 153 KB.

Other measures:

- Content fetched at build time — zero runtime CMS calls.
- The search index is a separate JSON file, fetched only when a reader opens the dialog.
- The mobile drawer and search dialog use the native `<dialog>` element: focus trapping,
  Escape-to-close and background inertness from the platform, at no bundle cost.
- Theme is applied by a render-blocking inline script so dark-mode readers never see a white flash.

---

## Accessibility

Verified by axe-core in CI across seven pages in both colour schemes, plus keyboard tests that a
scanner cannot perform. Notable fixes made during development:

- **Colour contrast.** The original palette failed WCAG AA in several places — muted text at 3.7:1
  and white-on-teal buttons at 3.74:1. The primary colour moved to teal-700 and the muted-text
  scale was raised.
- **Scrollable regions.** The field-reference table scrolls horizontally on mobile; it needed
  `tabindex="0"` so keyboard users can reach the off-screen columns.
- **Stretched links.** Post cards previously exposed three links to the same URL. They now expose
  one, with a `::after` overlay keeping the whole card clickable.
- **Reduced motion.** `animate-fade-up` uses `animation-fill-mode: both`, so simply cancelling the
  animation left elements permanently invisible. It resets to the final state instead.

---

## Deployment

Netlify builds from `netlify.toml` (`npm run build` → publish `dist`). Push to `main` and it
deploys.

### First deploy

```bash
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

Then in Netlify: **Add new site → Import an existing project → GitHub**, pick the repo, and
deploy. Build settings come from `netlify.toml`, so there is nothing to type in, and no
environment variables are required — without Contentful credentials the site builds from the
Markdown in `src/content/blog/`.

Two things only work once deployed, because both are Netlify services rather than site code:

- **The newsletter form.** Netlify registers it from the built HTML on first deploy; submissions
  then appear under **Forms**. Locally the island reports that it is unavailable rather than
  faking a success.
- **`/admin` sign-in.** Enable **Site configuration → Identity**, then **Identity → Services →
  Git Gateway**. Add editors with **Invite users**. Until Identity is on, the CMS loads but
  cannot authenticate. For local editing, `npm run cms` needs no accounts at all.

### The site URL is not hardcoded

Canonical tags, RSS links, the sitemap, and social-card metadata all need the domain being
served, which Netlify only assigns after the first deploy. `astro.config.mjs` therefore reads it
from the build environment:

| Variable           | Set by Netlify for          | Used for                        |
| ------------------ | --------------------------- | ------------------------------- |
| `URL`              | the production deploy       | the real canonical domain       |
| `DEPLOY_PRIME_URL` | branch and PR previews      | previews referencing themselves |
| *(neither)*        | local `npm run build`       | `http://localhost:4321`         |

Nothing to configure, and no step where a preview deploy tells search engines it is production.
Pages read it through `Astro.site`; endpoints take it from the `site` property Astro passes them.

### Rebuild when content changes

1. Netlify → **Build & deploy → Build hooks** → create a hook and copy the URL.
2. Point your CMS at it:
   - **Contentful:** Settings → Webhooks → new webhook on Entry publish/unpublish.
   - **Decap/Git Gateway:** nothing to do — publishing commits to `main`, which already triggers a
     build.

### Generated routes

| Route | Description |
| --- | --- |
| `/` | Homepage: hero, featured post, latest essays, topics |
| `/blog` | Full archive, grouped by year |
| `/blog/[slug]` | An article, with table of contents and related posts |
| `/tags/[tag]` | Posts for one topic |
| `/about` | About page, including how AI tooling is used here |
| `/editing` | Editor's guide — the publishing workflow for non-developers |
| `/admin` | The CMS itself |
| `/og/[slug].png` | Generated 1200×630 social card per post |
| `/search-index.json` | Search corpus, fetched on demand |
| `/rss.xml`, `/sitemap.xml`, `/robots.txt` | Feeds and crawler metadata |
| `/404` | Custom not-found page with recent posts |

---

## Notes on the CMS bundle

Decap CMS is ~4.9 MB. It is a build artefact, not source, so
[`scripts/fetch-cms.mjs`](scripts/fetch-cms.mjs) downloads a pinned version into `public/admin/`
on `predev` and `prebuild`, and the file is gitignored. Serving it from our own origin rather than
a CDN means `/admin` keeps working if the CDN has a bad day. A failed download is a warning rather
than an error — a network hiccup should never fail a deploy of the public site over an admin-only
asset.
