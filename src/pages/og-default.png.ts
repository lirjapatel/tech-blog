import type { APIRoute } from 'astro'
import { SITE } from '../consts'
import { renderOgImage } from '../lib/og-image'

/** The fallback social card used by the homepage and any non-article page. */
export const GET: APIRoute = async () => {
  const png = await renderOgImage({
    title: SITE.tagline,
    tags: ['Frontend'],
    eyebrow: SITE.role,
  })

  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
