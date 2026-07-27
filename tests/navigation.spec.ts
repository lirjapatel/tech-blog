import { expect, test } from '@playwright/test'

test.describe('Navigation and core pages', () => {
  test('homepage renders the hero, featured post and topic list', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Building calm')
    await expect(page.getByText('Featured')).toBeVisible()

    // The topic list is built from real tags, so it must never be empty.
    const topics = page.locator('#topics a[href^="/tags/"]')
    expect(await topics.count()).toBeGreaterThan(3)
  })

  test('a reader can go from the homepage to an article and back', async ({ page }) => {
    await page.goto('/')

    const firstCard = page.locator('#writing article a[href^="/blog/"]').first()
    const title = (await firstCard.textContent())?.trim() ?? ''
    await firstCard.click()

    await expect(page).toHaveURL(/\/blog\/.+/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)

    await page.getByRole('link', { name: 'All writing' }).click()
    await expect(page).toHaveURL(/\/blog\/?$/)
  })

  test('the archive lists every published post, grouped by year', async ({ page }) => {
    await page.goto('/blog')

    const cards = page.locator('article')
    expect(await cards.count()).toBeGreaterThanOrEqual(6)

    // Year headings act as the grouping structure.
    await expect(page.getByRole('heading', { name: /^20\d\d$/ }).first()).toBeVisible()
  })

  test('tag pages only list posts carrying that tag', async ({ page }) => {
    await page.goto('/tags/react/')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('React')

    const cards = page.locator('article')
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)

    for (let index = 0; index < count; index++) {
      await expect(cards.nth(index).getByText('React', { exact: true })).toBeVisible()
    }
  })

  test('unknown URLs render the custom 404 page', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist')

    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Lost in the archives')
    await expect(page.getByRole('link', { name: 'Back to home' })).toBeVisible()
  })

  test('the current section is marked in the navigation', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop navigation is collapsed into a drawer on mobile.')

    await page.goto('/about')
    await expect(page.locator('nav[aria-label="Main"] a[aria-current="page"]')).toHaveText('About')
  })
})

test.describe('Mobile navigation', () => {
  test('the drawer opens and links through to a page', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'The drawer only exists at mobile widths.')

    await page.goto('/')

    const drawer = page.locator('#mobile-nav')
    await expect(drawer).not.toBeVisible()

    await page.getByRole('button', { name: 'Open menu' }).click()
    await expect(drawer).toBeVisible()

    await drawer.getByRole('link', { name: 'About' }).click()
    await expect(page).toHaveURL(/\/about\/?$/)
  })
})
