'use client'

export default function FrontendError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="container-page section-y" aria-labelledby="error-heading">
      <h1 id="error-heading" className="text-page font-semibold">
        This content is temporarily unavailable
      </h1>
      <p className="mt-3 text-muted">Please try again in a moment.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-md border border-accent px-4 py-2 text-accent hover:bg-accent hover:text-midnight"
      >
        Try again
      </button>
    </section>
  )
}
