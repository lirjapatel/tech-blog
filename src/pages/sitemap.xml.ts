import type { APIRoute } from 'astro'
import { getAllPosts } from '../lib/contentful'
import { SITE } from '../consts'

export const GET: APIRoute = async () => {
  const posts = await getAllPosts()

  const urls = [
    { loc: `${SITE.url}/`, lastmod: new Date().toISOString() },
    ...posts.map((post) => ({
      loc: `${SITE.url}/blog/${post.slug}/`,
      lastmod: new Date(post.publishedAt).toISOString(),
    })),
  ]

  const body = urls
    .map(
      (entry) => `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
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
