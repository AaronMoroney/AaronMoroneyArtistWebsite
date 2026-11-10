import { Suspense } from "react"
import type { Metadata } from "next"

import { ContactForm, ContactFormForWork } from "@/components/contact-form"
import { ArrowUpRightIcon } from "@/components/icons"
import { PageHeader, PageShell } from "@/components/page-shell"
import { PageTransition } from "@/components/page-transition"
import { getArtworks, getSite } from "@/lib/content"

export const metadata: Metadata = {
  title: "Contact",
}

const labelClass =
  "font-mono text-[0.6875rem] leading-6 tracking-[0.14em] text-muted-foreground uppercase"
const linkClass =
  "inline-flex items-center gap-1.5 underline-offset-4 outline-none hover:underline focus-visible:underline"

export default async function ContactPage() {
  const site = getSite()
  const works = (await getArtworks()).map(({ slug, title }) => ({ slug, title }))

  const links = [
    site.email && { label: "Email", text: site.email, href: `mailto:${site.email}` },
    site.instagram && { label: "Instagram", text: "Instagram", href: site.instagram },
    site.artsy && { label: "Artsy", text: "Artsy", href: site.artsy },
  ].filter((link) => !!link)

  return (
    <PageTransition>
      <PageShell>
        <PageHeader eyebrow={site.name} title="Contact" />

        <div className="grid gap-14 pb-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-20">
          {links.length > 0 ? (
            <dl className="self-start border-t border-foreground/15">
              {links.map((link) => (
                <div
                  key={link.label}
                  className="grid grid-cols-[6.25rem_minmax(0,1fr)] gap-3 border-b border-foreground/15 py-3"
                >
                  <dt className={labelClass}>{link.label}</dt>
                  <dd>
                    {link.href.startsWith("mailto:") ? (
                      <a href={link.href} className={linkClass}>
                        {link.text}
                      </a>
                    ) : (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkClass}
                      >
                        {link.text}
                        <ArrowUpRightIcon />
                      </a>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="font-mono text-xs text-muted-foreground">
              Email and links to follow.
            </p>
          )}

          <Suspense fallback={<ContactForm email={site.email} />}>
            <ContactFormForWork email={site.email} works={works} />
          </Suspense>
        </div>
      </PageShell>
    </PageTransition>
  )
}
