import { expect, test } from '@playwright/test'

test('homepage renders', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Infrastructure Atlas/)
  await expect(page.locator('h1').first()).toBeVisible()
})
