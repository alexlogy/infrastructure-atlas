import { expect, test } from '@playwright/test'

test('the current page is marked in the primary navigation', async ({ page }) => {
  await page.goto('/impact')
  const nav = page.getByRole('navigation', { name: 'Primary' })
  await expect(nav.getByRole('link', { name: 'Impact' })).toHaveAttribute('aria-current', 'page')
  await expect(nav.getByRole('link', { name: 'Journey' })).not.toHaveAttribute('aria-current')
  await expect(page.getByRole('navigation', { name: 'Footer' })).toBeVisible()
})

test('the header stays visible while scrolling', async ({ page }) => {
  await page.goto('/journey')
  await page.mouse.wheel(0, 2000)
  await expect(page.getByRole('banner')).toBeInViewport()
})

test('the contact button appears once an editor sets a link', async ({ page, request }) => {
  const login = await request.post('/api/users/login', {
    data: { email: process.env.E2E_EDITOR_EMAIL, password: process.env.E2E_EDITOR_PASSWORD },
  })
  const headers = { Authorization: `JWT ${(await login.json()).token}` }
  const setContact = (href: string | null) =>
    request.post('/api/globals/site-settings', {
      headers,
      data: { contact: { label: 'Get in touch', href } },
    })

  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Get in touch' })).toHaveCount(0)
  try {
    expect((await setContact('mailto:owner@example.test')).ok()).toBeTruthy()
    await page.goto('/')
    await expect(
      page.getByRole('banner').getByRole('link', { name: 'Get in touch' }),
    ).toHaveAttribute('href', 'mailto:owner@example.test')
  } finally {
    await setContact(null)
  }
})

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('the menu opens, closes on Escape and navigates', async ({ page }) => {
    await page.goto('/')
    const menu = page.getByRole('button', { name: 'Menu' })
    await expect(menu).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeHidden()

    await menu.click()
    await expect(menu).toHaveAttribute('aria-expanded', 'true')
    const nav = page.getByRole('navigation', { name: 'Primary' })
    await expect(nav).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(nav).toBeHidden()
    await expect(menu).toBeFocused()

    await menu.click()
    await nav.getByRole('link', { name: 'Journey' }).click()
    await expect(page).toHaveURL(/\/journey$/)
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeHidden()
  })
})
