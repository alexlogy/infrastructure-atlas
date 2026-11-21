// Minimal stand-in for the Ghost Content API used by the e2e suite.
// Serves fictional posts only; no real blog or credentials are involved.
import { createServer } from 'node:http'

const PORT = Number(process.env.MOCK_GHOST_PORT ?? 3201)
const KEY = 'e2e-placeholder-content-key'

const post = (n, extra = {}) => ({
  id: `mock-${n}`,
  title: `Sample article ${n}`,
  slug: `sample-article-${n}`,
  url: `https://blog.example.test/sample-article-${n}/`,
  canonical_url: null,
  custom_excerpt: null,
  excerpt: `A fictional excerpt for sample article ${n}.`,
  feature_image: null,
  feature_image_alt: null,
  published_at: `2024-0${n}-15T09:00:00.000+00:00`,
  reading_time: n,
  tags: [{ name: 'Sample tag', slug: 'sample-tag', visibility: 'public' }],
  ...extra,
})

const POSTS = [5, 4, 3, 2, 1].map((n) =>
  post(n, n === 3 ? { canonical_url: 'https://canonical.example.test/sample-article-3/' } : {}),
)

const slugsIn = (filter, negate) => {
  const match = filter.match(negate ? /slug:-\[([^\]]*)\]/ : /(?:^|\+)slug:\[([^\]]*)\]/)
  return match ? match[1].split(',').filter(Boolean) : null
}

createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)
  if (url.pathname === '/health') return res.end('ok')
  if (url.pathname !== '/ghost/api/content/posts/') {
    res.statusCode = 404
    return res.end()
  }
  if (url.searchParams.get('key') !== KEY) {
    res.statusCode = 401
    return res.end(JSON.stringify({ errors: [{ message: 'Unknown Content API Key' }] }))
  }
  const filter = url.searchParams.get('filter') ?? ''
  const limit = Number(url.searchParams.get('limit') ?? 15)
  const only = slugsIn(filter, false)
  const skip = slugsIn(filter, true) ?? []
  const posts = POSTS.filter((p) => (only ? only.includes(p.slug) : !skip.includes(p.slug)))
  res.setHeader('content-type', 'application/json')
  res.end(
    JSON.stringify({
      posts: posts.slice(0, limit),
      meta: { pagination: { page: 1, limit, pages: 1, total: posts.length } },
    }),
  )
}).listen(PORT)
