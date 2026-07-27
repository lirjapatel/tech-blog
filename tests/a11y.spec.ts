import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

/**
 * Automated accessibility checks.
 *
 * axe-core catches roughly a third of real accessibility problems, so this is a
 * floor rather than a certificate. The keyboard-interaction tests below cover
 * things a scanner cannot see.
 */

const PAGES = [
  { name: 'homepage', path: '/' },
  { name: 'archive', path: '/blog' },
  { name: 'article', path: '/blog/astro-react-islands/' },
  { name: 'tag listing', path: '/tags/react/' },
  { name: 'about', path: '/about' },
  { name: "editor's guide", path: '/editing' },
  { name: '404', path: '/definitely-not-a-page' },
]

// A full axe pass takes several seconds per page; content-heavy pages running
// alongside other workers can exceed the default 30s budget.
test.describe.configure({ timeout: 90_000 })

const scan = (page: import('@playwright/test').Page) =>
  new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()

/**
 * Scans run with reduced motion requested. Elements fade in from `opacity: 0`,
 * and a scanner that samples mid-animation reports contrast failures for text
 * that is perfectly legible once settled. Asking for reduced motion pins every
 * element at its final state — and doubles as a check that our reduced-motion
 * support actually leaves content visible rather than stuck invisible.
 */
for (const { name, path } of PAGES) {
  test(`${name} has no detectable accessibility violations`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(path)
    const results = await scan(page)
    expect(results.violations).toEqual([])
  })

  test(`${name} passes in dark mode too`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
    await page.goto(path)
    // The theme is applied by an inline script before paint.
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'blogdark')

    const results = await scan(page)
    expect(results.violations).toEqual([])
  })
}

test('the open search dialog is accessible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('button', { name: 'Search articles' }).click()
  await expect(page.getByRole('dialog', { name: 'Search articles' })).toBeVisible()
  await page.getByRole('combobox', { name: 'Search articles' }).fill('astro')
  await expect(page.getByRole('option').first()).toBeVisible()

  const results = await scan(page)
  expect(results.violations).toEqual([])
})

test.describe('Keyboard access', () => {
  test('the skip link is the first stop and jumps to the main content', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Skip links serve keyboard users on desktop.')

    await page.goto('/')
    await page.keyboard.press('Tab')

    const skipLink = page.getByRole('link', { name: 'Skip to content' })
    await expect(skipLink).toBeFocused()
    await expect(skipLink).toBeInViewport()

    await page.keyboard.press('Enter')
    await expect(page.locator('#main')).toBeFocused()
  })

  test('the theme toggle works and survives a page navigation', async ({ page }) => {
    await page.goto('/')
    const html = page.locator('html')
    await expect(html).toHaveAttribute('data-theme', 'blog')

    await page.getByRole('button', { name: 'Toggle dark mode' }).click()
    await expect(html).toHaveAttribute('data-theme', 'blogdark')

    await page.goto('/about')
    await expect(html).toHaveAttribute('data-theme', 'blogdark')
  })

  test('every image either has alt text or is explicitly decorative', async ({ page }) => {
    await page.goto('/blog/astro-react-islands/')

    const images = page.locator('img')
    const count = await images.count()

    for (let index = 0; index < count; index++) {
      const image = images.nth(index)
      const alt = await image.getAttribute('alt')
      const hidden = await image.getAttribute('aria-hidden')
      expect(alt !== null || hidden === 'true').toBe(true)
    }
  })

  test('headings on an article descend without skipping a level', async ({ page }) => {
    await page.goto('/blog/core-web-vitals-playbook/')

    const levels = await page
      .locator('h1, h2, h3, h4')
      .evaluateAll((nodes) => nodes.map((node) => Number(node.tagName[1])))

    expect(levels[0]).toBe(1)
    for (let index = 1; index < levels.length; index++) {
      expect(levels[index] - levels[index - 1]).toBeLessThanOrEqual(1)
    }
  })
})
