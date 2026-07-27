# Lirja Tech Blog

A fast, content-driven blog built with **Astro** static pages, **React islands** for
interactivity, **Tailwind CSS + daisyUI** for styling, and **Contentful** as the headless
CMS. Posts are fetched at **build time** and rendered to static HTML — no runtime CMS calls,
no client-side data fetching. Deployed to **Netlify** with automatic rebuilds triggered by
Contentful webhooks.

## Why this stack

- **Astro (static output)** — ships zero JavaScript by default; pages are pre-rendered HTML.
- **React islands** — only interactive components (e.g. the newsletter form) hydrate on the
  client via `client:load`. Everything else stays server-rendered for performance.
- **Contentful** — editors publish posts in the CMS; a webhook kicks a Netlify rebuild, so
  new content goes live without a code deploy.
- **Graceful fallback** — with no Contentful credentials the site renders local mock posts
  (`src/data/mockPosts.ts`), so it runs end-to-end out of the box.

## Getting started

```bash
npm install
npm run dev          # http://localhost:4321
```

| Script            | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the dev server with hot reload |
| `npm run build`   | Build the static site into `dist/`   |
| `npm run preview` | Preview the production build locally  |

## Environment variables

Copy `.env.example` to `.env` and fill in your Contentful Delivery API credentials:

```ini
CONTENTFUL_SPACE_ID=your_space_id_here
CONTENTFUL_ACCESS_TOKEN=your_delivery_api_token_here
CONTENTFUL_ENVIRONMENT=master
```

Without these, the build falls back to mock posts automatically.

## Contentful content model

Create a content type with the **API identifier** `blogPost` and these fields:

| Field           | Field ID        | Type            | Notes                                  |
| --------------- | --------------- | --------------- | -------------------------------------- |
| Title           | `title`         | Short text      | Required                               |
| Slug            | `slug`          | Short text      | Unique; used in the URL                |
| Excerpt         | `excerpt`       | Short text      | Card + meta description                |
| Body            | `body`          | Rich text       | Rendered to HTML at build time         |
| Tags            | `tags`          | Short text list | Optional                               |
| Published date  | `publishedDate` | Date & time     | Used for ordering and the RSS pubDate  |
| Cover image     | `coverImage`    | Media           | Optional                               |
| Reading time    | `readingTime`   | Short text      | Optional; auto-estimated if empty      |

Field mapping lives in `src/lib/contentful.ts`.

## Site configuration

Edit `src/consts.ts` to set the site title, description, production URL, and social links.
Keep `SITE.url` in sync with `site` in `astro.config.mjs` — both are used to build absolute
URLs for the RSS feed, sitemap, and canonical tags.

## Generated routes

| Route          | Description                        |
| -------------- | ---------------------------------- |
| `/`            | Home + latest posts                |
| `/blog/[slug]` | Individual post (one per CMS entry) |
| `/rss.xml`     | RSS 2.0 feed                       |
| `/sitemap.xml` | Sitemap                            |
| `/robots.txt`  | Robots file pointing to sitemap    |
| `/404`         | Custom not-found page              |

## Deploy to Netlify

1. Push this repo to GitHub.
2. In Netlify: **Add new site → Import an existing project**, pick the repo.
   Build settings are read from `netlify.toml` (`npm run build` → publish `dist`).
3. Add the Contentful env vars under **Site settings → Environment variables**.
4. Deploy. Update `SITE.url` / `astro.config.mjs` `site` to the assigned Netlify URL and
   redeploy so absolute URLs are correct.

### Auto-rebuild on new content

1. Netlify → **Site settings → Build & deploy → Build hooks** → create a hook, copy the URL.
2. Contentful → **Settings → Webhooks** → new webhook pointing at that URL, triggered on
   Entry **publish/unpublish**.

Publishing a post in Contentful now triggers a fresh static build automatically.
