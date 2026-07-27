import { documentToHtmlString } from '@contentful/rich-text-html-renderer'
import contentful from 'contentful'
import type { BlogPost } from '../types'
import { estimateReadingTime } from './reading-time'

const { createClient } = contentful

const space = import.meta.env.CONTENTFUL_SPACE_ID
const accessToken = import.meta.env.CONTENTFUL_ACCESS_TOKEN
const environment = import.meta.env.CONTENTFUL_ENVIRONMENT || 'master'

/**
 * Only created when both credentials are present. A missing token is a
 * supported state, not an error — `getPosts()` returns null and the caller
 * falls back to Markdown. See `src/lib/posts.ts`.
 */
const client =
  space && accessToken ? createClient({ space, accessToken, environment }) : null

export const isConfigured = client !== null

const mapEntry = (entry: any): BlogPost => {
  const fields = entry.fields ?? {}
  const body = fields.body
    ? documentToHtmlString(fields.body)
    : `<p>${fields.excerpt ?? ''}</p>`
  const slug: string =
    fields.slug || String(fields.title ?? 'untitled').toLowerCase().replace(/\s+/g, '-')
  const coverUrl = fields.coverImage?.fields?.file?.url

  return {
    id: entry.sys?.id ?? slug,
    title: fields.title ?? 'Untitled',
    slug,
    excerpt: fields.excerpt ?? '',
    body,
    tags: fields.tags ?? [],
    publishedAt: fields.publishedDate ?? entry.sys?.createdAt ?? new Date().toISOString(),
    readingTime: fields.readingTime || estimateReadingTime(body.replace(/<[^>]*>/g, ' ')),
    cover: coverUrl ? `https:${coverUrl}` : null,
    featured: Boolean(fields.featured),
    draft: false,
    source: 'contentful',
  }
}

/**
 * Fetches every published `blogPost` entry.
 *
 * Returns `null` — rather than throwing or returning `[]` — when Contentful is
 * unconfigured or unreachable, so the caller can tell "no CMS" apart from
 * "CMS with no posts" and fall back deliberately.
 */
export const getPosts = async (): Promise<BlogPost[] | null> => {
  if (!client) return null

  try {
    const entries = await client.getEntries({
      content_type: 'blogPost',
      order: ['-fields.publishedDate'] as any,
      limit: 200,
    })
    return entries.items.map(mapEntry)
  } catch (error) {
    console.warn(
      '[contentful] Fetch failed, falling back to Markdown content:',
      error instanceof Error ? error.message : error,
    )
    return null
  }
}
