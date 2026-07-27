import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'

/**
 * Absolute URLs (canonical tags, RSS, sitemap, social cards) have to match the
 * domain actually being served, and Netlify only assigns that domain after the
 * first deploy. Rather than hardcode a guess and ship wrong canonicals, take it
 * from the build environment:
 *
 *   URL              production deploy of the site
 *   DEPLOY_PRIME_URL branch deploys and pull-request previews
 *
 * Previews therefore reference themselves instead of pointing search engines at
 * production. The literal is only the local-development fallback.
 */
const site = process.env.URL || process.env.DEPLOY_PRIME_URL || 'http://localhost:4321'

export default defineConfig({
  site,
  integrations: [react(), tailwind()],
  output: 'static',
  // Emit /blog/slug/index.html so URLs work on any static host.
  build: { format: 'directory' },
  markdown: {
    // Astro already adds an `id` to every heading; this turns those into
    // permalinks so readers can deep-link to a section.
    rehypePlugins: [
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'prepend',
          properties: { class: 'heading-anchor', ariaHidden: 'true', tabIndex: -1 },
          content: { type: 'text', value: '#' },
        },
      ],
    ],
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: false,
    },
  },
})
