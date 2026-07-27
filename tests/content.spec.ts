import { expect, test } from '@playwright/test'

/**
 * Guards the content pipeline: the CMS-shaped data, the generated feeds, and
 * the metadata that marketing and SEO depend on. These are the things most
 * likely to break silently — nobody notices a malformed RSS feed by looking at
 * the site.
 */

test.describe('Article rendering', () => {
  test('an article renders body, metadata, tags and a table of contents', async ({ page }) => {
    await page.goto('/blog/astro-react-islands/')

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Astro islands')
    await expect(page.locator('article time').first()).toHaveAttribute(
      'datetime',
      /^\d{4}-\d{2}-\d{2}/,
    )
    await expect(page.getByText(/min read/).first()).toBeVisible()

    // Markdown made it through the pipeline with syntax highlighting intact.
    await expect(page.locator('.article-content pre').first()).toBeVisible()
    await expect(page.locator('.article-content h2').first()).toBeVisible()
  })

  test('published dates are formatted in UTC, not the build machine timezone', async ({ page }) => {
    // This post is dated 2026-05-12 in frontmatter. Formatting in local time on
    // a machine behind UTC would render 11 May — a real bug this guards against.
    await page.goto('/blog/astro-react-islands/')
    await expect(page.locator('article time').first()).toHaveText('May 12, 2026')
  })

  test('the table of contents links to real sections', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The table of contents is desktop-only.')

    await page.goto('/blog/core-web-vitals-playbook/')

    const links = page.locator('.toc a')
    const count = await links.count()
    expect(count).toBeGreaterThan(1)

    for (let index = 0; index < count; index++) {
      const hash = await links.nth(index).getAttribute('href')
      expect(hash).toBeTruthy()
      await expect(page.locator(hash!)).toHaveCount(1)
    }
  })

  test('related posts share at least one tag with the article', async ({ page }) => {
    await page.goto('/blog/astro-react-islands/')

    const related = page.locator('section:has(#related-heading) article')
    const count = await related.count()
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThanOrEqual(3)
  })

  test('copying the article link reports success', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Clipboard permissions are Chromium-specific here.')

    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/blog/astro-react-islands/')

    await page.getByRole('button', { name: /Copy link/ }).click()
    await expect(page.getByText('Link copied to clipboard')).toBeVisible()
  })
})

test.describe('Feeds and metadata', () => {
  test('the RSS feed is well-formed and lists every post', async ({ request }) => {
    const response = await request.get('/rss.xml')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('xml')

    const body = await response.text()
    expect(body).toContain('<rss version="2.0"')
    expect(body.match(/<item>/g)?.length ?? 0).toBeGreaterThanOrEqual(6)
    // Unescaped ampersands are the classic way to produce an invalid feed.
    expect(body).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;|#)/)
  })

  test('the sitemap lists articles, tags and key pages', async ({ request }) => {
    const body = await (await request.get('/sitemap.xml')).text()

    expect(body).toContain('<urlset')
    expect(body).toContain('/blog/astro-react-islands/')
    expect(body).toContain('/tags/react/')
    expect(body).toContain('/editing/')
  })

  test('robots.txt points at the sitemap and hides the CMS', async ({ request }) => {
    const body = await (await request.get('/robots.txt')).text()

    expect(body).toContain('Sitemap:')
    expect(body).toContain('Disallow: /admin/')
  })

  test('the search index is valid JSON with the expected shape', async ({ request }) => {
    const index = await (await request.get('/search-index.json')).json()

    expect(Array.isArray(index)).toBe(true)
    expect(index.length).toBeGreaterThanOrEqual(6)

    for (const entry of index) {
      expect(entry).toHaveProperty('title')
      expect(entry).toHaveProperty('slug')
      expect(entry).toHaveProperty('excerpt')
      expect(Array.isArray(entry.tags)).toBe(true)
      // Bodies are truncated to keep the payload small.
      expect(entry.text.length).toBeLessThanOrEqual(1200)
    }
  })

  test('each article ships canonical, Open Graph and structured data', async ({ page }) => {
    await page.goto('/blog/astro-react-islands/')

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/blog\/astro-react-islands\/$/,
    )
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article')
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /\/og\/astro-react-islands\.png$/,
    )

    const jsonLd = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}',
    )
    const types = jsonLd['@graph'].map((node: { '@type': string }) => node['@type'])
    expect(types).toContain('BlogPosting')
    expect(types).toContain('BreadcrumbList')
  })

  test('every post has a generated social card', async ({ request }) => {
    const index = await (await request.get('/search-index.json')).json()

    for (const post of index) {
      const response = await request.get(`/og/${post.slug}.png`)
      expect(response.status(), `missing OG image for ${post.slug}`).toBe(200)
      expect(response.headers()['content-type']).toBe('image/png')
    }
  })
})

test.describe('Performance budget', () => {
  test('the homepage ships almost no JavaScript', async ({ page }) => {
    let scriptBytes = 0

    page.on('response', async (response) => {
      const type = response.headers()['content-type'] ?? ''
      if (!type.includes('javascript')) return
      try {
        scriptBytes += (await response.body()).length
      } catch {
        // Response body may be unavailable for redirects; ignore.
      }
    })

    await page.goto('/', { waitUntil: 'networkidle' })

    // The React runtime plus two small islands (search + newsletter) lands
    // around 147 KB uncompressed. The headroom here is deliberate but tight:
    // importing Preline's default entry point site-wide once added 297 KB to
    // every page, and this budget is what caught it.
    expect(scriptBytes).toBeLessThan(175 * 1024)
  })

  test('component-library JavaScript is scoped to the page that needs it', async ({ page }) => {
    const scriptsOn = async (path: string) => {
      const urls: string[] = []
      page.on('request', (request) => {
        if (request.resourceType() === 'script') urls.push(request.url())
      })
      await page.goto(path, { waitUntil: 'networkidle' })
      const bytes = await Promise.all(
        urls.map(async (url) => (await page.request.get(url)).body().then((b) => b.length)),
      )
      page.removeAllListeners('request')
      return bytes.reduce((total, size) => total + size, 0)
    }

    // Preline only powers the FAQ accordion on the editor guide, so the
    // homepage must not pay for it.
    const homepageBytes = await scriptsOn('/')
    const guideBytes = await scriptsOn('/editing')

    expect(guideBytes).toBeGreaterThan(homepageBytes)
    expect(guideBytes - homepageBytes).toBeLessThan(40 * 1024)
  })

  test('the CMS bundle is not loaded by public pages', async ({ page }) => {
    const requests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('decap')) requests.push(request.url())
    })

    await page.goto('/', { waitUntil: 'networkidle' })
    expect(requests).toEqual([])
  })
})
