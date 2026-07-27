---
title: Designing a threat dashboard that stays fast under real data
excerpt: Security data is loud, spiky, and never stops arriving. A dashboard that feels calm at 10 rows and dies at 10,000 is a prototype, not a product.
publishedDate: 2026-05-29
tags:
  - Security
  - Data Viz
  - React
readingTime: 7 min read
---

The demo always looks great. Twenty tidy alerts, a clean chart, everything green. Then real telemetry shows up — thousands of events an hour, half of them noise — and the interface that felt calm starts to stutter. Designing a threat dashboard is mostly the work of staying fast and legible when the data refuses to cooperate.

## Lead with the decision, not the data

Analysts do not open a dashboard to admire it; they open it to answer one question: *what needs my attention right now?* So the top of the screen is a small row of severity counts and a trend line, sized to be read from across a room. Everything below is progressive detail for when they decide to dig.

- Severity stats first, because they drive the next click.
- A trend line second, because direction matters more than any single number.
- The table last, because it is where investigation happens, not where it begins.

## Virtualize the table before you need to

The single biggest performance win is rendering only the rows in view. A naive table paints every DOM node; a virtualized one paints a couple dozen and swaps them as you scroll. The difference between 12,000 nodes and 30 is the difference between a frozen tab and a smooth one.

```js
// Only rows intersecting the viewport are mounted.
const virtual = useVirtualizer({
  count: rows.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 44,
  overscan: 8,
})
```

Pair virtualization with stable keys and memoized row components, and the table stays responsive whether it holds 50 rows or 50,000.

## Filters belong next to the data

When filters live in a distant sidebar, analysts lose the thread between what they changed and what moved. Keeping them directly above the table — severity, source, time window — turns filtering into a tight feedback loop instead of a context switch.

> Every pixel of chrome competes with the data for attention. Spend it deliberately.

## Detail without navigation

Clicking an alert should not throw the analyst onto a new page and erase their place. A slide-over detail panel keeps the list visible, so they can triage a dozen events without ever losing context. Back-and-forth navigation is where investigations go to die.

## Color is a signal, not decoration

Severity is the only thing allowed to use saturated color. Everything else stays quiet — muted borders, generous whitespace — so a red critical badge reads instantly. I also test the palette in a color-blind simulator; a dashboard that encodes urgency only in hue fails the people who need it most.

## The result

A layout that scales from a laptop to a wide operations screen, holds tens of thousands of events without dropping frames, and puts the one number that matters where the eye lands first. Fast is a feature — especially when the stakes are security.
