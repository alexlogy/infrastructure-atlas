import { expect, type Page, test } from '@playwright/test'

const run = Date.now()
let headers: Record<string, string>
const cleanup: string[] = []
const hero = (page: Page) => page.locator('section[aria-labelledby="home-heading"]')

test.beforeAll(async ({ request }) => {
  const login = await request.post('/api/users/login', {
    data: { email: process.env.E2E_EDITOR_EMAIL, password: process.env.E2E_EDITOR_PASSWORD },
  })
  headers = { Authorization: `JWT ${(await login.json()).token}` }
})

test.afterAll(async ({ request }) => {
  await request.post('/api/globals/home-page', {
    headers,
    data: { eyebrow: '', headline: '', headlineEmphasis: '' },
  })
  for (const path of cleanup) await request.delete(path, { headers })
})

test('the hero shows the eyebrow and a two-line headline from the CMS', async ({
  page,
  request,
}) => {
  const res = await request.post('/api/globals/home-page', {
    headers,
    data: {
      eyebrow: 'Sample eyebrow',
      headline: 'Sample first line',
      headlineEmphasis: 'Sample second line',
    },
  })
  expect(res.ok()).toBeTruthy()
  await page.goto('/')
  await expect(hero(page).getByText('Sample eyebrow')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Sample first lineSample second line',
  )
})

test('the metric strip shows published achievements only, and hides when empty', async ({
  page,
  request,
}) => {
  await page.goto('/')
  await expect(page.getByRole('list', { name: 'Highlights' })).toHaveCount(0)

  const create = async (data: Record<string, unknown>, draft = false) => {
    const r = await request.post(`/api/achievements${draft ? '?draft=true' : ''}`, {
      headers,
      data,
    })
    expect(r.ok(), await r.text()).toBeTruthy()
    cleanup.unshift(`/api/achievements/${(await r.json()).doc.id}`)
  }
  await create({ value: '00', unit: '+', label: `Sample figure ${run}`, _status: 'published' })
  await create({ value: '99', label: `Sample draft figure ${run}`, _status: 'draft' }, true)

  await page.goto('/')
  const strip = page.getByRole('list', { name: 'Highlights' })
  await expect(strip.getByText(`Sample figure ${run}`)).toBeVisible()
  await expect(strip).toContainText('00+')
  await expect(page.getByText(`Sample draft figure ${run}`)).toHaveCount(0)
})
