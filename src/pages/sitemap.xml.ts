import type { APIRoute } from 'astro'
import { getAllPosts, getAllTags } from '../lib/posts'
import { SITE } from '../consts'

type Entry = { loc: string; lastmod: string; changefreq: string; priority: string }

/**
 * Hand-rolled rather than using @astrojs/sitemap so that priorities and change
 * frequencies reflect what the pages actually are — articles matter more than
 * tag listings, and the homepage changes most often.
 */
export const GET: APIRoute = async () => {
  const posts = await getAllPosts()
  const tags = await getAllTags()
  const now = new Date().toISOString()
  const newestPost = posts[0] ? new Date(posts[0].publishedAt).toISOString() : now

  const entries: Entry[] = [
    { loc: `${SITE.url}/`, lastmod: newestPost, changefreq: 'weekly', priority: '1.0' },
    { loc: `${SITE.url}/blog/`, lastmod: newestPost, changefreq: 'weekly', priority: '0.9' },
    { loc: `${SITE.url}/about/`, lastmod: now, changefreq: 'monthly', priority: '0.6' },
    { loc: `${SITE.url}/editing/`, lastmod: now, changefreq: 'monthly', priority: '0.3' },
    ...posts.map((post) => ({
      loc: `${SITE.url}/blog/${post.slug}/`,
      lastmod: new Date(post.publishedAt).toISOString(),
      changefreq: 'monthly',
      priority: '0.8',
    })),
    ...tags.map((tag) => ({
      loc: `${SITE.url}/tags/${tag.slug}/`,
      lastmod: newestPost,
      changefreq: 'weekly',
      priority: '0.5',
    })),
  ]

  const body = entries
    .map(
      (entry) => `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
    )
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
