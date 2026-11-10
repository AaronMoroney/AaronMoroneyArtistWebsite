import type { Metadata } from "next"

import { PageHeader, PageShell } from "@/components/page-shell"
import { PageTransition } from "@/components/page-transition"
import { getCv, getSite } from "@/lib/content"

export const metadata: Metadata = {
  title: "About & CV",
}

const placeholder = "mt-3 font-mono text-xs text-muted-foreground"

export default function AboutPage() {
  const site = getSite()
  const cv = getCv()
  const sections = cv.sections.filter((section) => section.entries.length > 0)

  return (
    <PageTransition>
      <PageShell>
        <PageHeader eyebrow={site.name} title="About & CV" />

        <div className="grid gap-16 pb-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-20">
          <section aria-labelledby="statement-heading">
            <h2 id="statement-heading" className="eyebrow text-muted-foreground">
              Statement
            </h2>
            {site.statement.length > 0 ? (
              <div className="mt-3 max-w-[60ch] space-y-5 text-lg leading-relaxed">
                {site.statement.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <p className={placeholder}>Statement to follow.</p>
            )}
          </section>

          <section aria-labelledby="cv-heading">
            <h2 id="cv-heading" className="eyebrow text-muted-foreground">
              CV
            </h2>
            {sections.length > 0 ? (
              <div className="mt-3 space-y-12">
                {sections.map((section) => (
                  <div key={section.title}>
                    <h3 className="text-xl">{section.title}</h3>
                    <ul className="mt-4 border-t border-foreground/15">
                      {section.entries.map((entry) => (
                        <li
                          key={`${entry.year}-${entry.title}`}
                          className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-4 border-b border-foreground/15 py-3.5"
                        >
                          <span className="font-mono text-xs leading-6 text-muted-foreground">
                            {entry.year}
                          </span>
                          <span>
                            <span className="block">{entry.title}</span>
                            {(entry.detail || entry.venue) && (
                              <span className="block text-sm text-muted-foreground">
                                {[entry.detail, entry.venue]
                                  .filter(Boolean)
                                  .join(", ")}
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className={placeholder}>CV to follow.</p>
            )}
          </section>
        </div>
      </PageShell>
    </PageTransition>
  )
}
