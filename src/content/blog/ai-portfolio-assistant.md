---
title: Building an AI assistant recruiters actually use
excerpt: A portfolio chatbot is easy to build and easy to get wrong. Here is the architecture I landed on — grounded answers, a safe fallback, and a UI that respects the visitor.
publishedDate: 2026-06-18
tags:
  - AI
  - React
  - Product
featured: true
readingTime: 8 min read
---

Most portfolio chatbots fail the same way: they hallucinate a job history, they stall on a spinner, or they beg for an API key that the visitor will never provide. I wanted the opposite — a small assistant that answers real questions about my work, stays honest about what it does not know, and degrades gracefully when the model is unavailable.

## Start with the questions, not the model

Before writing a line of code I listed the ten questions a recruiter actually asks: *What have you shipped? Do you know React? Are you available? What is your strongest project?* That list became the assistant's job description. Everything else — model choice, streaming, styling — is downstream of answering those ten questions well.

The lesson that saved me the most time: an assistant is only as good as the context you feed it. So I wrote a compact, hand-curated context document — a few hundred words of facts about my experience — and made that the single source of truth.

## Ground every answer

The core pattern is retrieval without the ceremony. Instead of a vector database, I pass the curated context directly in the system prompt and instruct the model to answer **only** from it. If the answer is not in the context, the assistant says so.

```js
const system = [
  "You are Lirja's portfolio assistant.",
  'Answer ONLY using the CONTEXT below.',
  'If the answer is not in the context, say you are not sure',
  'and point the visitor to the contact page.',
  '',
  'CONTEXT:',
  context,
].join('\n')
```

This one instruction removes the most damaging failure mode. The model can still phrase things naturally, but it cannot invent a degree I never earned.

> An assistant that admits uncertainty earns more trust than one that is confidently wrong.

## Design for the network you do not control

Two states matter more than the happy path: **loading** and **failure**. I stream tokens so the reply feels immediate, and I wrap the request in a timeout with a scripted fallback answer so a dead API never leaves the visitor staring at a spinner.

- Optimistic UI: the user's message appears instantly, before the request resolves.
- Streaming: partial text renders as it arrives, so perceived latency drops.
- Fallback: if the model call fails, a canned summary answers the top questions anyway.

## Keep the interface calm

The widget is deliberately boring: a rounded panel, three suggested prompts, and a single input. No confetti, no avatars, no fake typing dots that outlast the response. Suggested prompts do double duty — they guide the visitor toward questions the context can actually answer, which quietly raises the hit rate.

## What I would tell past me

Ship the smallest honest version first. The curated-context approach took an afternoon and outperformed a heavier RAG setup I built later, because the corpus was tiny and the questions were predictable. Reach for embeddings when the content grows past what fits comfortably in a prompt — not before.

The finished assistant is a few components and one careful prompt. It will not pass a Turing test. It does something more useful: it answers the real questions, quickly, without lying.
