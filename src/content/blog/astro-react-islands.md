---
title: 'Astro islands: interactivity without shipping a framework'
excerpt: Most pages are 95% static and 5% interactive. Astro lets you ship the 5% as hydrated React and send zero JavaScript for the rest.
publishedDate: 2026-05-12
tags:
  - Astro
  - Performance
  - Architecture
readingTime: 6 min read
---

For years the default was to render an entire page with a client-side framework, ship the whole runtime, and hydrate everything — including the paragraphs that will never change. Astro flips the default. Pages are static HTML, and interactivity is opt-in, component by component. The parts that do not move send no JavaScript at all.

## The mental model: islands in a sea of HTML

Think of a page as mostly-static content — the sea — with a few interactive widgets floating in it — the islands. A newsletter form, a search box, a theme toggle. Each island hydrates independently; the sea stays inert and instant.

```astro
<!-- Static: rendered once, ships no JS -->
<PostList posts={posts} />

<!-- Island: hydrates on load -->
<NewsletterSignup client:load />
```

## Choose a hydration strategy on purpose

The `client:*` directive is where the performance budget lives. Picking the right one per component is most of the craft.

- `client:load` — hydrate immediately. For controls the visitor uses right away.
- `client:idle` — wait for the main thread to breathe. For nice-to-haves.
- `client:visible` — hydrate when it scrolls into view. Perfect for below-the-fold widgets.
- `client:media` — hydrate only at certain breakpoints, like a mobile-only menu.

A form the visitor might never scroll to does not need to hydrate on load. Moving it to `client:visible` is a free win on both Time to Interactive and total bytes.

> The fastest JavaScript is the JavaScript you never send.

## Data fetching happens at build time

Because content is fetched while the site builds, the browser receives finished HTML — no loading spinners, no client-side round trip to a CMS. Pages arrive as pre-rendered documents that are already complete.

```astro
---
// runs at build time, on the server
const posts = await getAllPosts()
---
<PostGrid posts={posts} />
```

## When islands are the wrong tool

Islands shine for content-led sites: blogs, docs, marketing, portfolios. If you are building something that is one giant stateful application — a spreadsheet, a design tool — a single-page app is still the better fit. Architecture should follow the shape of the product, not the other way around.

## The payoff

Readers get pages that are interactive where it counts and instant everywhere else. The static core stays cheap to serve and easy to cache, while React shows up only in the few places that genuinely need it. That balance — flexible for you, fast for them — is the whole reason to reach for islands.
