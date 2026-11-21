import { expect, type Locator, test } from '@playwright/test'
import sharp from 'sharp'

const png = () =>
  sharp({ create: { width: 8, height: 6, channels: 3, background: '#65d6df' } })
    .png()
    .toBuffer()

const loaded = (img: Locator) =>
  img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)

test('media is public only while published content uses it, and still previews for editors', async ({
  page,
  request: anonymous,
}) => {
  // page.request shares the browser's cookie jar; API writes use the JWT (see preview.e2e.spec.ts).
  const login = await page.request.post('/api/users/login', {
    data: { email: process.env.E2E_EDITOR_EMAIL, password: process.env.E2E_EDITOR_PASSWORD },
  })
  expect(login.ok()).toBeTruthy()
  const headers = { Authorization: `JWT ${(await login.json()).token}` }
  const run = Date.now()
  const cleanup: string[] = []

  const upload = async (alt: string) => {
    const res = await page.request.post('/api/media', {
      headers,
      multipart: {
        file: {
          name: `e2e-${run}-${alt.replace(/\W+/g, '-')}.png`,
          mimeType: 'image/png',
          buffer: await png(),
        },
        _payload: JSON.stringify({ alt }),
      },
    })
    expect(res.ok(), await res.text()).toBeTruthy()
    const { doc } = await res.json()
    cleanup.push(`/api/media/${doc.id}`)
    return doc as { id: number; filename: string }
  }
  const milestone = async (title: string, image: number, status: 'draft' | 'published') => {
    const res = await page.request.post(
      `/api/timeline-milestones${status === 'draft' ? '?draft=true' : ''}`,
      {
        headers,
        data: {
          title,
          image,
          startDate: '2017-05-01T00:00:00.000Z',
          datePrecision: 'year',
          _status: status,
        },
      },
    )
    expect(res.ok(), await res.text()).toBeTruthy()
    cleanup.unshift(`/api/timeline-milestones/${(await res.json()).doc.id}`)
  }

  try {
    const shown = await upload(`E2E published image ${run}`)
    const hidden = await upload(`E2E draft-only image ${run}`)
    await milestone(`E2E milestone with image ${run}`, shown.id, 'published')
    await milestone(`E2E draft with image ${run}`, hidden.id, 'draft')

    // Visitors (no session) get the published file, never the draft-only one.
    const file = await anonymous.get(`/api/media/file/${shown.filename}`)
    expect(file.status()).toBe(200)
    expect(file.headers()['cache-control']).toBe('private, no-cache')
    expect((await anonymous.get(`/api/media/file/${hidden.filename}`)).status()).toBe(403)
    expect((await anonymous.get(`/api/media/${hidden.id}`)).ok()).toBeFalsy()

    // The published image renders through next/image.
    await page.goto('/journey')
    const published = page.getByRole('img', { name: `E2E published image ${run}` })
    await expect(published).toBeVisible()
    await expect(published).toHaveAttribute('src', /^\/_next\/image\?url=%2Fapi%2Fmedia%2Ffile%2F/)
    await expect.poll(() => loaded(published)).toBe(true)

    // In preview the editor's browser loads the draft-only image with its own session.
    await page.goto('/api/preview?path=/journey')
    const draft = page.getByRole('img', { name: `E2E draft-only image ${run}` })
    await expect(draft).toBeVisible()
    await expect(draft).toHaveAttribute('src', `/api/media/file/${hidden.filename}`)
    await expect.poll(() => loaded(draft)).toBe(true)
  } finally {
    await page.request.get('/api/exit-preview', { maxRedirects: 0 })
    for (const path of cleanup) await page.request.delete(path, { headers })
  }
})
