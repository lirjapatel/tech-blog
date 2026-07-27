import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'

export default defineConfig({
  // Keep in sync with SITE.url in src/consts.ts — both build absolute URLs
  // for canonical tags, RSS, the sitemap, and social card metadata.
  site: 'https://lirja-tech-blog.netlify.app',
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
