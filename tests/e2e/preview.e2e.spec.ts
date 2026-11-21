import { expect, test } from '@playwright/test'

test('anonymous visitors cannot enable preview or use it as an open redirect', async ({
  request,
}) => {
  const anonymous = await request.get('/api/preview?path=/journey', { maxRedirects: 0 })
  expect(anonymous.status()).toBe(401)
  expect(anonymous.headers()['set-cookie'] ?? '').not.toContain('__prerender_bypass')

  for (const path of ['//evil.example.com', 'https://evil.example.com', '/\\evil.example.com']) {
    const res = await request.get(`/api/preview?path=${encodeURIComponent(path)}`, {
      maxRedirects: 0,
    })
    expect(res.status(), path).toBe(400)
  }
})

test('a signed-in editor previews a draft milestone, then exits preview', async ({ page }) => {
  // page.request shares the browser's cookie jar, so the login cookie applies to page.goto.
  // Payload only honours that cookie on browser navigations (CSRF rule), so API writes use the JWT.
  const login = await page.request.post('/api/users/login', {
    data: { email: process.env.E2E_EDITOR_EMAIL, password: process.env.E2E_EDITOR_PASSWORD },
  })
  expect(login.ok()).toBeTruthy()
  const headers = { Authorization: `JWT ${(await login.json()).token}` }

  const title = `E2E draft preview ${Date.now()}`
  const created = await page.request.post('/api/timeline-milestones?draft=true', {
    headers,
    data: { title, startDate: '2018-02-01T00:00:00.000Z', datePrecision: 'year', _status: 'draft' },
  })
  expect(created.ok(), await created.text()).toBeTruthy()

  await page.goto('/journey')
  await expect(page.getByRole('heading', { name: title })).toHaveCount(0)

  await page.goto('/api/preview?path=/journey')
  await expect(page).toHaveURL(/\/journey$/)
  await expect(page.getByRole('status')).toContainText('Preview mode')
  await expect(page.getByRole('heading', { name: title })).toBeVisible()

  // Losing the session (logout/expiry) ends draft visibility even though the draft-mode cookie remains.
  await page.context().clearCookies({ name: 'payload-token' })
  await page.reload()
  await expect(page.getByRole('heading', { name: title })).toHaveCount(0)
  await expect(page.getByText('Preview mode')).toHaveCount(0)

  await page.goto('/api/exit-preview')
  await expect(page).toHaveURL(/\/$/)
  const cookies = await page.context().cookies()
  expect(cookies.find((c) => c.name === '__prerender_bypass')?.value ?? '').toBe('')
})
