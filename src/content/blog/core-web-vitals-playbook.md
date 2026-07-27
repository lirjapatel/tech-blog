---
title: A Core Web Vitals playbook for content sites
excerpt: LCP, CLS, and INP are not mysterious. They map to three concrete questions about your page — and each has a short list of fixes that actually move the number.
publishedDate: 2026-04-27
tags:
  - Performance
  - Frontend
readingTime: 7 min read
---

Core Web Vitals sound abstract until you translate them into plain questions. Largest Contentful Paint asks *how fast does the main thing show up?* Cumulative Layout Shift asks *does the page jump around while it loads?* Interaction to Next Paint asks *does it respond when I tap?* Fix the questions and the scores follow.

## LCP: get the hero on screen fast

On a content site the largest element is usually a heading or a cover image. Two changes move this number the most:

- **Preconnect and preload** the resources the hero depends on — fonts and the cover image — so the browser starts fetching them early.
- **Stop hiding text behind fonts.** Use `font-display: swap` so words render immediately in a fallback and reflow when the webfont lands.

```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preload" as="image" href="/hero.avif" />
```

## CLS: reserve space for everything

Layout shift is almost always something arriving late and shoving the rest of the page down. The fix is boring and reliable: reserve the space up front.

- Always set `width` and `height` (or an `aspect-ratio`) on images and embeds.
- Give ads, banners, and async widgets a fixed min-height container.
- Prefer transforms over properties that reflow when you animate.

> A page that jumps while you read is a page that lost your trust before the first paragraph.

## INP: keep the main thread free

Interaction latency is a main-thread problem. When a tap fires and the thread is busy parsing or running a long task, the response stalls. Ship less JavaScript, break up long tasks, and defer non-critical work.

```js
// Yield so the browser can paint the response first.
button.addEventListener('click', async () => {
  applyVisualFeedback()
  await scheduler.yield?.()
  doExpensiveWork()
})
```

## Measure in the field, not just the lab

Lighthouse is a controlled lab test; your visitors are on real phones and flaky networks. Watch field data — the numbers real users generate — because that is what search engines rank and what people actually feel. A lab score of 100 that ignores a slow 4G reader is a score that lies.

## The short version

Preload the hero, reserve space for anything that loads late, and stop blocking the main thread. Three habits, applied consistently, will carry a content site to green vitals without a heroic rewrite.
