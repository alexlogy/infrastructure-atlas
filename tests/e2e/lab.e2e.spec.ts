import { expect, type Page, test } from '@playwright/test'

const run = Date.now()
const lead = `E2E lab lead ${run}`
const other = `E2E lab other ${run}`
let headers: Record<string, string>
const cleanup: string[] = []
const primary = (page: Page) => page.getByRole('navigation', { name: 'Primary' })

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ request }) => {
  const login = await request.post('/api/users/login', {
    data: { email: process.env.E2E_EDITOR_EMAIL, password: process.env.E2E_EDITOR_PASSWORD },
  })
  headers = { Authorization: `JWT ${(await login.json()).token}` }
})

test.afterAll(async ({ request }) => {
  for (const path of cleanup) await request.delete(path, { headers })
})

test('with no published lab entries, /lab is not found and not in the navigation', async ({
  page,
}) => {
  expect((await page.goto('/lab'))?.status()).toBe(404)
  await page.goto('/')
  await expect(primary(page).getByRole('link', { name: 'Lab' })).toHaveCount(0)
})

test('the lab leads with the featured entry and filters by tag', async ({ page, request }) => {
  const post = async (data: Record<string, unknown>, draft = false) => {
    const res = await request.post(`/api/lab-projects${draft ? '?draft=true' : ''}`, {
      headers,
      data,
    })
    expect(res.ok(), await res.text()).toBeTruthy()
    cleanup.unshift(`/api/lab-projects/${(await res.json()).doc.id}`)
  }
  await post({
    title: other,
    summary: 'A fictional experiment.',
    tags: ['sample-b'],
    stage: 'exploring',
    _status: 'published',
  })
  await post({
    title: lead,
    summary: 'A fictional featured experiment.',
    tags: ['sample-a'],
    featured: true,
    link: { label: 'Repository', href: 'https://example.test/repo' },
    _status: 'published',
  })
  await post({ title: `E2E lab draft ${run}`, summary: 'Never shown.', _status: 'draft' }, true)

  await page.goto('/')
  await primary(page).getByRole('link', { name: 'Lab' }).click()
  await expect(page).toHaveURL(/\/lab$/)
  const feature = page.locator('article[aria-labelledby="lab-feature-title"]')
  await expect(feature).toContainText(lead)
  await expect(feature.getByRole('link', { name: 'Repository →' })).toHaveAttribute(
    'href',
    'https://example.test/repo',
  )
  await expect(page.getByRole('article', { name: other })).toContainText('Exploring')
  await expect(page.getByText(`E2E lab draft ${run}`)).toHaveCount(0)

  const filter = page.getByRole('navigation', { name: 'Filter by tag' })
  await filter.getByRole('link', { name: 'sample-a' }).click()
  await expect(page).toHaveURL(/\?tag=sample-a$/)
  await expect(filter.getByRole('link', { name: 'sample-a' })).toHaveAttribute(
    'aria-current',
    'true',
  )
  await expect(page.getByRole('article', { name: lead })).toBeVisible()
  await expect(page.getByRole('article', { name: other })).toHaveCount(0)
})

test('the home page previews the lab', async ({ page }) => {
  await page.goto('/')
  const section = page.getByRole('region', { name: 'Lab', exact: true })
  await expect(section.getByRole('article', { name: lead })).toBeVisible()
  await expect(section.getByRole('link', { name: 'Visit the lab' })).toHaveAttribute('href', '/lab')
})
