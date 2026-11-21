import { expect, test } from '@playwright/test'

test('homepage renders an accessible shell with an empty CMS', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Infrastructure Atlas/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('banner')).toBeVisible()
  await expect(page.getByRole('main')).toBeVisible()
  await expect(page.getByRole('contentinfo')).toBeVisible()
})

test('health endpoint reports the database as reachable', async ({ request }) => {
  const res = await request.get('/api/health')
  expect(res.status()).toBe(200)
  expect(await res.json()).toEqual({ status: 'ok' })
})
