import { type APIRequestContext, expect, test } from '@playwright/test'

async function login(request: APIRequestContext): Promise<string> {
  const res = await request.post('/api/users/login', {
    data: { email: process.env.E2E_EDITOR_EMAIL, password: process.env.E2E_EDITOR_PASSWORD },
  })
  expect(res.ok()).toBeTruthy()
  return (await res.json()).token as string
}

test('a milestone published in the CMS appears on /journey; drafts never do', async ({
  page,
  request,
}) => {
  const token = await login(request)
  const headers = { Authorization: `JWT ${token}` }
  const title = `E2E sample milestone ${Date.now()}`

  await page.goto('/journey')
  await expect(page.getByRole('heading', { level: 1, name: 'Journey' })).toBeVisible()

  const created = await request.post('/api/timeline-milestones?draft=true', {
    headers,
    data: {
      title,
      startDate: '2019-05-10T00:00:00.000Z',
      datePrecision: 'month',
      _status: 'draft',
    },
  })
  expect(created.ok()).toBeTruthy()
  const { doc } = await created.json()

  await page.reload()
  await expect(page.getByRole('heading', { name: title })).toHaveCount(0)

  const published = await request.patch(`/api/timeline-milestones/${doc.id}`, {
    headers,
    data: { _status: 'published' },
  })
  expect(published.ok()).toBeTruthy()

  await page.reload()
  const card = page.getByRole('article', { name: title })
  await expect(card).toBeVisible()
  await expect(card.locator('time')).toHaveText('May 2019')

  // Anonymous API clients cannot write.
  const anonymous = await request.post('/api/timeline-milestones', {
    headers: { Authorization: '' },
    data: { title: 'Anonymous', startDate: '2019-01-01T00:00:00.000Z' },
  })
  expect(anonymous.status()).toBe(403)
})

test('skip link moves keyboard focus to the main content', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Skip to content' })
  await expect(skip).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#main')).toBeFocused()
})

test('primary navigation is keyboard reachable', async ({ page }) => {
  await page.goto('/')
  const journeyLink = page.getByRole('navigation', { name: 'Primary' }).getByRole('link', {
    name: 'Journey',
  })
  await journeyLink.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/journey$/)
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('timeline cards are not animated', async ({ page }) => {
    await page.goto('/journey')
    const card = page.locator('article.reveal').first()
    await expect(card).toBeVisible()
    expect(await card.evaluate((el) => getComputedStyle(el).animationName)).toBe('none')
  })
})

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('the timeline is server-rendered HTML', async ({ page }) => {
    await page.goto('/journey')
    await expect(page.getByRole('heading', { level: 1, name: 'Journey' })).toBeVisible()
    await expect(page.locator('article').first()).toBeVisible()
  })
})

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('pages fit the viewport without horizontal scrolling', async ({ page }) => {
    for (const path of ['/', '/journey']) {
      await page.goto(path)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(0)
    }
  })
})
