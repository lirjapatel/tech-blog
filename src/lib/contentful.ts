import { documentToHtmlString } from '@contentful/rich-text-html-renderer'
import contentful from 'contentful'
import { mockPosts } from '../data/mockPosts'
import type { BlogPost } from '../types'

const { createClient } = contentful

const space = import.meta.env.CONTENTFUL_SPACE_ID
const accessToken = import.meta.env.CONTENTFUL_ACCESS_TOKEN
const environment = import.meta.env.CONTENTFUL_ENVIRONMENT || 'master'

const client = space && accessToken
  ? createClient({
      space,
      accessToken,
      environment,
    })
  : null

const estimateReadingTime = (html: string) => {
  const words = html
    .replace(/<[^>]*>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  const minutes = Math.max(1, Math.round(words.length / 220))
  return `${minutes} min read`
}

const mapEntry = (entry: any): BlogPost => {
  const fields = entry.fields || {}
  const body = fields.body
    ? documentToHtmlString(fields.body)
    : `<p>${fields.excerpt || ''}</p>`
  const slug = fields.slug || fields.title?.toLowerCase().replace(/\s+/g, '-')
  const coverUrl = fields.coverImage?.fields?.file?.url
  const publishedAt = fields.publishedDate || new Date().toISOString()

  return {
    id: entry.sys?.id || slug,
    title: fields.title || 'Untitled',
    slug,
    excerpt: fields.excerpt || '',
    body,
    tags: fields.tags || [],
    publishedAt,
    readingTime: fields.readingTime || estimateReadingTime(body),
    cover: coverUrl ? `https:${coverUrl}` : null,
  }
}

export const getAllPosts = async (): Promise<BlogPost[]> => {
  if (!client) {
    return mockPosts
  }

  try {
    const entries = await client.getEntries({
      content_type: 'blogPost',
      order: '-fields.publishedDate',
    })

    return entries.items.map(mapEntry)
  } catch (error) {
    return mockPosts
  }
}

export const getPostBySlug = async (slug: string): Promise<BlogPost | null> => {
  if (!client) {
    return mockPosts.find((post) => post.slug === slug) || null
  }

  try {
    const entries = await client.getEntries({
      content_type: 'blogPost',
      'fields.slug': slug,
      limit: 1,
    })

    const entry = entries.items[0]
    return entry ? mapEntry(entry) : null
  } catch (error) {
    return mockPosts.find((post) => post.slug === slug) || null
  }
}
