# Working in this repo

Context for AI coding agents (and new contributors) working on this site.

## What this is

A statically generated content site: Astro pages, React islands for the few interactive pieces,
Tailwind + daisyUI for styling, and a headless CMS behind an adapter. It is a **website, not a web
app** — if a change adds client-side state to something that could be static HTML, that is
probably the wrong direction.

## Non-negotiables

1. **Pages never import a CMS client.** They import from `src/lib/posts.ts`. That module is the
   only thing that knows whether content came from Contentful or Markdown. Keep it that way — it
   is what makes the CMS swappable.

2. **The JavaScript budget is a test, not a guideline.** `tests/content.spec.ts` fails if the
   homepage exceeds 175 KB of JavaScript. Before adding a dependency that ships to the browser,
   check what it costs. Preline's default entry point cost 297 KB on every page; importing the one
   component actually needed cost 6.5 KB on one page.

3. **Accessibility is checked in CI.** `npm run test:a11y` runs axe-core over every page in light
   and dark mode. New UI needs to pass before it merges. Native elements first — `<dialog>` gives
   focus trapping and Escape handling that a hand-rolled version will get wrong.

4. **Format dates through `src/lib/format.ts`.** Frontmatter dates parse as UTC midnight; calling
   `Intl.DateTimeFormat` without `timeZone: 'UTC'` renders the previous day on any build machine
   west of Greenwich. There is a test guarding this.

5. **The content schema and the CMS config must agree.** `src/content/config.ts` (Zod) and
   `public/admin/config.yml` (Decap fields) describe the same model. Change one, change the other,
   or editors get a field that fails validation at build time.

## Layout

```
src/
  content/blog/     Markdown posts — the default content source
  content/config.ts Zod schema; the contract between content and code
  lib/
    posts.ts        The content adapter. Start here.
    contentful.ts   Contentful client; returns null when unconfigured
    format.ts       UTC-safe date formatting
    og-image.ts     Build-time social card rendering (satori + sharp)
    cover-art.ts    Deterministic gradient per tag
  components/       Astro components; .jsx files are hydrated islands
  layouts/          BaseLayout owns <head>, nav, footer, structured data
  pages/            File-based routes, including .png and .json endpoints
public/admin/       Decap CMS (bundle is fetched at build time, gitignored)
tests/              Playwright: navigation, search, a11y, content
```

## Conventions

- **Comments explain *why*, not *what*.** The code says what it does. A comment earns its place by
  recording a decision, a constraint, or a bug that is easy to reintroduce.
- **Astro components for anything static.** Reach for a `.jsx` island only when the thing needs
  client-side state, and pick the narrowest hydration directive that works (`client:visible` over
  `client:load`).
- **Tailwind utilities in markup; shared patterns as `@layer components` classes** in
  `src/styles/global.css` (`.surface-card`, `.chip`, `.nav-link`).
- **Muted text stops at `/70`.** Lower opacities fail WCAG AA contrast on the light theme. The
  axe suite will catch it, but it is faster not to write it.

## Before you call something done

```bash
npm run verify      # type-check + build + full test suite
```
