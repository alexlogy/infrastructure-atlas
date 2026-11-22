import { expect, type Page, test } from '@playwright/test'

const run = Date.now()
const para = (text: string) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        textFormat: 0,
        children: [
          { type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 },
        ],
      },
    ],
  },
})
const A = { title: `E2E dashboard A ${run}`, slug: `e2e-dashboard-a-${run}` }
const B = { title: `E2E dashboard B ${run}`, slug: `e2e-dashboard-b-${run}` }
const placeLabel = `E2E dashboard place ${run}`
let headers: Record<string, string>
const cleanup: string[] = []

test.beforeAll(async ({ request }) => {
  const login = await request.post('/api/users/login', {
    data: { email: process.env.E2E_EDITOR_EMAIL, password: process.env.E2E_EDITOR_PASSWORD },
  })
  headers = { Authorization: `JWT ${(await login.json()).token}` }
  const post = async (path: string, data: Record<string, unknown>) => {
    const res = await request.post(path, { headers, data })
    expect(res.ok(), await res.text()).toBeTruthy()
    const id = (await res.json()).doc.id
    cleanup.unshift(`${path}/${id}`)
    return id
  }
  const place = await post('/api/atlas-locations', {
    label: placeLabel,
    latitude: 1.3,
    longitude: 103.8,
    _status: 'published',
  })
  const ids = [
    await post('/api/impact-projects', {
      ...A,
      summary: 'Fictional dashboard project A.',
      category: 'Sample category A',
      icon: 'cloud',
      challenge: para('Sample dashboard challenge.'),
      leadershipNarrative: para('Sample dashboard approach.'),
      engineeringNarrative: para('Sample dashboard engineering.'),
      decisions: para('Sample dashboard decisions.'),
      outcomes: [{ result: 'Sample dashboard result', metric: '00%' }],
      locations: [place],
      _status: 'published',
    }),
    await post('/api/impact-projects', {
      ...B,
      summary: 'Fictional dashboard project B.',
      challenge: para('Sample challenge for B.'),
      _status: 'published',
    }),
  ]
  // The dashboard follows the home page's chosen projects.
  await request.post('/api/globals/home-page', { headers, data: { featuredProjects: ids } })
})

test.afterAll(async ({ request }) => {
  await request.post('/api/globals/home-page', { headers, data: { featuredProjects: [] } })
  for (const path of cleanup) await request.delete(path, { headers })
})

const featured = (page: Page) => page.locator('article[aria-labelledby="impact-featured-title"]')
const tiles = (page: Page) => page.getByRole('navigation', { name: 'Featured projects' })

test('the dashboard shows the first chosen project with its tiles and places', async ({ page }) => {
  await page.goto('/impact')
  await expect(featured(page)).toHaveAccessibleName(A.title)
  await expect(featured(page).getByText('Sample dashboard challenge.')).toBeVisible()
  await expect(featured(page).getByText('Sample dashboard approach.')).toBeVisible()
  await expect(featured(page).getByRole('list', { name: 'Measured outcomes' })).toContainText('00%')
  await expect(tiles(page).getByRole('link', { name: new RegExp(A.title) })).toHaveAttribute(
    'aria-current',
    'true',
  )
  await expect(tiles(page).getByText('Sample category A')).toBeVisible()

  const regional = page.getByRole('region', { name: 'Where it happened' })
  await expect(regional.getByText(placeLabel)).toBeVisible()
  await expect(regional.getByRole('link', { name: 'Open in the atlas →' })).toHaveAttribute(
    'href',
    /^\/atlas#place-\d+$/,
  )
})

test('perspective and project choices live in the URL', async ({ page }) => {
  await page.goto('/impact')
  await featured(page)
    .getByRole('navigation', { name: 'Project perspective' })
    .getByRole('link', { name: 'Engineering' })
    .click()
  await expect(page).toHaveURL(new RegExp(`[?]project=${A.slug}&view=engineering$`))
  await expect(featured(page).getByText('Sample dashboard decisions.')).toBeVisible()
  await expect(featured(page).getByText('Sample dashboard challenge.')).toHaveCount(0)
  await expect(featured(page).getByRole('link', { name: /full case study/ })).toHaveAttribute(
    'href',
    `/impact/${A.slug}?view=engineering`,
  )

  await tiles(page)
    .getByRole('link', { name: new RegExp(B.title) })
    .click()
  await expect(featured(page)).toHaveAccessibleName(B.title)
  await expect(featured(page).getByText('Sample challenge for B.')).toBeVisible()
  // B has no places, so the regional column is left out.
  await expect(page.getByRole('region', { name: 'Where it happened' })).toHaveCount(0)
})

test('the home page shows the same dashboard', async ({ page }) => {
  await page.goto(`/?project=${B.slug}`)
  const section = page.getByRole('region', { name: 'Impact', exact: true })
  await expect(section.getByRole('article', { name: B.title })).toBeVisible()
  await expect(section.getByRole('link', { name: 'All projects' })).toHaveAttribute(
    'href',
    '/impact',
  )
})

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('dashboard links are server-rendered views', async ({ page }) => {
    await page.goto(`/impact?project=${A.slug}&view=engineering`)
    await expect(featured(page)).toHaveAccessibleName(A.title)
    await expect(featured(page).getByText('Sample dashboard decisions.')).toBeVisible()
    await expect(page.getByRole('region', { name: 'Where it happened' })).toContainText(placeLabel)
  })
})
