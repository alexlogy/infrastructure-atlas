import { expect, test } from '@playwright/test'

// Posts come from tests/e2e/mock-ghost.mjs; writing settings are seeded in global-setup.ts.

test('Writing lists featured and recent Ghost posts that link to their canonical URLs', async ({
  page,
}) => {
  await page.goto('/')
  await page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('link', { name: 'Writing' })
    .click()
  await expect(page).toHaveURL(/\/writing$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Writing' })).toBeVisible()

  const featured = page.getByRole('region', { name: 'Featured' })
  // The second featured slug no longer exists in Ghost and is skipped.
  await expect(featured.getByRole('article')).toHaveCount(1)
  await expect(featured.getByRole('link', { name: /Sample article 1/ })).toHaveAttribute(
    'href',
    'https://blog.example.test/sample-article-1/',
  )

  const recent = page.getByRole('region', { name: 'Recent' })
  // recentCount = 3, newest first, without repeating the featured post.
  await expect(recent.getByRole('heading', { level: 3 })).toHaveText([
    /Sample article 5/,
    /Sample article 4/,
    /Sample article 3/,
  ])
  // A post's canonical URL wins over its Ghost URL.
  await expect(recent.getByRole('link', { name: /Sample article 3/ })).toHaveAttribute(
    'href',
    'https://canonical.example.test/sample-article-3/',
  )
  await expect(recent.getByText('3 min read')).toBeVisible()
})

test('Writing renders without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/writing')
  await expect(page.getByRole('link', { name: /Sample article 5/ })).toBeVisible()
  await context.close()
})
