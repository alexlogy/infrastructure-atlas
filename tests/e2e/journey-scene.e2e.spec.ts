import { type APIRequestContext, expect, type Page, test } from '@playwright/test'

const run = Date.now()
const titles = [1, 2, 3].map((i) => `E2E scene milestone ${i} ${run}`)
const projectTitle = `E2E scene project ${run}`
const ids: string[] = []
let headers: Record<string, string>
const cleanup: string[] = []

async function post(request: APIRequestContext, path: string, data: Record<string, unknown>) {
  const res = await request.post(path, { headers, data })
  expect(res.ok(), await res.text()).toBeTruthy()
  const id = String((await res.json()).doc.id)
  cleanup.unshift(`${path}/${id}`)
  return id
}

test.beforeAll(async ({ request }) => {
  const login = await request.post('/api/users/login', {
    data: { email: process.env.E2E_EDITOR_EMAIL, password: process.env.E2E_EDITOR_PASSWORD },
  })
  headers = { Authorization: `JWT ${(await login.json()).token}` }
  // Far-future dates keep these the newest milestones, so the last is the summit.
  for (const [i, title] of titles.entries()) {
    ids.push(
      await post(request, '/api/timeline-milestones', {
        title,
        startDate: `${2090 + i}-01-01T00:00:00.000Z`,
        datePrecision: 'year',
        era: i < 2 ? `E2E era A ${run}` : `E2E era B ${run}`,
        _status: 'published',
      }),
    )
  }
  await post(request, '/api/impact-projects', {
    title: projectTitle,
    slug: `e2e-scene-project-${run}`,
    summary: 'A fictional project linked to a milestone.',
    milestones: [Number(ids[0])],
    _status: 'published',
  })
})

test.afterAll(async ({ request }) => {
  for (const path of cleanup) await request.delete(path, { headers })
})

const scene = (page: Page) => page.getByRole('region', { name: 'Journey scene' })
const stop = (page: Page, i: number) => scene(page).getByRole('button', { name: titles[i] })
const panel = (page: Page) =>
  page.locator('[id^="milestone-detail-"]').locator('xpath=ancestor::article')

test('the scene selects the summit, then any milestone on the trail', async ({ page }) => {
  await page.goto('/journey')
  await expect(stop(page, 2)).toHaveAttribute('aria-current', 'step')
  await expect(panel(page)).toHaveAccessibleName(titles[2])

  await stop(page, 0).click()
  await expect(stop(page, 0)).toHaveAttribute('aria-current', 'step')
  await expect(stop(page, 2)).not.toHaveAttribute('aria-current')
  await expect(panel(page)).toHaveAccessibleName(titles[0])
  await expect(page).toHaveURL(new RegExp(`#milestone-${ids[0]}$`))
  // Related projects come from the project's milestone relationship.
  await expect(
    page.getByRole('complementary', { name: 'Related projects' }).getByRole('link', {
      name: new RegExp(projectTitle),
    }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Later →' }).click()
  await expect(panel(page)).toHaveAccessibleName(titles[1])
  await page
    .getByRole('group', { name: 'Eras' })
    .getByRole('button', { name: `E2E era B ${run}` })
    .click()
  await expect(panel(page)).toHaveAccessibleName(titles[2])
})

test('milestone buttons are keyboard operable', async ({ page }) => {
  await page.goto('/journey')
  await stop(page, 1).focus()
  await page.keyboard.press('Enter')
  await expect(panel(page)).toHaveAccessibleName(titles[1])
})

test('a #milestone- link opens with that milestone selected', async ({ page }) => {
  await page.goto(`/journey#milestone-${ids[1]}`)
  await expect(stop(page, 1)).toHaveAttribute('aria-current', 'step')
  await expect(panel(page)).toHaveAccessibleName(titles[1])
})

test('the home page shows the journey scene and links to the full page', async ({ page }) => {
  await page.goto('/')
  const section = page.getByRole('region', { name: 'Journey', exact: true })
  await expect(section.getByRole('button', { name: titles[2] })).toHaveAttribute(
    'aria-current',
    'step',
  )
  await section.getByRole('link', { name: 'See the full journey' }).click()
  await expect(page).toHaveURL(/\/journey$/)
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the trail is drawn at once, with no animation', async ({ page }) => {
    await page.goto('/')
    const trail = page.locator('.journey-trail path').last()
    await trail.scrollIntoViewIfNeeded()
    expect(await trail.evaluate((el) => getComputedStyle(el).animationName)).toBe('none')
    expect(await trail.evaluate((el) => getComputedStyle(el).strokeDashoffset)).toMatch(/^0(px)?$/)
  })
})

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('the scene shows every milestone and the summit details', async ({ page }) => {
    await page.goto('/journey')
    for (const i of [0, 1, 2]) await expect(stop(page, i)).toBeVisible()
    await expect(panel(page)).toHaveAccessibleName(titles[2])
    await expect(page.locator('.journey-trail')).toHaveAttribute('data-reveal', 'static')
  })
})

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('the scene scrolls sideways inside its region, with the summit in view', async ({
    page,
  }) => {
    await page.goto('/journey')
    await expect(stop(page, 2)).toBeInViewport()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
})
