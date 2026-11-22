import { type Page, expect, test } from '@playwright/test'

const suffix = Date.now()
const placeLabel = `E2E sample place ${suffix}`
const projectTitle = `E2E atlas project ${suffix}`
const category = `Sample category ${suffix}`
let placeId: number

test.beforeAll(async ({ request }) => {
  const login = await request.post('/api/users/login', {
    data: { email: process.env.E2E_EDITOR_EMAIL, password: process.env.E2E_EDITOR_PASSWORD },
  })
  expect(login.ok()).toBeTruthy()
  const headers = { Authorization: `JWT ${(await login.json()).token}` }

  const ids: number[] = []
  for (const [label, latitude, longitude, cat] of [
    [placeLabel, 1.5, 104, category],
    [`${placeLabel} (second)`, -33.9, 151.2, null],
  ] as const) {
    const res = await request.post('/api/atlas-locations', {
      headers,
      data: { label, latitude, longitude, category: cat, precision: 'city', _status: 'published' },
    })
    expect(res.ok(), await res.text()).toBeTruthy()
    ids.push((await res.json()).doc.id)
  }
  placeId = ids[0]

  const project = await request.post('/api/impact-projects', {
    headers,
    data: {
      title: projectTitle,
      slug: `e2e-atlas-project-${suffix}`,
      summary: 'A fictional project used by the atlas tests.',
      locations: ids,
      _status: 'published',
    },
  })
  expect(project.ok(), await project.text()).toBeTruthy()
})

const place = (page: import('@playwright/test').Page) =>
  page
    .getByRole('list', { name: 'Places' })
    .getByRole('listitem')
    .filter({
      has: page.getByRole('heading', { name: placeLabel, exact: true }),
    })

test('places and their stories are listed, and the globe responds to the list', async ({
  page,
}) => {
  await page.goto('/atlas')
  await expect(page.getByRole('heading', { level: 1, name: 'Atlas' })).toBeVisible()
  await expect(place(page).getByRole('link', { name: projectTitle })).toBeVisible()

  await expect(page.locator('canvas')).toBeVisible()
  const show = place(page).getByRole('button', { name: /Show on globe/ })
  await show.focus()
  await page.keyboard.press('Enter')
  await expect(place(page).getByRole('button', { name: /Shown on globe/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('without WebGL the list still works and explains the missing globe', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    // @ts-expect-error -- test stub: report no WebGL support
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      return type.startsWith('webgl') ? null : original.call(this, type, ...(args as []))
    }
  })
  await page.goto('/atlas')
  await expect(
    page.getByText('The interactive globe isn’t available in this browser.'),
  ).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(0)
  await expect(place(page).getByRole('link', { name: projectTitle })).toBeVisible()
  await expect(page.getByRole('button', { name: /Show on globe/ })).toHaveCount(0)
})

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('the place list is server-rendered HTML', async ({ page }) => {
    await page.goto('/atlas')
    await expect(place(page).getByRole('link', { name: projectTitle })).toBeVisible()
  })
})

test('categories get their own marker, shown in a key and on each place', async ({ page }) => {
  await page.goto('/atlas')
  const key = page.getByRole('list', { name: 'Marker key' })
  await expect(key.getByText(category)).toBeVisible()
  await expect(key.getByText('Other places')).toBeVisible()
  await expect(place(page).getByText(category)).toBeVisible()
})

test('a #place- link preselects that place', async ({ page }) => {
  await page.goto(`/atlas#place-${placeId}`)
  await expect(place(page).getByRole('button', { name: /Shown on globe/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('the side panel shows the chosen place, and the index can be searched', async ({ page }) => {
  await page.goto('/atlas')
  const panel = page.getByRole('complementary', { name: 'Place details' })
  await expect(panel).toContainText('Choose a place')

  const index = panel.getByRole('list', { name: 'Place index' })
  await panel.getByRole('searchbox', { name: 'Find a place' }).fill('(second)')
  await expect(index.getByRole('link')).toHaveCount(1)
  await panel.getByRole('searchbox', { name: 'Find a place' }).fill(String(suffix))
  await index.getByRole('link', { name: placeLabel, exact: true }).click()

  await expect(page).toHaveURL(new RegExp(`#place-${placeId}$`))
  await expect(panel).toContainText('Selected place')
  await expect(panel.getByRole('link', { name: projectTitle })).toBeVisible()
  await expect(index.getByRole('link', { name: placeLabel, exact: true })).toHaveAttribute(
    'aria-current',
    'true',
  )
  await expect(place(page).getByRole('button', { name: /Shown on globe/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await panel.getByRole('searchbox', { name: 'Find a place' }).fill('no such place zzz')
  await expect(index).toContainText('No places match')
})

const hero = (page: Page) => page.locator('section[aria-labelledby="home-heading"]')

test('the home hero shows the globe with an atlas card and place buttons', async ({ page }) => {
  await page.goto('/')
  await expect(hero(page)).toContainText(/\d+ places?/)
  await expect(hero(page).locator('canvas')).toBeVisible()

  await hero(page).getByRole('group', { name: 'Places' }).getByRole('button').first().click()
  await expect(hero(page).getByText('Location', { exact: true })).toBeVisible()
  await expect(hero(page).getByRole('link', { name: 'Open in the atlas →' })).toHaveAttribute(
    'href',
    /^\/atlas#place-\d+$/,
  )
})

test('without WebGL the hero keeps the atlas card and its links', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    // @ts-expect-error -- test stub: report no WebGL support
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      return type.startsWith('webgl') ? null : original.call(this, type, ...(args as []))
    }
  })
  await page.goto('/')
  await hero(page).getByRole('link', { name: 'Explore the atlas →' }).click()
  await expect(page).toHaveURL(/\/atlas$/)
  await expect(page.locator('canvas')).toHaveCount(0)
})
