export function SiteFooter({ siteTitle }: { siteTitle: string }) {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto max-w-5xl px-6 py-8 text-sm text-muted">
        <p>{siteTitle}</p>
      </div>
    </footer>
  )
}
