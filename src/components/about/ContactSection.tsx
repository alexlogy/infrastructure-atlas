import { SmartLink } from '@/components/layout/SmartLink'
import type { AboutPageView, NavLink } from '@/types/view-models'

/**
 * Closing call to action: the editor's contact heading, text and links, plus the site-wide contact
 * button. Renders nothing until at least a heading or a link exists.
 */
export function ContactSection({
  contact,
  button,
}: {
  contact: AboutPageView['contact']
  button: NavLink | null
}) {
  const links = [...(button ? [button] : []), ...contact.links].filter(
    (link, i, all) => all.findIndex((l) => l.href === link.href) === i,
  )
  if (!contact.heading && links.length === 0) return null

  return (
    <section aria-labelledby="contact-heading" className="container-page section-y">
      <div className="enter-on-scroll relative overflow-hidden rounded-3xl border border-line bg-surface/70 px-6 py-12 text-center sm:px-12">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-24 mx-auto h-48 w-2/3 rounded-full bg-accent/10 blur-3xl"
        />
        <p className="eyebrow relative">Contact</p>
        <h2 id="contact-heading" className="relative mt-3 text-section font-semibold">
          {contact.heading ?? 'Get in touch'}
        </h2>
        {contact.text && (
          <p className="relative mx-auto mt-4 max-w-xl leading-relaxed text-muted">
            {contact.text}
          </p>
        )}
        {links.length > 0 && (
          <ul className="relative mt-8 flex flex-wrap justify-center gap-3">
            {links.map((link, i) => (
              <li key={link.href}>
                <SmartLink
                  href={link.href}
                  className={`inline-flex min-h-11 items-center rounded-lg px-5 font-medium transition-colors duration-150 ${
                    i === 0
                      ? 'bg-accent text-midnight hover:bg-ice'
                      : 'border border-line text-ink hover:border-accent hover:text-accent'
                  }`}
                >
                  {link.label}
                </SmartLink>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
