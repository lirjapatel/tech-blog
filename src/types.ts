/** Where a post was loaded from. Surfaced in the UI so the demo is honest. */
export type PostSource = 'contentful' | 'markdown'

/**
 * The single post shape the whole site renders. Both the Contentful adapter
 * and the local Markdown adapter normalise into this — no page or component
 * knows or cares which CMS is behind it.
 */
export type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt: string
  tags: string[]
  /** ISO date string. */
  publishedAt: string
  readingTime: string
  cover?: string | null
  featured: boolean
  draft: boolean
  source: PostSource
  /**
   * Pre-rendered HTML. Only set for Contentful posts, whose rich text is
   * converted at build time. Markdown posts render through `renderPost()`
   * instead so they keep Astro's syntax highlighting and heading anchors.
   */
  body?: string
}

/** A heading extracted from a post body, used to build the table of contents. */
export type PostHeading = {
  depth: number
  slug: string
  text: string
}
