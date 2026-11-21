import { type APIRequestContext, expect, test } from '@playwright/test'

/** Minimal Lexical document with one paragraph. */
const paragraph = (text: string) => ({
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

async function authHeaders(request: APIRequestContext) {
  const res = await request.post('/api/users/login', {
    data: { email: process.env.E2E_EDITOR_EMAIL, password: process.env.E2E_EDITOR_PASSWORD },
  })
  expect(res.ok()).toBeTruthy()
  return { Authorization: `JWT ${(await res.json()).token}` }
}

const slug = `e2e-sample-project-${Date.now()}`
const title = 'E2E sample project'

test.beforeAll(async ({ request }) => {
  const res = await request.post('/api/impact-projects', {
    headers: await authHeaders(request),
    data: {
      title,
      slug,
      summary: 'A fictional project used by the end-to-end tests.',
      leadershipNarrative: paragraph('Sample leadership narrative.'),
      engineeringNarrative: paragraph('Sample engineering narrative.'),
      outcomes: [{ result: 'Sample measured result', metric: '10%' }],
      _status: 'published',
    },
  })
  expect(res.ok()).toBeTruthy()
})

test('a published project is listed on /impact and links to its page', async ({ page }) => {
  await page.goto('/impact')
  await expect(page.getByRole('heading', { level: 1, name: 'Impact' })).toBeVisible()
  await page.getByRole('link', { name: title }).click()
  await expect(page).toHaveURL(new RegExp(`/impact/${slug}$`))
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
  await expect(page.getByText('10%')).toBeVisible()
})

test('the perspective switch is keyboard operable and deep-linkable', async ({ page }) => {
  await page.goto(`/impact/${slug}`)
  const nav = page.getByRole('navigation', { name: 'Project perspective' })
  const leadership = nav.getByRole('link', { name: 'Leadership' })
  const engineering = nav.getByRole('link', { name: 'Engineering' })

  await expect(leadership).toHaveAttribute('aria-current', 'true')
  await expect(page.getByText('Sample leadership narrative.')).toBeVisible()

  await engineering.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\?view=engineering$/)
  await expect(nav.getByRole('link', { name: 'Engineering' })).toHaveAttribute(
    'aria-current',
    'true',
  )
  await expect(page.getByRole('heading', { name: 'Engineering perspective' })).toBeVisible()
  await expect(page.getByText('Sample engineering narrative.')).toBeVisible()
  await expect(page.getByText('Sample leadership narrative.')).toHaveCount(0)
})

test('unknown project slugs return 404', async ({ page }) => {
  const res = await page.goto('/impact/does-not-exist')
  expect(res?.status()).toBe(404)
})

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('a perspective deep link is server-rendered', async ({ page }) => {
    await page.goto(`/impact/${slug}?view=engineering`)
    await expect(page.getByRole('heading', { name: 'Engineering perspective' })).toBeVisible()
    await expect(page.getByText('Sample engineering narrative.')).toBeVisible()
  })
})
