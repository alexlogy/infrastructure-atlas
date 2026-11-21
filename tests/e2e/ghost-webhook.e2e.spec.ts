import { createHmac } from 'node:crypto'

import { expect, type APIRequestContext, type Page, test } from '@playwright/test'

// The app server and this test share the placeholder secret set in playwright.config.ts.
const SECRET = process.env.REVALIDATION_SECRET ?? ''
const MOCK_GHOST = 'http://localhost:3201'
const WEBHOOK = '/api/revalidate/ghost'

const deliver = (request: APIRequestContext, secret = SECRET) => {
  const body = JSON.stringify({ post: { current: { slug: 'sample-article-6' } } })
  const ts = Date.now()
  const signature = createHmac('sha256', secret).update(`${body}${ts}`).digest('hex')
  return request.post(WEBHOOK, {
    data: body,
    headers: {
      'content-type': 'application/json',
      'x-ghost-signature': `sha256=${signature}, t=${ts}`,
    },
  })
}

const recentTitles = (page: Page) =>
  page.getByRole('region', { name: 'Recent' }).getByRole('heading', { level: 3 })

// Leave the mock and the cached list as other tests expect them.
test.afterEach(async ({ request }) => {
  await request.post(`${MOCK_GHOST}/__reset`)
  expect((await deliver(request)).status()).toBe(204)
})

test('a signed Ghost webhook shows a newly published post without waiting for the cache', async ({
  page,
  request,
}) => {
  await page.goto('/writing')
  await expect(recentTitles(page).first()).toHaveText(/Sample article 5/)

  await request.post(`${MOCK_GHOST}/__publish`)
  await page.reload()
  // Still the cached list: nothing has told the site about the new post yet.
  await expect(recentTitles(page).first()).toHaveText(/Sample article 5/)

  expect((await deliver(request)).status()).toBe(204)
  await page.reload()
  await expect(recentTitles(page).first()).toHaveText(/Sample article 6/)
})

test('the webhook rejects unsigned, mis-signed and stale deliveries', async ({ request }) => {
  expect((await request.post(WEBHOOK, { data: '{}' })).status()).toBe(401)
  expect((await deliver(request, 'not-the-configured-secret-000000000')).status()).toBe(401)

  const body = '{}'
  const ts = Date.now() - 10 * 60 * 1000
  const signature = createHmac('sha256', SECRET).update(`${body}${ts}`).digest('hex')
  const stale = await request.post(WEBHOOK, {
    data: body,
    headers: { 'x-ghost-signature': `sha256=${signature}, t=${ts}` },
  })
  expect(stale.status()).toBe(401)
})
