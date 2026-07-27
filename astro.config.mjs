import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'

export default defineConfig({
  // Keep in sync with SITE.url in src/consts.ts
  site: 'https://lirja-tech-blog.netlify.app',
  integrations: [react(), tailwind()],
  output: 'static',
})
