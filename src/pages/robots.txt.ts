import type { APIRoute } from 'astro'
import { SITE } from '../consts'

export const GET: APIRoute = () =>
  new Response(
    [
      'User-agent: *',
      'Allow: /',
      // The CMS is behind auth, but there is no reason for it to be crawled.
      'Disallow: /admin/',
      '',
      `Sitemap: ${SITE.url}/sitemap.xml`,
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  )
