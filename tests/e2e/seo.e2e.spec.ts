import { expect, test } from '@playwright/test'

test('robots.txt keeps crawlers out of the admin and APIs and points to the sitemap', async ({
  request,
  baseURL,
}) => {
  const body = await (await request.get('/robots.txt')).text()
  expect(body).toContain('Disallow: /admin')
  expect(body).toContain('Disallow: /api/')
  expect(body).toContain(`Sitemap: ${baseURL}/sitemap.xml`)
})

test('the sitemap lists published projects but never drafts', async ({ request, baseURL }) => {
  const login = await request.post('/api/users/login', {
    data: { email: process.env.E2E_EDITOR_EMAIL, password: process.env.E2E_EDITOR_PASSWORD },
  })
  const headers = { Authorization: `JWT ${(await login.json()).token}` }
  const suffix = Date.now()
  for (const status of ['published', 'draft'] as const) {
    const res = await request.post(
      `/api/impact-projects${status === 'draft' ? '?draft=true' : ''}`,
      {
        headers,
        data: {
          title: `SEO ${status} sample`,
          slug: `seo-${status}-sample-${suffix}`,
          summary: 'Fictional.',
          _status: status,
        },
      },
    )
    expect(res.ok(), await res.text()).toBeTruthy()
  }

  const xml = await (await request.get('/sitemap.xml')).text()
  expect(xml).toContain(`<loc>${baseURL}/</loc>`)
  expect(xml).toContain(`<loc>${baseURL}/impact/seo-published-sample-${suffix}</loc>`)
  expect(xml).not.toContain(`seo-draft-sample-${suffix}`)
  expect(xml).not.toContain('/admin')
})

test('pages carry canonical and Open Graph metadata', async ({ page, baseURL }) => {
  await page.goto('/journey')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${baseURL}/journey`)
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /^Journey · /)
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    `${baseURL}/journey`,
  )
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website')
})
