import { type APIRequestContext, expect, type Locator, type Page, test } from '@playwright/test'

const run = Date.now()
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
  const place = await post(request, '/api/atlas-locations', {
    label: `E2E transition place ${run}`,
    latitude: 1.5,
    longitude: 104,
    precision: 'city',
    _status: 'published',
  })
  await post(request, '/api/timeline-milestones', {
    title: `E2E transition milestone ${run}`,
    startDate: '2095-01-01T00:00:00.000Z',
    datePrecision: 'year',
    _status: 'published',
  })
  await post(request, '/api/impact-projects', {
    title: `E2E transition project ${run}`,
    slug: `e2e-transition-project-${run}`,
    summary: 'A fictional project used by the transition tests.',
    locations: [Number(place)],
    _status: 'published',
  })
})

test.afterAll(async ({ request }) => {
  for (const path of cleanup) await request.delete(path, { headers })
})

const animation = (el: Locator) => el.evaluate((node) => getComputedStyle(node).animationName)
const globe = (page: Page) => page.locator('section[aria-labelledby="home-heading"] .globe-recede')
const handoff = (page: Page) => page.locator('.summit-handoff-line')
const journeyHeader = (page: Page) =>
  page.locator('section[aria-labelledby="home-journey-heading"] > .enter-on-scroll').first()

test('home sections carry scroll-driven transitions, and the globe logs no THREE.Clock warning', async ({
  page,
}) => {
  const messages: string[] = []
  page.on('console', (msg) => messages.push(msg.text()))
  await page.goto('/')

  await expect(page.locator('section[aria-labelledby="home-heading"] canvas')).toBeVisible()
  expect(await animation(globe(page))).toBe('globe-recede')
  expect(await animation(journeyHeader(page))).toBe('enter')
  // The summit hand-off leads into Impact only when the Journey is on the page too.
  expect(await animation(handoff(page))).toBe('handoff-line')
  await expect(page.locator('.summit-handoff')).toHaveAttribute('aria-hidden', 'true')

  // Scrolled to the Impact section, the content there is fully shown, not stuck mid-animation.
  await page.locator('#home-impact-heading').scrollIntoViewIfNeeded()
  await expect
    .poll(() =>
      page
        .locator('section[aria-labelledby="home-impact-heading"] > .enter-on-scroll')
        .evaluate((n) => getComputedStyle(n).opacity),
    )
    .toBe('1')

  expect(messages.filter((m) => m.includes('THREE.Clock'))).toEqual([])
})

test('with reduced motion nothing animates and nothing is hidden', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  expect(await animation(globe(page))).toBe('none')
  expect(await animation(journeyHeader(page))).toBe('none')
  expect(await animation(handoff(page))).toBe('none')
  await expect(page.locator('.journey-node').first()).toHaveCSS('opacity', '1')
})

test('the Impact page has no summit hand-off', async ({ page }) => {
  await page.goto('/impact')
  await expect(page.locator('.summit-handoff')).toHaveCount(0)
})
