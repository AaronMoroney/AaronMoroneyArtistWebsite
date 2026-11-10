import type { Artwork, Exhibition } from "@/lib/content"
import { detailRows, exhibitionPlace, hasDetails } from "@/lib/format"
import { cn } from "@/lib/utils"

const labelClass =
  "font-mono text-[0.6875rem] leading-5 tracking-[0.14em] text-muted-foreground uppercase"

function ExhibitionEntry({ exhibition }: { exhibition: Exhibition }) {
  const context = [
    exhibition.kind,
    exhibition.curator && `curated by ${exhibition.curator}`,
  ]
    .filter(Boolean)
    .join(", ")
  const place = exhibitionPlace(exhibition)

  return (
    <li>
      <span className="block">{exhibition.title}</span>
      {context && (
        <span className="block text-muted-foreground first-letter:uppercase">
          {context}
        </span>
      )}
      {place && <span className="block text-muted-foreground">{place}</span>}
    </li>
  )
}

/* Medium, status, price, exhibition history and the short text for a work.
   Used by the Explore card, the phone sheet and the artwork page, so the
   three always show the same information. */
export function ArtworkDetails({
  work,
  className,
}: {
  work: Artwork
  className?: string
}) {
  if (!hasDetails(work)) {
    return (
      <p className={cn("font-mono text-xs text-muted-foreground", className)}>
        Details to follow.
      </p>
    )
  }

  const rows = detailRows(work)
  const paragraphs = work.blurb.split(/\n\s*\n/).filter(Boolean)

  return (
    <div className={cn("space-y-5", className)}>
      {paragraphs.length > 0 && (
        <div className="space-y-3 text-sm leading-relaxed">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      )}

      {(rows.length > 0 || work.exhibitions.length > 0) && (
        <dl className="border-t border-foreground/15 text-sm leading-5">
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[6.25rem_minmax(0,1fr)] gap-3 border-b border-foreground/15 py-2.5"
            >
              <dt className={labelClass}>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
          {work.exhibitions.length > 0 && (
            <div className="grid grid-cols-[6.25rem_minmax(0,1fr)] gap-3 border-b border-foreground/15 py-2.5">
              <dt className={labelClass}>Exhibited</dt>
              <dd>
                <ul className="space-y-3">
                  {work.exhibitions.map((exhibition) => (
                    <ExhibitionEntry
                      key={`${exhibition.title}-${exhibition.date}`}
                      exhibition={exhibition}
                    />
                  ))}
                </ul>
              </dd>
            </div>
          )}
        </dl>
      )}
    </div>
  )
}
