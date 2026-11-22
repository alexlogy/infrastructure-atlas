import { type APIRequestContext, expect, test } from '@playwright/test'

let headers: Record<string, string>

const empty = {
  statement: '',
  principles: [],
  currentFocus: '',
  credentials: [],
  contact: { heading: '', text: '', links: [] },
}
const save = (request: APIRequestContext, data: Record<string, unknown>) =>
  request.post('/api/globals/about-page', { headers, data })

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ request }) => {
  const login = await request.post('/api/users/login', {
    data: { email: process.env.E2E_EDITOR_EMAIL, password: process.env.E2E_EDITOR_PASSWORD },
  })
  headers = { Authorization: `JWT ${(await login.json()).token}` }
})

test.afterAll(async ({ request }) => {
  await save(request, empty)
})

test('with no philosophy content, /about is not found and not in the navigation', async ({
  page,
  request,
}) => {
  expect((await save(request, empty)).ok()).toBeTruthy()
  const res = await page.goto('/about')
  expect(res?.status()).toBe(404)
  await page.goto('/')
  await expect(
    page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Philosophy' }),
  ).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Get in touch' })).toHaveCount(0)
})

test('the philosophy page shows principles, credential status and contact links', async ({
  page,
  request,
}) => {
  const res = await save(request, {
    statement: 'Sample opening statement',
    principles: [
      { title: 'Sample principle one', body: 'Sample body one.' },
      { title: 'Sample principle two' },
    ],
    currentFocus: 'Sample current focus.',
    credentials: [
      { title: 'Sample lapsed credential', issuer: 'Sample issuer', expiresOn: '2001-01-01' },
      { title: 'Sample lasting credential', issuer: 'Sample issuer' },
    ],
    contact: {
      heading: 'Sample contact heading',
      links: [{ label: 'Email', href: 'mailto:owner@example.test' }],
    },
  })
  expect(res.ok(), await res.text()).toBeTruthy()

  await page.goto('/')
  await page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('link', { name: 'Philosophy' })
    .click()
  await expect(page).toHaveURL(/\/about$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sample opening statement')
  await expect(page.getByRole('heading', { name: 'Sample principle two' })).toBeVisible()
  const credentials = page.getByRole('complementary', { name: 'Credentials' })
  await expect(credentials.getByRole('listitem').first()).toContainText('Expired')
  await expect(credentials.getByRole('listitem').last()).not.toContainText(/Expired|Current/)
  const contact = page.getByRole('region', { name: 'Sample contact heading' })
  await expect(contact.getByRole('link', { name: 'Email' })).toHaveAttribute(
    'href',
    'mailto:owner@example.test',
  )
})

test('the home page previews the philosophy and ends with the contact section', async ({
  page,
}) => {
  await page.goto('/')
  const preview = page.getByRole('region', { name: 'Sample opening statement' })
  await expect(preview.getByRole('heading', { name: 'Sample principle one' })).toBeVisible()
  await expect(preview.getByRole('link', { name: 'Read the philosophy' })).toHaveAttribute(
    'href',
    '/about',
  )
  await expect(page.getByRole('region', { name: 'Sample contact heading' })).toBeVisible()
})
