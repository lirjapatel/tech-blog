import { expect, test } from '@playwright/test'

/**
 * The search island is the most stateful thing on the site, so it gets the
 * closest attention: keyboard shortcut, filtering, keyboard navigation, the
 * empty state, and the failure path when the index cannot be fetched.
 */
test.describe('Search', () => {
  test('opens with the ⌘K / Ctrl+K shortcut and closes with Escape', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Keyboard shortcuts are a desktop affordance.')

    await page.goto('/')
    const dialog = page.getByRole('dialog', { name: 'Search articles' })
    await expect(dialog).not.toBeVisible()

    await page.keyboard.press('ControlOrMeta+k')
    await expect(dialog).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Search articles' })).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
  })

  test('opens from the header button and filters as you type', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: 'Search articles' }).click()
    const dialog = page.getByRole('dialog', { name: 'Search articles' })
    await expect(dialog).toBeVisible()

    await page.getByRole('combobox', { name: 'Search articles' }).fill('astro')

    const results = dialog.getByRole('option')
    await expect(results.first()).toBeVisible()
    await expect(results.first()).toContainText(/astro/i)
  })

  test('every term must match, so unrelated words return nothing', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Search articles' }).click()

    await page.getByRole('combobox', { name: 'Search articles' }).fill('zzzznotathing')

    await expect(page.getByText(/No articles match/)).toBeVisible()
  })

  test('arrow keys move the selection and Enter opens the article', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Keyboard navigation is a desktop affordance.')

    await page.goto('/')
    await page.getByRole('button', { name: 'Search articles' }).click()

    const input = page.getByRole('combobox', { name: 'Search articles' })
    await input.fill('performance')

    const dialog = page.getByRole('dialog', { name: 'Search articles' })
    await expect(dialog.getByRole('option').first()).toHaveAttribute('aria-selected', 'true')

    await page.keyboard.press('ArrowDown')
    await expect(dialog.getByRole('option').nth(1)).toHaveAttribute('aria-selected', 'true')

    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/blog\/.+/)
  })

  test('the index is only fetched once the dialog opens', async ({ page }) => {
    const requests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('search-index.json')) requests.push(request.url())
    })

    await page.goto('/')
    // Give the idle-hydrated island time to settle before asserting.
    await page.waitForTimeout(1000)
    expect(requests).toHaveLength(0)

    await page.getByRole('button', { name: 'Search articles' }).click()
    await expect(page.getByRole('dialog', { name: 'Search articles' })).toBeVisible()
    await expect.poll(() => requests.length).toBe(1)
  })

  test('a failed index fetch shows an error instead of hanging', async ({ page }) => {
    await page.route('**/search-index.json', (route) => route.fulfill({ status: 500, body: '' }))

    await page.goto('/')
    await page.getByRole('button', { name: 'Search articles' }).click()

    await expect(page.getByText(/Search index failed to load/)).toBeVisible()
  })
})
