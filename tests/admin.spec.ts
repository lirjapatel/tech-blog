import { expect, test } from '@playwright/test'

/**
 * /admin decides at runtime whether it can host a working editor.
 *
 * On localhost the CMS backend is reachable, so Decap is booted. On the
 * deployed site there is no login — git-gateway needs Netlify Identity, which
 * is not on the free tier — so the page explains that instead of loading a 5 MB
 * bundle it cannot use.
 *
 * Playwright serves from localhost, so the local branch is what runs here. The
 * deployed branch is asserted by driving the same switch directly.
 */

test.describe('Content editor shell', () => {
  test('on localhost it boots the CMS rather than the explainer', async ({ page }) => {
    await page.goto('/admin/')

    // Decap is injected, not hardcoded, so assert the tag actually arrives.
    await expect(page.locator('script[src="/admin/decap-cms.js"]')).toBeAttached()
    await expect(page.locator('#cms-unavailable')).toBeHidden()
    await expect(page.locator('#nc-root')).toBeVisible()
  })

  test('the shipped markup nests the loading state inside #nc-root', async ({ request }) => {
    // Asserted against the served HTML, not the live DOM: once Decap mounts it
    // replaces the contents of #nc-root, so the loading state is *supposed* to
    // be gone by the time the page settles. That clearing is the whole point —
    // outside #nc-root nothing removed it, and at 100vh it covered the booted
    // editor, which read as the CMS hanging.
    const html = await (await request.get('/admin/')).text()

    expect(html).toMatch(/<div id="nc-root">\s*<div id="cms-loading">/)
  })

  test('off localhost it explains itself and skips the bundle', async ({ page, request }) => {
    // Serve the real admin page under a non-localhost hostname so the page's own
    // check sees a deployed origin. Everything is fulfilled from the local
    // build, so no external request is made.
    const html = await (await request.get('/admin/')).text()

    await page.route('https://lirja-tech-blog.netlify.app/**', (route) =>
      route.fulfill({ contentType: 'text/html', body: html }),
    )

    await page.goto('https://lirja-tech-blog.netlify.app/admin/')

    await expect(page.locator('#cms-unavailable')).toBeVisible()
    await expect(page.locator('#nc-root')).toBeHidden()
    await expect(page.locator('script[src="/admin/decap-cms.js"]')).toHaveCount(0)

    // A dead end is only acceptable if it routes the reader somewhere useful.
    await expect(page.getByRole('link', { name: /editor's guide/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /back to the site/i })).toBeVisible()
  })

  test('the editor is kept out of search results', async ({ page, request }) => {
    await page.goto('/admin/')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /noindex/,
    )

    const robots = await (await request.get('/robots.txt')).text()
    expect(robots).toContain('Disallow: /admin/')
  })
})
