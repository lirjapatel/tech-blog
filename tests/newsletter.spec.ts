import { expect, test } from '@playwright/test'

/**
 * The signup island posts to Netlify Forms. Netlify only exists in production,
 * so these tests fulfil the POST themselves and assert on how the island reacts
 * to each outcome — including the one the local preview server really produces.
 */

const newsletter = (page: import('@playwright/test').Page) =>
  page.locator('form').filter({ has: page.getByRole('button', { name: 'Subscribe' }) })

const gotoSignup = async (page: import('@playwright/test').Page) => {
  await page.goto('/')
  const subscribe = page.getByRole('button', { name: 'Subscribe' })

  // client:visible ships the island as plain HTML first, so the field and the
  // button are both interactive *before* React takes over. Typing into that
  // pre-hydration DOM is lost the moment React mounts and reasserts its own
  // (empty) state — the click then reads a blank email and reports it invalid.
  // Astro drops the `ssr` marker once an island has hydrated; wait for that.
  await subscribe.scrollIntoViewIfNeeded()
  await page.waitForFunction(() => {
    const island = Array.from(document.querySelectorAll('astro-island')).find((el) =>
      el.textContent?.includes('Subscribe'),
    )
    return !!island && !island.hasAttribute('ssr')
  })
  await expect(subscribe).toBeEnabled()
}

test.describe('Newsletter signup', () => {
  test('the static form Netlify registers at build time is in the HTML', async ({ request }) => {
    // Without this hidden twin, Netlify never registers the form and every
    // real submission 404s. It cannot come from the React island, because the
    // build step only sees server-rendered HTML.
    const html = await (await request.get('/')).text()

    expect(html).toContain('data-netlify="true"')
    expect(html).toContain('name="newsletter"')
    expect(html).toContain('data-netlify-honeypot="bot-field"')
  })

  test('an invalid address is rejected before any network request', async ({ page }) => {
    await gotoSignup(page)

    let posted = false
    await page.route('/', async (route) => {
      if (route.request().method() === 'POST') posted = true
      await route.continue()
    })

    await newsletter(page).getByLabel('Email address').fill('not-an-email')
    await page.getByRole('button', { name: 'Subscribe' }).click()

    await expect(page.getByText('Please enter a valid email address.')).toBeVisible()
    expect(posted, 'invalid input should not hit the network').toBe(false)
  })

  test('a successful submission confirms and clears the field', async ({ page }) => {
    await gotoSignup(page)

    await page.route('/', async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postData() ?? ''
        // Netlify matches submissions to forms by this field.
        expect(body).toContain('form-name=newsletter')
        expect(body).toContain('reader%40example.com')
        await route.fulfill({ status: 200, body: 'ok' })
        return
      }
      await route.continue()
    })

    await newsletter(page).getByLabel('Email address').fill('reader@example.com')
    await page.getByRole('button', { name: 'Subscribe' }).click()

    await expect(page.getByText("You're on the list.")).toBeVisible()
  })

  test('a server error is surfaced rather than swallowed', async ({ page }) => {
    await gotoSignup(page)

    await page.route('/', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 500, body: 'boom' })
        return
      }
      await route.continue()
    })

    await newsletter(page).getByLabel('Email address').fill('reader@example.com')
    await page.getByRole('button', { name: 'Subscribe' }).click()

    await expect(page.getByText(/Something went wrong/)).toBeVisible()
    await expect(page.getByText("You're on the list.")).toBeHidden()
  })

  test('the local preview says so instead of faking success', async ({ page }) => {
    await gotoSignup(page)

    // 404 is what `astro preview` actually returns for a POST — the honest
    // local-development case, which must not look like either success or a bug.
    await page.route('/', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 404, body: 'not found' })
        return
      }
      await route.continue()
    })

    await newsletter(page).getByLabel('Email address').fill('reader@example.com')
    await page.getByRole('button', { name: 'Subscribe' }).click()

    await expect(page.getByText(/only exists on the deployed site/)).toBeVisible()
    await expect(page.getByText("You're on the list.")).toBeHidden()
  })
})
