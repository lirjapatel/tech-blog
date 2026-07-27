import type { APIRoute } from 'astro'

// `site` is resolved in astro.config.mjs from the deploy environment, so this
// points at whichever domain is actually being served.
export const GET: APIRoute = ({ site }) =>
  new Response(
    [
      'User-agent: *',
      'Allow: /',
      // The CMS is behind auth, but there is no reason for it to be crawled.
      'Disallow: /admin/',
      '',
      `Sitemap: ${new URL('/sitemap.xml', site).href}`,
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  )
