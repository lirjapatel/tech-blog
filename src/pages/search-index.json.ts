import type { APIRoute } from 'astro'
import { getSearchIndex } from '../lib/posts'

/**
 * The search corpus, emitted as a static JSON file at build time.
 *
 * Kept out of the page HTML on purpose: the search island fetches this only
 * when a reader actually opens the dialog.
 */
export const GET: APIRoute = async () => {
  const index = await getSearchIndex()

  return new Response(JSON.stringify(index), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  })
}
