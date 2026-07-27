import { getCollection, type CollectionEntry } from 'astro:content'
import type { BlogPost, PostHeading } from '../types'
import * as contentful from './contentful'
import { estimateReadingTime, markdownToPlainText } from './reading-time'

/**
 * The content adapter.
 *
 * Every page in this site asks *this* module for posts — never Contentful, and
 * never the Markdown collection, directly. That indirection is what lets the
 * CMS behind the site change without touching a single template:
 *
 *   1. If `CONTENTFUL_SPACE_ID` + `CONTENTFUL_ACCESS_TOKEN` are set, posts come
 *      from Contentful.
 *   2. Otherwise they come from Markdown in `src/content/blog/`, which is what
 *      the `/admin` editor writes to.
 *
 * Both sources normalise to the same `BlogPost` shape, so swapping between them
 * is a config change, not a refactor.
 */

/** Keeps Markdown entries addressable by slug so we can render them later. */
const entriesBySlug = new Map<string, CollectionEntry<'blog'>>()

let cachedPosts: BlogPost[] | null = null

const fromMarkdown = (entry: CollectionEntry<'blog'>): BlogPost => {
  const plain = markdownToPlainText(entry.body)
  return {
    id: entry.id,
    title: entry.data.title,
    slug: entry.slug,
    excerpt: entry.data.excerpt,
    tags: entry.data.tags,
    publishedAt: entry.data.publishedDate.toISOString(),
    readingTime: entry.data.readingTime ?? estimateReadingTime(plain),
    cover: entry.data.cover ?? null,
    featured: entry.data.featured,
    draft: entry.data.draft,
    source: 'markdown',
  }
}

const byNewestFirst = (a: BlogPost, b: BlogPost) =>
  new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()

/** All published posts, newest first. Cached for the lifetime of the build. */
export const getAllPosts = async (): Promise<BlogPost[]> => {
  if (cachedPosts) return cachedPosts

  const fromCms = await contentful.getPosts()

  if (fromCms) {
    cachedPosts = fromCms.filter((post) => !post.draft).sort(byNewestFirst)
    return cachedPosts
  }

  // Drafts stay visible while running `astro dev` so writers can preview them,
  // but never make it into a production build.
  const entries = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft)

  entriesBySlug.clear()
  for (const entry of entries) entriesBySlug.set(entry.slug, entry)

  cachedPosts = entries.map(fromMarkdown).sort(byNewestFirst)
  return cachedPosts
}

export const getPostBySlug = async (slug: string): Promise<BlogPost | null> => {
  const posts = await getAllPosts()
  return posts.find((post) => post.slug === slug) ?? null
}

/** Which source is actually in use, for the "Content source" badge in the footer. */
export const getContentSource = async () => {
  const posts = await getAllPosts()
  return posts[0]?.source ?? 'markdown'
}

/**
 * Resolves a post's body into something renderable.
 *
 * Markdown posts return an Astro `Content` component (keeping Shiki syntax
 * highlighting and auto-generated heading anchors); Contentful posts return
 * pre-rendered HTML. The article page handles both.
 */
export const renderPost = async (
  post: BlogPost,
): Promise<{ Content: any | null; html: string | null; headings: PostHeading[] }> => {
  if (post.source === 'contentful') {
    return { Content: null, html: post.body ?? '', headings: headingsFromHtml(post.body ?? '') }
  }

  // `getAllPosts()` populates the map; call it in case a page rendered out of order.
  if (!entriesBySlug.has(post.slug)) await getAllPosts()
  const entry = entriesBySlug.get(post.slug)
  if (!entry) return { Content: null, html: '', headings: [] }

  const { Content, headings } = await entry.render()
  return {
    Content,
    html: null,
    headings: headings.filter((h) => h.depth === 2 || h.depth === 3),
  }
}

/** Extracts h2/h3 anchors from Contentful's rendered HTML for the table of contents. */
const headingsFromHtml = (html: string): PostHeading[] => {
  const headings: PostHeading[] = []
  const pattern = /<h([23])[^>]*>(.*?)<\/h\1>/gi
  let match: RegExpExecArray | null
  while ((match = pattern.exec(html))) {
    const text = match[2].replace(/<[^>]*>/g, '').trim()
    headings.push({ depth: Number(match[1]), slug: slugify(text), text })
  }
  return headings
}

export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')

/** Every tag in use, with its post count, most-used first. */
export const getAllTags = async (): Promise<{ tag: string; slug: string; count: number }[]> => {
  const posts = await getAllPosts()
  const counts = new Map<string, number>()
  for (const post of posts) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, slug: slugify(tag), count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}

export const getPostsByTag = async (tagSlug: string): Promise<BlogPost[]> => {
  const posts = await getAllPosts()
  return posts.filter((post) => post.tags.some((tag) => slugify(tag) === tagSlug))
}

/** Posts sharing at least one tag, ranked by how many tags they share. */
export const getRelatedPosts = async (post: BlogPost, limit = 3): Promise<BlogPost[]> => {
  const posts = await getAllPosts()
  return posts
    .filter((candidate) => candidate.id !== post.id)
    .map((candidate) => ({
      candidate,
      overlap: candidate.tags.filter((tag) => post.tags.includes(tag)).length,
    }))
    .filter((entry) => entry.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, limit)
    .map((entry) => entry.candidate)
}

/** The previous/next post in publication order, for article footer navigation. */
export const getAdjacentPosts = async (post: BlogPost) => {
  const posts = await getAllPosts()
  const index = posts.findIndex((candidate) => candidate.id === post.id)
  return {
    newer: index > 0 ? posts[index - 1] : null,
    older: index >= 0 && index < posts.length - 1 ? posts[index + 1] : null,
  }
}

/**
 * A compact index shipped to the browser for client-side search.
 * Body text is truncated so the payload stays small — full articles would
 * balloon the index for no ranking benefit.
 */
export const getSearchIndex = async () => {
  const posts = await getAllPosts()
  await getAllPosts() // ensures `entriesBySlug` is populated for Markdown sources

  return posts.map((post) => {
    const entry = entriesBySlug.get(post.slug)
    const text = entry
      ? markdownToPlainText(entry.body)
      : (post.body ?? '').replace(/<[^>]*>/g, ' ')

    return {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      tags: post.tags,
      readingTime: post.readingTime,
      publishedAt: post.publishedAt,
      text: text.slice(0, 1200),
    }
  })
}
