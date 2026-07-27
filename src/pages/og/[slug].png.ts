import type { APIRoute, GetStaticPaths } from 'astro'
import { getAllPosts } from '../../lib/posts'
import { renderOgImage } from '../../lib/og-image'
import type { BlogPost } from '../../types'

/** One social card per post, rendered at build time to `dist/og/<slug>.png`. */
export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getAllPosts()
  return posts.map((post) => ({ params: { slug: post.slug }, props: { post } }))
}

export const GET: APIRoute = async ({ props }) => {
  const post = props.post as BlogPost
  const png = await renderOgImage({
    title: post.title,
    tags: post.tags,
    readingTime: post.readingTime,
    publishedAt: post.publishedAt,
  })

  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
