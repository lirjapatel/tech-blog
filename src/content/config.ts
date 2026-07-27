import { defineCollection, z } from 'astro:content'

/**
 * Schema for the `blog` collection.
 *
 * This is the contract between content and code. Every Markdown file in
 * `src/content/blog/` is validated against it at build time — a missing
 * `title`, a malformed date, or a typo'd field name fails the build with a
 * readable error instead of shipping a broken page.
 *
 * The field names deliberately mirror the Contentful `blogPost` content type
 * (see README), so the same post shape works whichever source is active.
 */
const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(1).max(120),
    excerpt: z.string().min(1).max(300),
    publishedDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    /** Pins one post to the hero slot on the homepage. */
    featured: z.boolean().default(false),
    /** Optional override; otherwise estimated from word count. */
    readingTime: z.string().optional(),
    /** Optional path under `public/`. Falls back to generated cover art. */
    cover: z.string().optional(),
    /** Hidden from listings, RSS and the sitemap, but still builds. */
    draft: z.boolean().default(false),
  }),
})

export const collections = { blog }
