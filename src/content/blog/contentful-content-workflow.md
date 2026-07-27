---
title: A calm Contentful workflow editors will not fight
excerpt: A headless CMS is only as good as its content model. Model it around how editors think, and publishing stops being a negotiation with your codebase.
publishedDate: 2026-04-08
tags:
  - Contentful
  - CMS
  - DX
readingTime: 6 min read
---

The promise of a headless CMS is clean: editors publish content, developers own presentation, and neither blocks the other. The reality depends almost entirely on one thing you decide early — the content model. Get it right and publishing is effortless. Get it wrong and every new post becomes a support ticket.

## Model the thing, not the page

The classic mistake is modeling content as pages full of loose fields — a title here, some raw HTML there. Model the underlying *thing* instead. A blog post has a title, a slug, an excerpt, a body, tags, and a date. Those fields are true no matter where the post is rendered.

- **Title** — short text, required.
- **Slug** — the URL segment, unique and validated.
- **Body** — rich text, so editors format without touching markup.
- **Tags and date** — structured metadata for sorting and filtering.

## Rich text is data, not a string

Contentful stores rich text as a structured document, which means you render it deliberately instead of trusting a blob of HTML. That is a feature: you decide exactly how a heading or a code block looks, and editors cannot break the layout by pasting from a word processor.

```ts
import { documentToHtmlString } from '@contentful/rich-text-html-renderer'

const body = fields.body
  ? documentToHtmlString(fields.body)
  : `<p>${fields.excerpt}</p>`
```

## Always have a fallback

Your site should build even when the CMS is unreachable or the credentials are missing. This blog keeps its posts as Markdown in the repo and falls back to them whenever the Contentful client cannot be created. Contributors can run the whole site with zero configuration, and a CMS outage never breaks the build.

> A good content model is invisible. Editors just publish, and the right thing appears.

## Fetch at build, not at runtime

For a blog, content changes far less often than it is read. Fetching posts at build time turns every request into a static file — no runtime API calls, no per-visitor latency, no CMS bill that scales with traffic. When an editor publishes, a webhook rebuilds the site and the new post goes live minutes later.

## The workflow, end to end

An editor writes in the CMS and hits publish. A webhook pings the host. The site rebuilds, fetching the latest entries and rendering them to static HTML. No developer is involved, nothing is redeployed by hand, and readers get a page that loads instantly. That is the calm workflow — everyone doing their job without stepping on each other.
