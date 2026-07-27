---
title: 'From localhost to live: a deployment playbook for static sites'
excerpt: Shipping a static site should be a five-minute job, not a weekend. Here is the checklist I run every time — build config, environment, cache, and the webhook that keeps it fresh.
publishedDate: 2026-03-21
tags:
  - Deployment
  - Netlify
  - DevOps
readingTime: 6 min read
---

A static site is the easiest thing in the world to deploy and, somehow, still where people lose an afternoon. The trouble is never the hosting — it is the small stuff around it: an environment variable that only exists on your laptop, a cache that serves yesterday's build, a content update that never triggers a rebuild. Here is the checklist that turns deployment into a five-minute job.

## 1. Make the build reproducible

The build must run the same on a clean machine as it does on yours. Pin the Node version, commit the lockfile, and declare the build command and output directory in config the host reads automatically.

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"
```

## 2. Move secrets off your laptop

Anything in a `.env` file needs a home in the host's environment settings too. The build should degrade gracefully when a secret is missing — falling back to local content rather than crashing — so a forgotten variable is a warning, not a failed deploy.

## 3. Let the platform handle caching

Fingerprinted assets — files with a hash in the name — can be cached forever, because a change produces a new filename. HTML should be revalidated so readers always get the latest content. Most static hosts do the right thing by default; the trap is hand-rolling headers that fight them.

> If a content change does not appear live within minutes, the pipeline is broken — no matter how green the build log looks.

## 4. Close the loop with a webhook

The final piece is keeping the site fresh without touching code. Create a build hook on the host, then point your CMS at it so publishing an entry triggers a rebuild automatically.

- Generate a build hook URL in the host's deploy settings.
- Add a webhook in the CMS that fires on publish and unpublish.
- Publish a test post and watch the deploy kick off on its own.

## 5. Ship the boring extras

Before calling it done, add the small files that make a site feel finished: a sitemap and `robots.txt` for search engines, an RSS feed for readers, a custom 404, and sensible security headers. None of them are glamorous; all of them signal a site that was actually shipped, not just deployed.

## Do it once, then repeat

The reason to write the playbook down is that the second site should take five minutes, not another afternoon. Reproducible build, secrets in the environment, caching left to the platform, a webhook to stay fresh, and the boring extras in place — run the list and go live with confidence.
