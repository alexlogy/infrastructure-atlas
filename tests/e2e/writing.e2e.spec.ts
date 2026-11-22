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

  // The first featured slug leads; the second no longer exists in Ghost and is skipped.
  const lead = page.locator('article').first()
  await expect(lead).toContainText('Featured story')
  await expect(lead.getByRole('link', { name: /Sample article 1/ })).toHaveAttribute(
    'href',
    'https://blog.example.test/sample-article-1/',
  )

  const more = page.getByRole('region', { name: 'More articles' })
  // recentCount = 3, newest first, without repeating the featured post.
  await expect(more.getByRole('heading', { level: 3 })).toHaveText([
    /Sample article 5/,
    /Sample article 4/,
    /Sample article 3/,
  ])
  // A post's canonical URL wins over its Ghost URL.
  await expect(more.getByRole('link', { name: /Sample article 3/ })).toHaveAttribute(
    'href',
    'https://canonical.example.test/sample-article-3/',
  )
  await expect(more.getByText('3 min read')).toBeVisible()
})

test('Writing filters by tag with plain links', async ({ page }) => {
  await page.goto('/writing')
  const filter = page.getByRole('navigation', { name: 'Filter by tag' })
  await filter.getByRole('link', { name: 'Second sample tag' }).click()
  await expect(page).toHaveURL(/\?tag=Second%20sample%20tag$/)
  const tagged = page.getByRole('region', { name: 'Articles tagged Second sample tag' })
  await expect(tagged.getByRole('article')).toHaveCount(1)
  await expect(tagged).toContainText('Sample article 4')
  await expect(page.getByText('Featured story')).toHaveCount(0)
})

test('the home page shows selected writing', async ({ page }) => {
  await page.goto('/')
  const section = page.getByRole('region', { name: 'Selected writing' })
  await expect(section.getByRole('article')).toHaveCount(3)
  await expect(section.getByRole('article').first()).toContainText('Sample article 1')
  await expect(section.getByRole('link', { name: 'All writing' })).toHaveAttribute(
    'href',
    '/writing',
  )
})

test('Writing renders without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/writing')
  await expect(page.getByRole('link', { name: /Sample article 5/ })).toBeVisible()
  await context.close()
})
