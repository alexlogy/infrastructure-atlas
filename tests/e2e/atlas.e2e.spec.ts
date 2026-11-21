import { expect, test } from '@playwright/test'

const suffix = Date.now()
const placeLabel = `E2E sample place ${suffix}`
const projectTitle = `E2E atlas project ${suffix}`

test.beforeAll(async ({ request }) => {
  const login = await request.post('/api/users/login', {
    data: { email: process.env.E2E_EDITOR_EMAIL, password: process.env.E2E_EDITOR_PASSWORD },
  })
  expect(login.ok()).toBeTruthy()
  const headers = { Authorization: `JWT ${(await login.json()).token}` }

  const ids: number[] = []
  for (const [label, latitude, longitude] of [
    [placeLabel, 1.5, 104],
    [`${placeLabel} (second)`, -33.9, 151.2],
  ] as const) {
    const res = await request.post('/api/atlas-locations', {
      headers,
      data: { label, latitude, longitude, precision: 'city', _status: 'published' },
    })
    expect(res.ok(), await res.text()).toBeTruthy()
    ids.push((await res.json()).doc.id)
  }

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
