import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="container-page section-y" aria-labelledby="nf-heading">
      <h1 id="nf-heading" className="text-page font-semibold">
        Page not found
      </h1>
      <p className="mt-3 text-muted">The page you are looking for does not exist.</p>
      <Link href="/" className="mt-8 inline-block text-accent underline underline-offset-4">
        Back to the homepage
      </Link>
    </section>
  )
}
