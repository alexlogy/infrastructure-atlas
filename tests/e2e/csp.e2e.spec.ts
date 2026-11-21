import { expect, type Page, test } from '@playwright/test'

/** Records every CSP violation the browser reports on this page. */
async function trackViolations(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __csp: string[] }
    w.__csp = []
    document.addEventListener('securitypolicyviolation', (e) => {
      w.__csp.push(`${e.violatedDirective} ${e.blockedURI}`)
    })
  })
  return async () => page.evaluate(() => (window as unknown as { __csp: string[] }).__csp)
}

test('public pages send a nonce CSP and render without violations', async ({ page }) => {
  const violations = await trackViolations(page)
  for (const path of ['/', '/journey', '/impact', '/atlas', '/writing']) {
    const response = await page.goto(path)
    const csp = response?.headers()['content-security-policy'] ?? ''
    expect(csp, path).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/)
    await page.waitForLoadState('networkidle')
    expect(await violations(), path).toEqual([])
  }
})

test('the nonce changes on every request', async ({ request }) => {
  const nonce = async () =>
    (await request.get('/')).headers()['content-security-policy']?.match(/'nonce-([^']+)'/)?.[1]
  const [a, b] = [await nonce(), await nonce()]
  expect(a).toBeTruthy()
  expect(a).not.toBe(b)
})

test('the Payload admin works under the CSP', async ({ page }) => {
  const violations = await trackViolations(page)
  // Browser navigation carries the session cookie (see preview.e2e.spec.ts).
  const login = await page.request.post('/api/users/login', {
    data: { email: process.env.E2E_EDITOR_EMAIL, password: process.env.E2E_EDITOR_PASSWORD },
  })
  expect(login.ok()).toBeTruthy()

  await page.goto('/admin')
  await expect(page.getByRole('link', { name: /Milestones/ }).first()).toBeVisible()
  await page.goto('/admin/collections/timeline-milestones/create')
  await expect(page.locator('[contenteditable="true"]').first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  expect(await violations()).toEqual([])
})
